"use client";

import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { ScrollArea } from "@welpco/ui/scroll-area";
import { Separator } from "@welpco/ui/separator";
import { MessageBubble, type MessageBubbleProps } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { Skeleton } from "@welpco/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { useEffect, useRef } from "react";

export interface MessageThreadProps {
  title?: string;
  messages: MessageBubbleProps[];
  currentUserId: string;
  /** True while initial messages page is loading. Renders skeleton bubbles. */
  loading?: boolean;
  /** True while a send mutation is in flight. Drives the composer button copy. */
  sending?: boolean;
  onSendMessage?: (message: string) => void | Promise<void>;
  onAttachment?: () => void;
}

/**
 * Chat thread container. Title at top, scrollable messages region in the
 * middle, sticky composer at the bottom. Loading state renders skeleton
 * bubbles in alternating alignment to match the post-load layout.
 */
export function MessageThread({
  title,
  messages,
  currentUserId,
  loading,
  sending,
  onSendMessage,
  onAttachment,
}: MessageThreadProps) {
  const isEmpty = !loading && messages.length === 0;
  const isLoading = loading && messages.length === 0;

  // Scroll-to-bottom-on-new-message. Bible §22.6 honesty: a chat thread that
  // doesn't scroll to the freshest message is lying about which message is
  // newest. We use the message-id of the last bubble as the dependency so
  // pagination (load older above) doesn't accidentally yank the user down.
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const lastMessageId =
    messages.length > 0
      ? messages[messages.length - 1].id ?? `${messages.length - 1}`
      : null;
  useEffect(() => {
    if (!lastMessageId) return;
    bottomAnchorRef.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId]);

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", height: "600px" }}
    >
      <Flex direction="column" gap="3" height="100%">
        {title && (
          <Box pb="1">
            <Heading size="4" mb="0" trim="start">
              {title}
            </Heading>
          </Box>
        )}

        <ScrollArea style={{ flex: 1, minHeight: 0 }}>
          {/*
           * `aria-live="polite"` so SR users hear new messages arrive without
           * stealing focus. `role="log"` is the canonical chat affordance:
           * append-only, newest at the bottom.
           */}
          <Flex
            direction="column"
            gap="3"
            p="3"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label={title ?? "Conversation"}
          >
            {isLoading && (
              <>
                <Flex justify="start">
                  <Skeleton width="60%" height="48px" style={{ borderRadius: "var(--radius-4)" }} />
                </Flex>
                <Flex justify="end">
                  <Skeleton width="50%" height="48px" style={{ borderRadius: "var(--radius-4)" }} />
                </Flex>
                <Flex justify="start">
                  <Skeleton width="70%" height="60px" style={{ borderRadius: "var(--radius-4)" }} />
                </Flex>
              </>
            )}

            {isEmpty && (
              <Flex direction="column" align="center" gap="3" py="6">
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
                  <MessageSquare size={24} aria-hidden="true" />
                </Flex>
                <Box>
                  <Text size="3" weight="medium" align="center" as="p" mb="1">
                    No messages yet
                  </Text>
                  <Text size="2" color="gray" highContrast align="center" as="p">
                    Start the conversation — say hello.
                  </Text>
                </Box>
              </Flex>
            )}

            {!isEmpty && !isLoading && (
              messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id ?? idx}
                  {...msg}
                  isOwn={
                    msg.senderId !== undefined
                      ? msg.senderId === currentUserId
                      : msg.sender === currentUserId
                  }
                />
              ))
            )}
            {/* Scroll anchor — must be inside the live region so the effect
                can pin the view to the freshest bubble. */}
            <div ref={bottomAnchorRef} aria-hidden="true" />
          </Flex>
        </ScrollArea>

        <Separator size="4" />
        <Box pt="1">
          <ChatInput
            onSend={onSendMessage}
            onAttachment={onAttachment}
            loading={loading}
            sending={sending}
          />
        </Box>
      </Flex>
    </Card>
  );
}

MessageThread.displayName = "MessageThread";
