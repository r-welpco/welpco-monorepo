"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Popover, PopoverTrigger, PopoverContent } from "@welpco/ui/popover";
import { IconButton } from "@welpco/ui/icon-button";
import { Badge } from "@welpco/ui/badge";
import { Box } from "@welpco/ui/box";
import { NotificationCenter } from "@welpco/ui/platform/notification";
import type { NotificationCardProps } from "@welpco/ui/platform/notification";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/lib/hooks/use-notifications";
import type { NotificationItem } from "@/lib/services/notification-service";

// NOTIFICATIONS-001 + NOTIFICATIONS-002 (Day 16 dispatch 2): keep this map
// in lock-step with `apps/web/app/(dashboard)/dashboard/notifications/page-client.tsx`.
// `message` and `dispute` are new — without these the popover would fall
// back to `info` and lose semantic colour.
const CATEGORY_TO_TYPE: Record<string, NotificationCardProps["type"]> = {
  booking: "booking",
  payment: "payment",
  review: "info",
  message: "message",
  dispute: "warning",
  security: "warning",
  system: "info",
};

function mapToCardProps(item: NotificationItem): NotificationCardProps {
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
    timestamp: formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }),
    isRead: item.isRead,
    actionLabel: actionUrl ? "View" : undefined,
  };
}

export interface NotificationBellPopoverProps {
  badgeColor?: "blue" | "green";
}

/**
 * Fetches the notification list only while the popover is open; badge count uses the lightweight unread endpoint.
 */
export function NotificationBellPopover({ badgeColor = "blue" }: NotificationBellPopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: unreadData } = useUnreadCount();
  const { data: listData, isLoading: notificationsLoading } = useNotifications({
    limit: 50,
    enabled: open,
  });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notificationCount = unreadData?.count ?? 0;
  const notifications = useMemo(
    () => (listData?.items ?? []).map(mapToCardProps),
    [listData?.items]
  );

  const handleNotificationAction = useCallback(
    (id: string) => {
      const item = listData?.items?.find((n) => n.id === id);
      const actionUrl =
        item?.metadata && typeof item.metadata.actionUrl === "string"
          ? item.metadata.actionUrl
          : undefined;
      if (actionUrl) router.push(actionUrl);
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

  return (
    <Box style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <IconButton
            variant="ghost"
            size="3"
            aria-label={
              notificationCount > 0 ? `Notifications (${notificationCount} unread)` : "Notifications"
            }
          >
            <Bell size={20} />
          </IconButton>
        </PopoverTrigger>
        <PopoverContent style={{ padding: 0, width: 560 }}>
          <NotificationCenter
            notifications={notifications}
            unreadCount={notificationCount}
            loading={notificationsLoading}
            onMarkAllRead={notificationCount > 0 ? handleMarkAllRead : undefined}
            onNotificationAction={handleNotificationAction}
            onMarkRead={handleMarkRead}
            compact
          />
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
