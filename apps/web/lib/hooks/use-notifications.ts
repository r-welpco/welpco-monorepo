import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getNotifications,
  getUnreadCount,
  markAsRead as markAsReadApi,
  markAllAsRead as markAllAsReadApi,
  clearAllNotifications as clearAllNotificationsApi,
  getNotificationPreferences,
  updateNotificationPreferences as updateNotificationPreferencesApi,
  type NotificationListParams,
  type UpdatePreferenceItem,
} from "@/lib/services/notification-service";

function useIsAuthenticated(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

// ─── Queries ────────────────────────────────────────────────────────────

export function useNotifications(
  params: NotificationListParams & { enabled?: boolean } = {}
) {
  const { enabled: enabledOption = true, ...listParams } = params;
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["notifications", listParams],
    queryFn: () => getNotifications(listParams),
    enabled: isAuthenticated && enabledOption,
    staleTime: 60 * 1000,
  });
}

/** Unread count; polls every 30 seconds when authenticated. */
export function useUnreadCount() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30 * 1000,
    staleTime: 10 * 1000,
  });
}

export function useNotificationPreferences() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () => getNotificationPreferences(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markAsReadApi(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllAsReadApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearAllNotificationsApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: UpdatePreferenceItem[]) =>
      updateNotificationPreferencesApi(preferences),
    onSuccess: (data) => {
      queryClient.setQueryData(["notifications", "preferences"], data);
    },
  });
}
