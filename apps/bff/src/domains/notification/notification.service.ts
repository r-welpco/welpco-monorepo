import { Injectable, Logger, Optional, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  getDisputeNotificationCopy,
  getPaymentNotificationCopy,
} from '@welpco/email';
import type {
  DisputeEmailType,
  DisputeEmailVariables,
  EmailLocale,
  PaymentEmailType,
  PaymentEmailVariables,
} from '@welpco/email';
import {
  Notification,
  NotificationPreference,
  NotificationChannel,
  NotificationCategory,
} from './entities';
import { UserAccount } from '../user-management/entities/user-account.entity';
import type { UserPreferredLocale } from '../../common/preferred-locale';
import {
  resolveUserLocale,
  buildBookingActionUrl,
  buildDisputeActionUrl,
  getFrontendBaseUrl,
} from './notification-locale.helper';

const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

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
  paymentEmailType?: PaymentEmailType;
  paymentEmailVariables?: PaymentEmailVariables;
  disputeEmailType?: DisputeEmailType;
  disputeEmailVariables?: DisputeEmailVariables;
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

export interface EmitForUserParams {
  category: NotificationCategory;
  link?: string;
  metadata?: Record<string, unknown>;
  /** Legacy plain copy — prefer paymentEmailType / disputeEmailType. */
  title?: string;
  body?: string;
  paymentEmailType?: PaymentEmailType;
  paymentEmailVariables?: PaymentEmailVariables;
  disputeEmailType?: DisputeEmailType;
  disputeEmailVariables?: DisputeEmailVariables;
}

export interface IEmailNotificationService {
  sendNotificationEmail(userId: string, subject: string, html: string): Promise<void>;
  sendGenericNotificationEmail?(
    userId: string,
    params: {
      title: string;
      body: string;
      actionUrl?: string;
      locale?: EmailLocale;
      category?: NotificationCategory;
    },
  ): Promise<void>;
  sendBookingEmailForUser?(userId: string, type: string, variables: Record<string, string | undefined>): Promise<void>;
  sendPaymentEmailForUser?(userId: string, type: PaymentEmailType, variables: PaymentEmailVariables): Promise<void>;
  sendDisputeEmailForUser?(userId: string, type: DisputeEmailType, variables: DisputeEmailVariables): Promise<void>;
  resolveLocaleForUser?(userId: string): Promise<EmailLocale>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepo: Repository<NotificationPreference>,
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    @Optional()
    @Inject(EMAIL_NOTIFICATION_SERVICE)
    private readonly emailNotificationService?: IEmailNotificationService,
  ) {}

  async resolveLocaleForUser(userId: string): Promise<UserPreferredLocale> {
    return resolveUserLocale(this.userRepo, userId);
  }

  async emitForUser(userId: string, params: EmitForUserParams): Promise<Notification | null> {
    const {
      category,
      metadata,
      paymentEmailType,
      paymentEmailVariables,
      disputeEmailType,
      disputeEmailVariables,
    } = params;

    const locale = await resolveUserLocale(this.userRepo, userId);
    let title = params.title ?? '';
    let body = params.body ?? '';

    let paymentVars = paymentEmailVariables ? { ...paymentEmailVariables } : undefined;
    let disputeVars = disputeEmailVariables ? { ...disputeEmailVariables } : undefined;

    const bookingId = metadata?.bookingId as string | undefined;
    const disputeId = metadata?.disputeId as string | undefined;
    let actionLink = params.link;
    if (!actionLink && bookingId) {
      actionLink = buildBookingActionUrl(getFrontendBaseUrl(), bookingId, locale);
    } else if (!actionLink && disputeId) {
      actionLink = buildDisputeActionUrl(getFrontendBaseUrl(), disputeId, locale);
    }

    if (paymentEmailType && paymentVars) {
      const copy = getPaymentNotificationCopy(paymentEmailType, locale, paymentVars);
      title = copy.title;
      body = copy.body;
      if (actionLink) paymentVars.bookingUrl = actionLink;
    } else if (disputeEmailType && disputeVars) {
      const copy = getDisputeNotificationCopy(disputeEmailType, locale, disputeVars);
      title = copy.title;
      body = copy.body;
      if (actionLink) disputeVars.disputeUrl = actionLink;
    }

    const mergedMeta: Record<string, unknown> = {
      ...(metadata ?? {}),
    };
    if (actionLink && mergedMeta.actionUrl == null) {
      mergedMeta.actionUrl = actionLink;
    }

    try {
      return await this.send({
        userId,
        category,
        title,
        body,
        paymentEmailType,
        paymentEmailVariables: paymentVars,
        disputeEmailType,
        disputeEmailVariables: disputeVars,
        metadata: mergedMeta,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to emit notification for user ${userId} (${category}): ${(err as Error).message}`,
      );
      return null;
    }
  }

  async send(params: SendNotificationParams): Promise<Notification | null> {
    const {
      userId,
      category,
      title,
      body,
      emailSubject,
      emailHtml,
      bookingEmailType,
      bookingEmailVariables,
      paymentEmailType,
      paymentEmailVariables,
      disputeEmailType,
      disputeEmailVariables,
      metadata,
    } = params;

    const bookingId = metadata?.bookingId as string | undefined;
    const kind = metadata?.kind as string | undefined;
    if (bookingId && (await this.isDuplicate(userId, category, bookingId, kind))) {
      this.logger.debug(
        `Skipping duplicate notification userId=${userId} category=${category} bookingId=${bookingId} kind=${kind ?? ''}`,
      );
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
        } else if (paymentEmailType && paymentEmailVariables && this.emailNotificationService.sendPaymentEmailForUser) {
          await this.emailNotificationService.sendPaymentEmailForUser(userId, paymentEmailType, paymentEmailVariables);
        } else if (disputeEmailType && disputeEmailVariables && this.emailNotificationService.sendDisputeEmailForUser) {
          await this.emailNotificationService.sendDisputeEmailForUser(userId, disputeEmailType, disputeEmailVariables);
        } else if (
          title &&
          body &&
          this.emailNotificationService.sendGenericNotificationEmail
        ) {
          const locale = await resolveUserLocale(this.userRepo, userId);
          const actionUrl = metadata?.actionUrl as string | undefined;
          await this.emailNotificationService.sendGenericNotificationEmail(userId, {
            title,
            body,
            actionUrl,
            locale: locale as EmailLocale,
            category,
          });
        } else if (emailSubject && emailHtml) {
          await this.emailNotificationService.sendNotificationEmail(userId, emailSubject, emailHtml);
        }
      } catch (err) {
        this.logger.warn(`Failed to send notification email to user ${userId}: ${(err as Error).message}`);
      }
    }

    return notification;
  }

  private async isDuplicate(
    userId: string,
    category: string,
    bookingId: string,
    kind?: string,
  ): Promise<boolean> {
    const since = new Date(Date.now() - DEDUP_WINDOW_MS);
    const qb = this.notificationRepo
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.category = :category', { category })
      .andWhere('n.created_at > :since', { since })
      .andWhere("n.metadata->>'bookingId' = :bookingId", { bookingId });

    if (kind) {
      qb.andWhere("COALESCE(n.metadata->>'kind', '') = :kind", { kind });
    } else {
      qb.andWhere("(n.metadata->>'kind' IS NULL OR n.metadata->>'kind' = '')");
    }

    const count = await qb.getCount();
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

  /** Removes all in-app notifications for the user; preferences are unchanged. */
  async clearAllNotifications(userId: string): Promise<void> {
    await this.notificationRepo.delete({ userId });
  }

  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    const categories = Object.values(NotificationCategory);

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
