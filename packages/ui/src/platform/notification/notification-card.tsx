"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { SEMANTIC_COLOR, type SemanticColor } from "@welpco/ui/tokens";

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "booking"
  | "payment"
  | "message";

export interface NotificationCardProps {
  id: string;
  title: string;
  message: string;
  type?: NotificationType;
  timestamp: string;
  isRead?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onMarkRead?: () => void;
  /** When true, uses smaller padding and typography (e.g. in header popover) */
  compact?: boolean;
}

/**
 * Day 2 decision 6: notification colors flow through SEMANTIC_COLOR. Raw
 * `green|amber|red|blue` is forbidden for meaning. The accent stripe in compact
 * mode and the "New" badge both pull from this map.
 */
const typeColors: Record<NotificationType, SemanticColor> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "danger",
  booking: "info",
  payment: "success",
  message: "info",
};

export function NotificationCard({
  id,
  title,
  message,
  type = "info",
  timestamp,
  isRead = false,
  actionLabel,
  onAction,
  onMarkRead,
  compact,
}: NotificationCardProps) {
  const semanticKey = typeColors[type];
  const accent = SEMANTIC_COLOR[semanticKey];

  return (
    <Card size={compact ? "1" : "3"} variant={isRead ? "surface" : "classic"} style={{ width: "100%" }}>
      <Flex direction="column" gap={compact ? "2" : "3"}>
        <NotificationCardContent
          title={title}
          message={message}
          timestamp={timestamp}
          isRead={isRead}
          accent={accent}
          actionLabel={actionLabel}
          onAction={onAction}
          onMarkRead={onMarkRead}
          compact={compact}
        />
      </Flex>
    </Card>
  );
}

function NotificationCardContent({
  title,
  message,
  timestamp,
  isRead,
  accent,
  actionLabel,
  onAction,
  onMarkRead,
  compact,
}: {
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  accent: (typeof SEMANTIC_COLOR)[SemanticColor];
  actionLabel?: string;
  onAction?: () => void;
  onMarkRead?: () => void;
  compact?: boolean;
}) {
  const typeColor = accent;
  if (compact) {
    return (
      <Flex direction="row" align="stretch" gap="3" wrap="nowrap">
        <Box
          flexShrink="0"
          style={{
            width: "4px",
            borderRadius: "var(--radius-1)",
            backgroundColor: `var(--${typeColor}-9)`,
            alignSelf: "stretch",
          }}
        />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Flex gap="2" align="center" wrap="wrap">
            <Heading size="3" trim="start">
              {title}
            </Heading>
            {!isRead && (
              <Badge color={typeColor} variant="soft" size="1">
                New
              </Badge>
            )}
          </Flex>
          <Text size="2" color="gray">
            {message}
          </Text>
        </Box>
        <Flex direction="column" align="end" gap="1" style={{ flexShrink: 0 }}>
          <Text size="1" color="gray">
            {timestamp}
          </Text>
          <Flex gap="2" align="center">
            {!isRead && onMarkRead && (
              <Button
                variant="ghost"
                size="1"
                color="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
              >
                Mark as read
              </Button>
            )}
            {actionLabel && onAction && (
              <Button
                variant="ghost"
                size="1"
                color={SEMANTIC_COLOR.info}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction();
                }}
              >
                {actionLabel}
              </Button>
            )}
          </Flex>
        </Flex>
      </Flex>
    );
  }

  const hasActions = (!isRead && Boolean(onMarkRead)) || Boolean(actionLabel && onAction);

  return (
    <>
      <Flex justify="between" align="start" gap="3">
        <Box flexGrow="1" style={{ minWidth: 0 }}>
          <Flex gap="2" align="center" mb="1" wrap="wrap">
            <Heading size="4" trim="start">
              {title}
            </Heading>
            {!isRead && (
              <Badge color={typeColor} variant="soft" size="1">
                New
              </Badge>
            )}
          </Flex>
          <Text size="2" color="gray" highContrast>
            {message}
          </Text>
        </Box>
        <Text size="1" color="gray" style={{ flexShrink: 0 }}>
          {timestamp}
        </Text>
      </Flex>
      {hasActions && (
        <Flex gap="2" justify="end" wrap="wrap">
          {!isRead && onMarkRead && (
            <Button
              variant="ghost"
              size="1"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead();
              }}
            >
              Mark as read
            </Button>
          )}
          {actionLabel && onAction && (
            <Button
              variant="ghost"
              size="1"
              color={SEMANTIC_COLOR.info}
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
            >
              {actionLabel}
            </Button>
          )}
        </Flex>
      )}
    </>
  );
}

