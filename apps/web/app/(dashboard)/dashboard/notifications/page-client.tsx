"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { NotificationCenter } from "@welpco/ui/platform/notification";
import type { NotificationCardProps } from "@welpco/ui/platform/notification";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useClearAllNotifications,
} from "@/lib/hooks/use-notifications";
import type { NotificationItem } from "@/lib/services/notification-service";
import { formatDistanceToNow } from "date-fns";
import type { Locale } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import { useDashboardNotificationLabels } from "@/lib/i18n/use-dashboard-labels";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";
import { normalizeDashboardActionUrl } from "@/lib/i18n/dashboard-navigation";

// NOTIFICATIONS-001 + NOTIFICATIONS-002 (Day 16 dispatch 2): map every BFF
// `NotificationCategory` to a card visual type. `message` and `dispute` are
// new — the BFF emits them today; without these entries the cards would
// fall back to `info` and lose their semantic colour.
const CATEGORY_TO_TYPE: Record<string, NotificationCardProps["type"]> = {
  booking: "booking",
  payment: "payment",
  review: "info",
  message: "message",
  dispute: "warning",
  security: "warning",
  system: "info",
};

function mapToCardProps(
  item: NotificationItem,
  viewLabel: string,
  dateLocale?: Locale,
): NotificationCardProps {
  const type = CATEGORY_TO_TYPE[item.category] ?? "info";
  const actionUrl =
    item.metadata && typeof item.metadata.actionUrl === "string"
      ? item.metadata.actionUrl
      : undefined;
  return {
    id: item.id,
    title: item.title,
    message: item.body,
    type,
    timestamp: formatDistanceToNow(new Date(item.createdAt), {
      addSuffix: true,
      locale: dateLocale,
    }),
    isRead: item.isRead,
    actionLabel: actionUrl ? viewLabel : undefined,
  };
}

export default function NotificationsPageClient() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isWelper = user?.role === "welper";
  const notificationLabels = useDashboardNotificationLabels();
  const dateFnsLocale = useDateFnsLocale();
  const dateLocale = isWelper ? dateFnsLocale : undefined;

  const { data: listData, isLoading } = useNotifications({ limit: 50 });
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const clearAll = useClearAllNotifications();

  const notifications = useMemo(
    () =>
      (listData?.items ?? []).map((item) =>
        mapToCardProps(item, isWelper ? notificationLabels.view : "View", dateLocale),
      ),
    [listData?.items, isWelper, notificationLabels.view, dateLocale],
  );
  const unreadCount = unreadData?.count ?? 0;

  const centerLabels = isWelper
    ? {
        title: notificationLabels.title,
        subtitle: notificationLabels.subtitle,
        markAllRead: notificationLabels.markAllRead,
        clearAll: notificationLabels.clearAll,
        unreadAria: notificationLabels.unreadCount,
        showAll: notificationLabels.showAll,
        emptyAllTitle: notificationLabels.emptyAllTitle,
        emptyUnreadTitle: notificationLabels.emptyUnreadTitle,
        emptyAllDescription: notificationLabels.emptyAllDescription,
        emptyUnreadDescription: notificationLabels.emptyUnreadDescription,
      }
    : undefined;

  const handleNotificationAction = useCallback(
    (id: string) => {
      const item = listData?.items?.find((n) => n.id === id);
      const actionUrl =
        item?.metadata && typeof item.metadata.actionUrl === "string"
          ? item.metadata.actionUrl
          : undefined;
      if (actionUrl) router.push(normalizeDashboardActionUrl(actionUrl));
    },
    [router, listData?.items],
  );

  const handleMarkRead = useCallback(
    (id: string) => {
      markAsRead.mutate(id);
    },
    [markAsRead],
  );

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  const handleClearAll = useCallback(() => {
    clearAll.mutate();
  }, [clearAll]);

  const listCount = notifications.length;
  const actionsBusy = markAllAsRead.isPending || clearAll.isPending;

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" align="center">
        <NotificationCenter
          notifications={notifications}
          unreadCount={unreadCount}
          loading={isLoading}
          clearing={actionsBusy}
          onMarkAllRead={unreadCount > 0 ? handleMarkAllRead : undefined}
          onClearAll={listCount > 0 ? handleClearAll : undefined}
          onNotificationAction={handleNotificationAction}
          onMarkRead={handleMarkRead}
          labels={centerLabels}
        />
      </Flex>
    </Container>
  );
}
