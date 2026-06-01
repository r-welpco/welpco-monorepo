import { apiClient } from "@/lib/api/client";

// ─── Types ──────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  userId: string;
  channel: string;
  category: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationListParams {
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationPreferenceItem {
  id: string;
  category: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

export interface UpdatePreferenceItem {
  category: string;
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
}

// ─── API ──────────────────────────────────────────────────────────────────

export async function getNotifications(
  params?: NotificationListParams
): Promise<NotificationListResponse> {
  return apiClient.get<NotificationListResponse>("/api/notifications", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiClient.get<UnreadCountResponse>("/api/notifications/unread-count");
}

export async function markAsRead(notificationId: string): Promise<NotificationItem> {
  return apiClient.post<NotificationItem>(`/api/notifications/${notificationId}/read`);
}

export async function markAllAsRead(): Promise<void> {
  return apiClient.post<void>("/api/notifications/read-all");
}

export async function clearAllNotifications(): Promise<void> {
  return apiClient.post<void>("/api/notifications/clear-all");
}

export async function getNotificationPreferences(): Promise<NotificationPreferenceItem[]> {
  return apiClient.get<NotificationPreferenceItem[]>("/api/notifications/preferences");
}

export async function updateNotificationPreferences(
  preferences: UpdatePreferenceItem[]
): Promise<NotificationPreferenceItem[]> {
  return apiClient.put<NotificationPreferenceItem[]>("/api/notifications/preferences", {
    preferences,
  });
}
