"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Popover, PopoverTrigger, PopoverContent } from "@welpco/ui/popover";
import { Badge } from "@welpco/ui/badge";
import { Box } from "@welpco/ui/box";
import { NotificationCenter } from "@welpco/ui/platform/notification";
import { Bell } from "lucide-react";
import {
  DashboardHeaderIconTrigger,
  DASHBOARD_HEADER_GLYPH_SIZE,
} from "@/components/layout/dashboard-header-icon-trigger";
import { useDashboardNotificationLabels } from "@/lib/i18n/use-dashboard-labels";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";
import { normalizeDashboardActionUrl } from "@/lib/i18n/dashboard-navigation";
import {
  getNotificationActionUrl,
  mapNotificationToCardProps,
} from "@/lib/notifications/notification-card-mapper";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useClearAllNotifications,
} from "@/lib/hooks/use-notifications";
import type { NotificationItem } from "@/lib/services/notification-service";

function mapToCardProps(
  item: NotificationItem,
  viewLabel: string,
  dateLocale?: import("date-fns").Locale,
) {
  return mapNotificationToCardProps(item, { viewLabel, dateLocale });
}

export interface NotificationBellPopoverProps {
  badgeColor?: "blue" | "green";
}

/**
 * Fetches the notification list only while the popover is open; badge count uses the lightweight unread endpoint.
 */
export function NotificationBellPopover({ badgeColor = "blue" }: NotificationBellPopoverProps) {
  const router = useRouter();
  const notificationLabels = useDashboardNotificationLabels();
  const dateFnsLocale = useDateFnsLocale();
  const [open, setOpen] = useState(false);
  const { data: unreadData } = useUnreadCount();
  const { data: listData, isLoading: notificationsLoading } = useNotifications({
    limit: 50,
    enabled: open,
  });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const clearAll = useClearAllNotifications();

  const notificationCount = unreadData?.count ?? 0;
  const notifications = useMemo(
    () =>
      (listData?.items ?? []).map((item) =>
        mapToCardProps(item, notificationLabels.view, dateFnsLocale),
      ),
    [listData?.items, notificationLabels.view, dateFnsLocale],
  );

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
    [router, listData?.items]
  );

  const handleMarkRead = useCallback(
    (id: string) => {
      markAsRead.mutate(id);
    },
    [markAsRead]
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
    <Box style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <DashboardHeaderIconTrigger
            aria-label={
              notificationCount > 0
                ? notificationLabels.bellUnreadAria(notificationCount)
                : notificationLabels.bellAria
            }
          >
            <Bell size={DASHBOARD_HEADER_GLYPH_SIZE} />
          </DashboardHeaderIconTrigger>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          collisionPadding={12}
          style={{
            padding: 0,
            width: 560,
            height: "min(80vh, 480px)",
            maxHeight:
              "min(480px, var(--radix-popover-content-available-height, var(--radix-popper-available-height, 80vh)))",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
        >
          <Box style={{ flex: 1, minHeight: 0, height: "100%", overflow: "hidden" }}>
            <NotificationCenter
              notifications={notifications}
              unreadCount={notificationCount}
              loading={notificationsLoading}
              clearing={actionsBusy}
              onMarkAllRead={notificationCount > 0 ? handleMarkAllRead : undefined}
              onClearAll={listCount > 0 ? handleClearAll : undefined}
              onNotificationAction={handleNotificationAction}
              onMarkRead={handleMarkRead}
              labels={centerLabels}
              compact
            />
          </Box>
        </PopoverContent>
      </Popover>
      {notificationCount > 0 && (
        <Badge
          color={badgeColor}
          variant="solid"
          size="1"
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 16,
            height: 16,
            padding: 0,
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-2)",
            pointerEvents: "none",
          }}
        >
          {notificationCount > 99 ? "99+" : notificationCount}
        </Badge>
      )}
    </Box>
  );
}
