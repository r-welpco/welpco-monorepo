import { Injectable } from '@nestjs/common';
import { NotificationService as DomainNotificationService } from '../../domains/notification/notification.service';
import type { NotificationFilters, PreferenceUpdate } from '../../domains/notification/notification.service';
import { NotificationCategory } from '../../domains/notification/entities';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationService: DomainNotificationService) {}

  async getNotifications(userId: string, query: { isRead?: boolean; page?: number; limit?: number }) {
    const filters: NotificationFilters = {
      isRead: query.isRead,
      page: query.page,
      limit: query.limit,
    };
    const result = await this.notificationService.findAll(userId, filters);
    return {
      items: result.items.map((n) => ({
        id: n.id,
        userId: n.userId,
        channel: n.channel,
        category: n.category,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        readAt: n.readAt?.toISOString() ?? null,
        metadata: n.metadata,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const n = await this.notificationService.markAsRead(userId, notificationId);
    return {
      id: n.id,
      userId: n.userId,
      channel: n.channel,
      category: n.category,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      readAt: n.readAt?.toISOString() ?? null,
      metadata: n.metadata,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    };
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationService.markAllAsRead(userId);
  }

  async getPreferences(userId: string) {
    const list = await this.notificationService.getPreferences(userId);
    return list.map((p) => ({
      id: p.id,
      category: p.category,
      emailEnabled: p.emailEnabled,
      inAppEnabled: p.inAppEnabled,
    }));
  }

  async updatePreferences(userId: string, body: { preferences: Array<{ category: NotificationCategory; emailEnabled?: boolean; inAppEnabled?: boolean }> }) {
    const updates: PreferenceUpdate[] = body.preferences.map((p) => ({
      category: p.category,
      emailEnabled: p.emailEnabled,
      inAppEnabled: p.inAppEnabled,
    }));
    const list = await this.notificationService.updatePreferences(userId, updates);
    return list.map((p) => ({
      id: p.id,
      category: p.category,
      emailEnabled: p.emailEnabled,
      inAppEnabled: p.inAppEnabled,
    }));
  }
}
