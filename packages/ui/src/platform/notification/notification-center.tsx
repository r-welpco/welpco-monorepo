"use client";

import { Card } from "@radix-ui/themes";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Separator } from "@welpco/ui/separator";
import { Switch } from "@welpco/ui/switch";
import { Badge } from "@welpco/ui/badge";
import { Skeleton } from "@welpco/ui/skeleton";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Bell } from "lucide-react";
import { NotificationCard, type NotificationCardProps } from "./notification-card";
import { useState, type CSSProperties } from "react";

export type NotificationCenterLabels = {
  title: string;
  subtitle?: string;
  markAllRead: string;
  clearAll: string;
  showAll: string;
  unreadAria: (count: number) => string;
  emptyAllTitle: string;
  emptyUnreadTitle: string;
  emptyAllDescription: string;
  emptyUnreadDescription: string;
};

export interface NotificationCenterProps {
  notifications: NotificationCardProps[];
  unreadCount?: number;
  loading?: boolean;
  /** When true, uses smaller height for dropdown/popover (e.g. maxHeight ~480px) */
  compact?: boolean;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  clearing?: boolean;
  onNotificationAction?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  labels?: NotificationCenterLabels;
}

/**
 * Notification list — used both as a full page (`compact={false}`) and as a
 * popover content (`compact`). Unread-only by default; toggle shows all.
 */
export function NotificationCenter({
  notifications,
  unreadCount = 0,
  loading,
  compact,
  onMarkAllRead,
  onClearAll,
  clearing,
  onNotificationAction,
  onMarkRead,
  labels,
}: NotificationCenterProps) {
  const [showAll, setShowAll] = useState(false);

  const shellStyle: CSSProperties = compact
    ? {
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        minHeight: 0,
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        overflow: "hidden",
      }
    : {
        width: "100%",
        maxWidth: "600px",
        height: "700px",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        overflow: "hidden",
      };

  const chromePadding = compact
    ? { px: "4" as const, pt: "4" as const, pb: "3" as const }
    : { px: "5" as const, pt: "5" as const, pb: "4" as const };

  const listScrollStyle: CSSProperties = {
    minHeight: 0,
    overflowY: "auto",
    overflowX: "hidden",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
    touchAction: "pan-y",
  };

  const filteredNotifications = showAll
    ? notifications
    : notifications.filter((n) => !n.isRead);

  const showEmpty = !loading && filteredNotifications.length === 0;
  const emptyTitle = showAll
    ? (labels?.emptyAllTitle ?? "No notifications yet")
    : (labels?.emptyUnreadTitle ?? "No unread notifications");
  const emptyDescription = showAll
    ? (labels?.emptyAllDescription ?? "When you get notifications, they'll show up here.")
    : (labels?.emptyUnreadDescription ?? "You're all caught up.");

  const showAllSwitchId = compact ? "notifications-show-all-compact" : "notifications-show-all";

  const stopScrollBubble = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <Card size={compact ? "2" : "4"} variant="surface" style={shellStyle}>
        <Box {...chromePadding}>
          <Flex direction="column" gap={compact ? "4" : "5"}>
            <Flex justify="between" align="center" gap="3" wrap="wrap">
              <Flex gap="2" align="center" style={{ minWidth: 0 }}>
                <Heading size={compact ? "4" : "6"} mb="0" trim="start">
                  {labels?.title ?? "Notifications"}
                </Heading>
                {unreadCount > 0 && (
                  <Badge
                    color={SEMANTIC_COLOR.danger}
                    variant="solid"
                    size="1"
                    radius="full"
                    highContrast
                    aria-label={labels?.unreadAria(unreadCount) ?? `${unreadCount} unread`}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Flex>
              {(onMarkAllRead || onClearAll) && (
                <Flex gap="2" wrap="wrap" justify="end" style={{ flexShrink: 0 }}>
                  {unreadCount > 0 && onMarkAllRead ? (
                    <Button
                      variant="ghost"
                      size={compact ? "1" : "2"}
                      color="gray"
                      disabled={clearing}
                      onClick={onMarkAllRead}
                    >
                      {labels?.markAllRead ?? "Mark all read"}
                    </Button>
                  ) : null}
                  {notifications.length > 0 && onClearAll ? (
                    <Button
                      variant="ghost"
                      size={compact ? "1" : "2"}
                      color="gray"
                      disabled={clearing}
                      onClick={onClearAll}
                    >
                      {labels?.clearAll ?? "Clear all"}
                    </Button>
                  ) : null}
                </Flex>
              )}
            </Flex>

            {!compact ? (
              <Text size="2" color="gray" highContrast>
                {labels?.subtitle ?? "Stay updated on bookings, payments, and messages."}
              </Text>
            ) : null}

            <Flex align="center" justify="between" gap="4">
              <Text as="label" size="2" htmlFor={showAllSwitchId} style={{ cursor: "pointer" }}>
                {labels?.showAll ?? "Show all notifications"}
              </Text>
              <Switch
                id={showAllSwitchId}
                size={compact ? "2" : "2"}
                checked={showAll}
                onCheckedChange={(checked) => setShowAll(Boolean(checked))}
                aria-label={labels?.showAll ?? "Show all notifications"}
              />
            </Flex>
          </Flex>

          <Separator size="4" my={compact ? "3" : "4"} />
        </Box>

        <Box
          style={listScrollStyle}
          onWheel={stopScrollBubble}
          onTouchMove={stopScrollBubble}
        >
          <Flex direction="column" gap={compact ? "2" : "3"} px={compact ? "4" : "5"} pb={compact ? "4" : "5"} pt="1">
            {loading && notifications.length === 0 && (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} size="2">
                    <Flex gap="3" align="start">
                      <Skeleton width="32px" height="32px" style={{ borderRadius: "9999px" }} />
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Skeleton height="14px" width="50%" mb="1" />
                        <Skeleton height="12px" width="80%" mb="1" />
                        <Skeleton height="10px" width="30%" />
                      </Box>
                    </Flex>
                  </Card>
                ))}
              </>
            )}

            {showEmpty && (
              <Flex direction="column" align="center" gap="3" py={compact ? "5" : "7"}>
                <Flex
                  align="center"
                  justify="center"
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "9999px",
                    backgroundColor: "var(--gray-3)",
                    color: "var(--gray-11)",
                  }}
                >
                  <Bell size={24} aria-hidden="true" />
                </Flex>
                <Box>
                  <Heading size="4" mb="1" align="center" trim="start">
                    {emptyTitle}
                  </Heading>
                  <Text size="2" color="gray" highContrast align="center" as="p">
                    {emptyDescription}
                  </Text>
                </Box>
              </Flex>
            )}

            {!loading &&
              filteredNotifications.length > 0 &&
              filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  {...notification}
                  compact={compact}
                  onAction={() => onNotificationAction?.(notification.id)}
                  onMarkRead={() => onMarkRead?.(notification.id)}
                />
              ))}
          </Flex>
        </Box>
    </Card>
  );
}

NotificationCenter.displayName = "NotificationCenter";
