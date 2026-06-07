"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { NotificationCenter } from "@welpco/ui/platform/notification";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useClearAllNotifications,
} from "@/lib/hooks/use-notifications";
import type { NotificationItem } from "@/lib/services/notification-service";
import type { Locale } from "date-fns";
import { useDashboardNotificationLabels } from "@/lib/i18n/use-dashboard-labels";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";
import { normalizeDashboardActionUrl } from "@/lib/i18n/dashboard-navigation";
import { mapNotificationToCardProps } from "@/lib/notifications/notification-card-mapper";

function mapToCardProps(
  item: NotificationItem,
  viewLabel: string,
  dateLocale?: Locale,
) {
  return mapNotificationToCardProps(item, { viewLabel, dateLocale });
}

export default function NotificationsPageClient() {
  const router = useRouter();
  const notificationLabels = useDashboardNotificationLabels();
  const dateFnsLocale = useDateFnsLocale();

  const { data: listData, isLoading } = useNotifications({ limit: 50 });
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const clearAll = useClearAllNotifications();

  const notifications = useMemo(
    () =>
      (listData?.items ?? []).map((item) =>
        mapToCardProps(item, notificationLabels.view, dateFnsLocale),
      ),
    [listData?.items, notificationLabels.view, dateFnsLocale],
  );
  const unreadCount = unreadData?.count ?? 0;

  const centerLabels = {
    title: notificationLabels.title,
    subtitle: notificationLabels.subtitle,
    markAllRead: notificationLabels.markAllRead,
    markAsRead: notificationLabels.markAsRead,
    newBadge: notificationLabels.newBadge,
    clearAll: notificationLabels.clearAll,
    unreadAria: notificationLabels.unreadCount,
    showAll: notificationLabels.showAll,
    emptyAllTitle: notificationLabels.emptyAllTitle,
    emptyUnreadTitle: notificationLabels.emptyUnreadTitle,
    emptyAllDescription: notificationLabels.emptyAllDescription,
    emptyUnreadDescription: notificationLabels.emptyUnreadDescription,
  };

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
