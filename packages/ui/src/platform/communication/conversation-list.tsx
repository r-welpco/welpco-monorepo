"use client";

import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Avatar } from "@welpco/ui/avatar";
import { Badge } from "@welpco/ui/badge";
import { ScrollArea } from "@welpco/ui/scroll-area";
import { Skeleton } from "@welpco/ui/skeleton";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { MessageSquare } from "lucide-react";

export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isOnline?: boolean;
}

export interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  loading?: boolean;
  onSelect?: (conversationId: string) => void;
}

const TRUNCATE_STYLE = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

/**
 * Sidebar list of chat conversations. Each row is a real button (keyboard
 * accessible), the selected row uses `aria-current` for screen-reader
 * announcement, online indicator is properly bordered against the panel
 * surface so it reads in both light and dark mode.
 */
export function ConversationList({
  conversations,
  selectedId,
  loading,
  onSelect,
}: ConversationListProps) {
  // Loading
  if (loading && conversations.length === 0) {
    return (
      <Card size="3" variant="surface" style={{ width: "100%", maxWidth: "400px", height: "600px" }}>
        <ScrollArea>
          <Flex direction="column" gap="3" p="3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Flex key={i} gap="3" align="center">
                <Skeleton width="40px" height="40px" style={{ borderRadius: "9999px" }} />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Skeleton height="14px" width="60%" mb="1" />
                  <Skeleton height="12px" width="80%" />
                </Box>
              </Flex>
            ))}
          </Flex>
        </ScrollArea>
      </Card>
    );
  }

  // Empty
  if (conversations.length === 0) {
    return (
      <Card size="3" variant="surface" style={{ width: "100%", maxWidth: "400px", height: "600px" }}>
        <Flex direction="column" align="center" justify="center" gap="3" height="100%" p="5">
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
            <Heading size="4" mb="1" align="center" trim="start">
              No conversations yet
            </Heading>
            <Text size="2" color="gray" highContrast align="center" as="p">
              Once you book a Welper or accept a job, your messages will show up here.
            </Text>
          </Box>
        </Flex>
      </Card>
    );
  }

  // List
  return (
    <Card size="3" variant="surface" style={{ width: "100%", maxWidth: "400px", height: "600px" }}>
      <ScrollArea>
        <Flex direction="column" gap="1" p="2" asChild>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {conversations.map((conv) => {
              const isSelected = selectedId === conv.id;
              const hasUnread = (conv.unreadCount ?? 0) > 0;

              return (
                <Box asChild key={conv.id}>
                  <li>
                    <Box
                      asChild
                      p="3"
                      style={{
                        borderRadius: "var(--radius-3)",
                        backgroundColor: isSelected ? "var(--accent-3)" : "transparent",
                        textAlign: "left",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect?.(conv.id)}
                        aria-current={isSelected ? "true" : undefined}
                        aria-label={
                          hasUnread
                            ? `${conv.name}, ${conv.unreadCount} unread, last message: ${conv.lastMessage}`
                            : `${conv.name}, last message: ${conv.lastMessage}`
                        }
                      >
                        <Flex gap="3" align="center">
                          <Box position="relative" flexShrink="0">
                            <Avatar
                              src={conv.avatar}
                              fallback={conv.name.charAt(0).toUpperCase()}
                              alt={conv.name}
                              size="3"
                            />
                            {conv.isOnline && (
                              <Box
                                position="absolute"
                                bottom="0"
                                right="0"
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  borderRadius: "9999px",
                                  backgroundColor: "var(--green-9)",
                                  border: "2px solid var(--color-panel-solid)",
                                }}
                                aria-label="Online"
                              />
                            )}
                          </Box>
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Flex justify="between" align="center" gap="2" mb="1">
                              <Text
                                size="2"
                                weight={hasUnread ? "bold" : "medium"}
                                style={{ ...TRUNCATE_STYLE, flex: 1, minWidth: 0 }}
                              >
                                {conv.name}
                              </Text>
                              <Text
                                size="1"
                                color="gray"
                                highContrast
                                style={{ flexShrink: 0 }}
                              >
                                {conv.timestamp}
                              </Text>
                            </Flex>
                            <Flex justify="between" align="center" gap="2">
                              <Text
                                size="1"
                                color="gray"
                                highContrast={hasUnread}
                                style={{ ...TRUNCATE_STYLE, flex: 1, minWidth: 0 }}
                              >
                                {conv.lastMessage}
                              </Text>
                              {hasUnread && (
                                <Badge
                                  color={SEMANTIC_COLOR.danger}
                                  variant="solid"
                                  size="1"
                                  radius="full"
                                  highContrast
                                  aria-hidden="true"
                                >
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </Flex>
                          </Box>
                        </Flex>
                      </button>
                    </Box>
                  </li>
                </Box>
              );
            })}
          </ul>
        </Flex>
      </ScrollArea>
    </Card>
  );
}

ConversationList.displayName = "ConversationList";
