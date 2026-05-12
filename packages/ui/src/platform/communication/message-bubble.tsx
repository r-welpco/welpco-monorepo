"use client";

import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Flex } from "@welpco/ui/flex";
import { Avatar } from "@welpco/ui/avatar";

export interface MessageBubbleProps {
  /** Optional id for list keys (e.g. from API) */
  id?: string;
  message: string;
  sender: string;
  /** When provided, used by MessageThread to derive isOwn from senderId === currentUserId (booking-scoped chat) */
  senderId?: string;
  senderAvatar?: string;
  timestamp: string;
  isOwn?: boolean;
  isRead?: boolean;
}

export function MessageBubble({
  message,
  sender,
  senderAvatar,
  timestamp,
  isOwn = false,
  isRead = false,
}: MessageBubbleProps) {
  return (
    <Flex
      gap="3"
      align="end"
      direction={isOwn ? "row-reverse" : "row"}
      style={{
        maxWidth: "85%",
        marginLeft: isOwn ? "auto" : "0",
        marginRight: isOwn ? "0" : "auto",
      }}
    >
      {!isOwn && (
        <Avatar
          src={senderAvatar}
          fallback={sender.charAt(0).toUpperCase()}
          size="3"
          style={{ flexShrink: 0 }}
        />
      )}
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Flex
          gap="2"
          align="center"
          direction={isOwn ? "row-reverse" : "row"}
          mb="1"
        >
          <Text size="2" weight="bold">
            {sender}
          </Text>
          <Text size="1" color="gray">
            {timestamp}
          </Text>
        </Flex>
        <Box
          p="4"
          style={{
            backgroundColor: isOwn
              ? "var(--accent-4)"
              : "var(--gray-3)",
            borderRadius: "var(--radius-4)",
          }}
        >
          <Text
            size="2"
            color={isOwn ? undefined : "gray"}
            highContrast
            // Preserve newlines + wrap long URLs / words so the bubble can't
            // overflow horizontally. Bible §22.6 honesty: render exactly what
            // the sender typed (incl. line breaks) — don't silently collapse.
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              ...(isOwn ? { color: "var(--accent-12)" } : null),
            }}
          >
            {message}
          </Text>
        </Box>
        {isOwn && (
          <Text size="1" color="gray" mt="1" style={{ textAlign: "right" }}>
            {isRead ? "Read" : "Delivered"}
          </Text>
        )}
      </Box>
      {isOwn && (
        <Avatar
          src={senderAvatar}
          fallback={sender.charAt(0).toUpperCase()}
          size="3"
          style={{ flexShrink: 0 }}
        />
      )}
    </Flex>
  );
}

