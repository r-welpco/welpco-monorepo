"use client";

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
} from "@/lib/hooks/use-notifications";
import type { NotificationItem } from "@/lib/services/notification-service";
import { formatDistanceToNow } from "date-fns";

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

export default function NotificationsPageClient() {
  const router = useRouter();
  const { data: listData, isLoading } = useNotifications({ limit: 50 });
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = (listData?.items ?? []).map(mapToCardProps);
  const unreadCount = unreadData?.count ?? 0;

  const handleNotificationAction = (id: string) => {
    const item = listData?.items?.find((n) => n.id === id);
    const actionUrl =
      item?.metadata && typeof item.metadata.actionUrl === "string"
        ? item.metadata.actionUrl
        : undefined;
    if (actionUrl) router.push(actionUrl);
  };

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" align="center">
        <NotificationCenter
          notifications={notifications}
          unreadCount={unreadCount}
          loading={isLoading}
          onMarkAllRead={unreadCount > 0 ? handleMarkAllRead : undefined}
          onNotificationAction={handleNotificationAction}
          onMarkRead={handleMarkRead}
        />
      </Flex>
    </Container>
  );
}
