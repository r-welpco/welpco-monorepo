"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { ScrollArea } from "@welpco/ui/scroll-area";
import { Separator } from "@welpco/ui/separator";
import { SegmentedControl } from "@welpco/ui/segmented-control";
import { Badge } from "@welpco/ui/badge";
import { Skeleton } from "@welpco/ui/skeleton";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Bell } from "lucide-react";
import { NotificationCard, type NotificationCardProps } from "./notification-card";
import { useState } from "react";

export type NotificationFilter = "all" | "unread" | "read";

export type NotificationCenterLabels = {
  title: string;
  subtitle?: string;
  markAllRead: string;
  unreadAria: (count: number) => string;
  filterAll: string;
  filterUnread: string;
  filterRead: string;
  emptyAllTitle: string;
  emptyUnreadTitle: string;
  emptyReadTitle: string;
  emptyAllDescription: string;
  emptyUnreadDescription: string;
  emptyReadDescription: string;
};

export interface NotificationCenterProps {
  notifications: NotificationCardProps[];
  unreadCount?: number;
  loading?: boolean;
  /** When true, uses smaller height for dropdown/popover (e.g. maxHeight ~480px) */
  compact?: boolean;
  onMarkAllRead?: () => void;
  onNotificationAction?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  labels?: NotificationCenterLabels;
}

const DEFAULT_EMPTY_DESCRIPTIONS: Record<NotificationFilter, string> = {
  all: "When you get notifications, they'll show up here.",
  unread: "You're all caught up.",
  read: "Once you mark notifications as read, they'll show up here.",
};

const DEFAULT_EMPTY_HEADLINES: Record<NotificationFilter, string> = {
  all: "No notifications yet",
  unread: "No unread notifications",
  read: "No read notifications",
};

/**
 * Notification list — used both as a full page (`compact={false}`) and as a
 * popover content (`compact`). Filter via SegmentedControl, each row is a
 * NotificationCard. Empty state follows bible §17.3 with role-specific copy.
 */
export function NotificationCenter({
  notifications,
  unreadCount = 0,
  loading,
  compact,
  onMarkAllRead,
  onNotificationAction,
  onMarkRead,
  labels,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const emptyHeadlines: Record<NotificationFilter, string> = {
    all: labels?.emptyAllTitle ?? DEFAULT_EMPTY_HEADLINES.all,
    unread: labels?.emptyUnreadTitle ?? DEFAULT_EMPTY_HEADLINES.unread,
    read: labels?.emptyReadTitle ?? DEFAULT_EMPTY_HEADLINES.read,
  };
  const emptyDescriptions: Record<NotificationFilter, string> = {
    all: labels?.emptyAllDescription ?? DEFAULT_EMPTY_DESCRIPTIONS.all,
    unread: labels?.emptyUnreadDescription ?? DEFAULT_EMPTY_DESCRIPTIONS.unread,
    read: labels?.emptyReadDescription ?? DEFAULT_EMPTY_DESCRIPTIONS.read,
  };

  const cardStyle = compact
    ? { width: "100%", maxWidth: "100%", height: "min(70vh, 340px)" }
    : { width: "100%", maxWidth: "600px", height: "700px" };

  const filteredNotifications =
    filter === "all"
      ? notifications
      : filter === "unread"
        ? notifications.filter((n) => !n.isRead)
        : notifications.filter((n) => n.isRead);

  // Day 13: only show the empty state when we've actually finished loading.
  // Previously `showEmpty` was true while `loading && notifications.length === 0`
  // which double-rendered the skeleton AND the empty card simultaneously.
  const showEmpty = !loading && filteredNotifications.length === 0;

  return (
    <Card size={compact ? "2" : "4"} variant="surface" style={cardStyle}>
      <Flex direction="column" gap={compact ? "3" : "4"} height="100%">
        {/* Header */}
        <Box px={compact ? "1" : undefined} pt={compact ? "1" : undefined}>
          <Flex justify="between" align="center" gap="2">
            <Flex gap="2" align="center">
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
            {unreadCount > 0 && onMarkAllRead && (
              <Button
                variant="ghost"
                size={compact ? "1" : "2"}
                color="gray"
                onClick={onMarkAllRead}
              >
                {labels?.markAllRead ?? "Mark all read"}
              </Button>
            )}
          </Flex>
          {!compact ? (
            <Text size="2" color="gray" highContrast mt="1">
              {labels?.subtitle ?? "Stay updated on bookings, payments, and messages."}
            </Text>
          ) : null}
        </Box>

        {/* Filter */}
        <SegmentedControl.Root
          value={filter}
          onValueChange={(value) => setFilter(value as NotificationFilter)}
          size={compact ? "1" : "2"}
        >
          <SegmentedControl.Item value="all">{labels?.filterAll ?? "All"}</SegmentedControl.Item>
          <SegmentedControl.Item value="unread">{labels?.filterUnread ?? "Unread"}</SegmentedControl.Item>
          <SegmentedControl.Item value="read">{labels?.filterRead ?? "Read"}</SegmentedControl.Item>
        </SegmentedControl.Root>

        <Separator size="4" />

        <ScrollArea style={{ flex: 1, minHeight: 0 }}>
          <Flex direction="column" gap={compact ? "2" : "3"} p="1">
            {/* Loading */}
            {loading && notifications.length === 0 && (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} size="2" variant="surface">
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

            {/* Empty */}
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
                    {emptyHeadlines[filter]}
                  </Heading>
                  <Text size="2" color="gray" highContrast align="center" as="p">
                    {emptyDescriptions[filter]}
                  </Text>
                </Box>
              </Flex>
            )}

            {/* List */}
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
        </ScrollArea>
      </Flex>
    </Card>
  );
}

NotificationCenter.displayName = "NotificationCenter";
