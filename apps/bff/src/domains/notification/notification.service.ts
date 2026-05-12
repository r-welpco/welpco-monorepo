import { Injectable, Logger, Optional, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationPreference,
  NotificationChannel,
  NotificationCategory,
} from './entities';

const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/** Minimal HTML escape — we never inject user-controlled content into emails today, but keep the contract honest. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const EMAIL_NOTIFICATION_SERVICE = 'EMAIL_NOTIFICATION_SERVICE';

export interface SendNotificationParams {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  emailSubject?: string;
  emailHtml?: string;
  /** When set, sends the booking email template (respects email preference). */
  bookingEmailType?: string;
  bookingEmailVariables?: Record<string, string | undefined>;
  metadata?: Record<string, unknown>;
}

export interface NotificationFilters {
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationListResult {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
}

export interface PreferenceUpdate {
  category: NotificationCategory;
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
}

export interface IEmailNotificationService {
  sendNotificationEmail(userId: string, subject: string, html: string): Promise<void>;
  sendBookingEmailForUser?(userId: string, type: string, variables: Record<string, string | undefined>): Promise<void>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepo: Repository<NotificationPreference>,
    @Optional()
    @Inject(EMAIL_NOTIFICATION_SERVICE)
    private readonly emailNotificationService?: IEmailNotificationService,
  ) {}

  /**
   * NOTIFICATIONS-001 (Day 16 dispatch 2): single shared emit helper for
   * non-booking domains. Mirrors the booking-domain emit shape but skips the
   * booking-email template machinery — most domain events ship as a plain
   * subject + html email built from the same `title`/`body` strings.
   *
   * Preference enforcement contract (bible §22.6):
   *   1. Look up the recipient's `notificationPreferences` row for `category`.
   *   2. Always create the in-app row IF `inAppEnabled` is true (so the bell
   *      and the center surface it).
   *   3. Send email IF `emailEnabled` is true AND an email service is wired.
   *   4. If both off, skip entirely — the user has explicitly opted out.
   *   5. Defaults are TRUE-on-both per the Wave 3 default-true policy; rows
   *      get auto-upserted on first `getPreferences` call.
   *
   * Each emit site provides:
   *   - `category` for filtering
   *   - short, action-oriented `title` (bible §22 voice)
   *   - 1-2 sentence `body` with concrete context
   *   - `link` deep-link rendered as the `<NotificationCard>` click-through
   *     (stored under `metadata.actionUrl` to match the booking template)
   *
   * Errors caught + logged, never propagated — a notification failure must
   * not roll back a domain write that already succeeded.
   */
  async emitForUser(
    userId: string,
    params: { category: NotificationCategory; title: string; body: string; link?: string; metadata?: Record<string, unknown> },
  ): Promise<Notification | null> {
    const { category, title, body, link, metadata } = params;
    const mergedMeta: Record<string, unknown> = {
      ...(metadata ?? {}),
    };
    if (link && mergedMeta.actionUrl == null) {
      mergedMeta.actionUrl = link;
    }
    try {
      return await this.send({
        userId,
        category,
        title,
        body,
        emailSubject: title,
        emailHtml: this.buildSimpleEmailHtml(title, body, link),
        metadata: mergedMeta,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to emit notification for user ${userId} (${category}): ${(err as Error).message}`,
      );
      return null;
    }
  }

  /** Minimal plain-text-friendly HTML body for non-booking emails. */
  private buildSimpleEmailHtml(title: string, body: string, link?: string): string {
    const safeTitle = escapeHtml(title);
    const safeBody = escapeHtml(body);
    const cta = link
      ? `<p style="margin-top:16px"><a href="${escapeHtml(link)}" style="color:#2563eb">Open in Welpco</a></p>`
      : '';
    return `<div><h2 style="margin:0 0 12px">${safeTitle}</h2><p style="margin:0">${safeBody}</p>${cta}</div>`;
  }

  async send(params: SendNotificationParams): Promise<Notification | null> {
    const { userId, category, title, body, emailSubject, emailHtml, bookingEmailType, bookingEmailVariables, metadata } = params;

    const bookingId = metadata?.bookingId as string | undefined;
    if (bookingId && (await this.isDuplicate(userId, category, bookingId))) {
      this.logger.debug(`Skipping duplicate notification userId=${userId} category=${category} bookingId=${bookingId}`);
      return null;
    }

    const inApp = await this.preferenceRepo.findOne({ where: { userId, category } });
    const inAppEnabled = inApp?.inAppEnabled ?? true;

    let notification: Notification | null = null;
    if (inAppEnabled) {
      notification = this.notificationRepo.create({
        userId,
        channel: NotificationChannel.IN_APP,
        category,
        title,
        body,
        metadata: metadata ?? null,
      });
      notification = await this.notificationRepo.save(notification);
    }

    const emailEnabled = inApp?.emailEnabled ?? true;
    if (emailEnabled && this.emailNotificationService) {
      try {
        if (bookingEmailType && bookingEmailVariables && this.emailNotificationService.sendBookingEmailForUser) {
          await this.emailNotificationService.sendBookingEmailForUser(userId, bookingEmailType, bookingEmailVariables);
        } else if (emailSubject && emailHtml) {
          await this.emailNotificationService.sendNotificationEmail(userId, emailSubject, emailHtml);
        }
      } catch (err) {
        this.logger.warn(`Failed to send notification email to user ${userId}: ${(err as Error).message}`);
      }
    }

    return notification;
  }

  private async isDuplicate(userId: string, category: string, bookingId: string): Promise<boolean> {
    const since = new Date(Date.now() - DEDUP_WINDOW_MS);
    const count = await this.notificationRepo
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.category = :category', { category })
      .andWhere('n.created_at > :since', { since })
      .andWhere("n.metadata->>'bookingId' = :bookingId", { bookingId })
      .getCount();
    return count > 0;
  }

  async findAll(userId: string, filters: NotificationFilters = {}): Promise<NotificationListResult> {
    const page = Math.max(1, filters.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, filters.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const qb = this.notificationRepo
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .orderBy('n.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters.isRead !== undefined) {
      qb.andWhere('n.is_read = :isRead', { isRead: filters.isRead });
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    const categories = Object.values(NotificationCategory);

    // Upsert all missing preferences in one batch to avoid race conditions
    // when two concurrent requests try to create the same preference row.
    const toUpsert = categories.map((category) => ({
      userId,
      category,
      emailEnabled: true,
      inAppEnabled: true,
    }));

    await this.preferenceRepo.upsert(toUpsert, {
      conflictPaths: ['userId', 'category'],
    });

    return this.preferenceRepo.find({
      where: { userId },
      order: { category: 'ASC' },
    });
  }

  async updatePreferences(userId: string, updates: PreferenceUpdate[]): Promise<NotificationPreference[]> {
    for (const u of updates) {
      const existing = await this.preferenceRepo.findOne({ where: { userId, category: u.category } });
      const emailEnabled = u.emailEnabled !== undefined ? u.emailEnabled : (existing?.emailEnabled ?? true);
      const inAppEnabled = u.inAppEnabled !== undefined ? u.inAppEnabled : (existing?.inAppEnabled ?? true);
      await this.preferenceRepo.upsert(
        {
          userId,
          category: u.category,
          emailEnabled,
          inAppEnabled,
        },
        { conflictPaths: ['userId', 'category'] },
      );
    }
    return this.getPreferences(userId);
  }

  async deleteForUser(userId: string): Promise<void> {
    await this.notificationRepo.delete({ userId });
    await this.preferenceRepo.delete({ userId });
  }
}
