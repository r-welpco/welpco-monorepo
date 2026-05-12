import { apiClient } from "@/lib/api/client";

export interface AdminNotification {
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
}

export interface AdminNotificationsResponse {
  items: AdminNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listAdminNotifications(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  channel?: string;
  category?: string;
}): Promise<AdminNotificationsResponse> {
  return apiClient.get<AdminNotificationsResponse>("/api/admin/notifications", { params: { ...params } });
}
