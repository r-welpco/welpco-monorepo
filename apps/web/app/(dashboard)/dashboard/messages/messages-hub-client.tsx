"use client";

import { useEffect, useMemo, useState, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Container } from "@welpco/ui/container";
import { Button } from "@welpco/ui/button";
import { Badge } from "@welpco/ui/badge";
import { Skeleton } from "@welpco/ui/skeleton";
import { Card } from "@welpco/ui/card";
import { Callout } from "@welpco/ui/callout";
import { MessageThread } from "@welpco/ui";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/authStore";
import {
  useBookingChatMessages,
  useSendBookingMessage,
  useChatInbox,
  useMarkBookingChatRead,
} from "@/lib/hooks/use-booking-chat";
import { useBookingById } from "@/lib/hooks/use-bookings";
import { getStatusColor, formatStatusLabel } from "@/lib/constants/booking";
import { usePublicWelperProfile } from "@/lib/hooks/use-service-discovery";
import type { ChatInboxItem } from "@/lib/services/communication-service";
import styles from "./messages-hub.module.css";

/**
 * Wave 2 (BFF) inbox unread rule:
 *   `lastMessageAt` exists, was sent by the OTHER party, and is newer than the
 *   current user's `lastReadAt` (or `lastReadAt` is `null` — never opened).
 *
 * The server cursor replaced the previous `localStorage` cache so unread state
 * survives device switches and cache clears.
 */
function isInboxRowUnread(item: ChatInboxItem, currentUserId: string): boolean {
  if (!item.lastMessageAt || !item.lastMessageSenderId) return false;
  if (item.lastMessageSenderId === currentUserId) return false;
  if (item.lastReadAt == null) return true;
  const lastMs = new Date(item.lastMessageAt).getTime();
  const readMs = new Date(item.lastReadAt).getTime();
  if (!Number.isFinite(lastMs) || !Number.isFinite(readMs)) return false;
  return lastMs > readMs;
}

const SPLIT_MQ = "(min-width: 768px)";

function subscribeSplitMq(callback: () => void) {
  const mq = window.matchMedia(SPLIT_MQ);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSplitMqSnapshot() {
  return window.matchMedia(SPLIT_MQ).matches;
}

function getSplitMqServerSnapshot() {
  return false;
}

function useSplitPaneWide() {
  return useSyncExternalStore(subscribeSplitMq, getSplitMqSnapshot, getSplitMqServerSnapshot);
}

function formatDateSafe(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d =
      dateStr.length === 10
        ? new Date(dateStr + "T00:00:00")
        : new Date(dateStr);
    return format(d, "MMM d");
  } catch {
    return dateStr;
  }
}

function InboxCounterpartyLabel({
  viewerRole,
  otherPartyId,
}: {
  viewerRole: "customer" | "welper";
  otherPartyId: string;
}) {
  const { data: welper } = usePublicWelperProfile(
    viewerRole === "customer" ? otherPartyId : null
  );
  const name =
    viewerRole === "customer" && welper
      ? [welper.firstName, welper.lastName].filter(Boolean).join(" ").trim()
      : null;
  if (name) return <>{name}</>;
  if (viewerRole === "welper") {
    return <>Customer &middot; #{otherPartyId.slice(-8).toUpperCase()}</>;
  }
  return <>Welper &middot; #{otherPartyId.slice(-8).toUpperCase()}</>;
}

function InboxRow({
  item,
  isSelected,
  currentUserId,
  viewerRole,
}: {
  item: ChatInboxItem;
  isSelected: boolean;
  currentUserId: string;
  viewerRole: "customer" | "welper";
}) {
  const unread = isInboxRowUnread(item, currentUserId);
  const href = `/dashboard/messages/${item.bookingId}`;

  // Compose a descriptive aria-label so screen readers hear:
  // "<Counterparty>, booking #ABCD1234, scheduled Apr 27, unread, last message: ..."
  const counterparty =
    viewerRole === "welper"
      ? `Customer #${item.otherPartyId.slice(-8).toUpperCase()}`
      : `Welper #${item.otherPartyId.slice(-8).toUpperCase()}`;
  const ariaSummary = [
    counterparty,
    `Booking #${item.bookingId.slice(-8).toUpperCase()}`,
    formatDateSafe(item.scheduledDate),
    unread ? "unread" : null,
    item.lastMessagePreview ? `Last message: ${item.lastMessagePreview}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <li>
      <Link
        href={href}
        scroll={false}
        prefetch
        aria-current={isSelected ? "page" : undefined}
        aria-label={ariaSummary}
        className={styles.row}
      >
        <Flex
          direction="column"
          gap="2"
          p="3"
          className={`${styles.rowInner} ${isSelected ? styles.rowInnerSelected : ""}`}
        >
          <Flex align="center" justify="between" gap="2">
            <Text
              size="2"
              weight="medium"
              className={styles.truncate}
              style={{ flex: 1, minWidth: 0 }}
            >
              <InboxCounterpartyLabel
                viewerRole={viewerRole}
                otherPartyId={item.otherPartyId}
              />
            </Text>
            {unread ? (
              <Box
                aria-label="Unread messages"
                className={styles.unreadDot}
              />
            ) : null}
          </Flex>
          <Text size="1" color="gray" highContrast>
            #{item.bookingId.slice(-8).toUpperCase()} &middot;{" "}
            {formatDateSafe(item.scheduledDate)}
            {item.scheduledStartTime ? ` · ${item.scheduledStartTime}` : ""}
          </Text>
          <Flex align="center" gap="2" wrap="wrap">
            <Badge color={getStatusColor(item.status)} variant="soft" size="1" highContrast>
              {formatStatusLabel(item.status)}
            </Badge>
            {item.lastMessagePreview ? (
              <Text
                size="1"
                color="gray"
                className={styles.truncate}
                style={{ flex: 1, minWidth: 0 }}
              >
                {item.lastMessagePreview}
              </Text>
            ) : null}
          </Flex>
        </Flex>
      </Link>
    </li>
  );
}

function MessagesThreadPane({
  bookingId,
  currentUserId,
}: {
  bookingId: string;
  currentUserId: string;
}) {
  const [chatError, setChatError] = useState<string | null>(null);
  const { data: booking } = useBookingById(bookingId);
  const {
    data: chatMessagesData,
    isLoading: chatMessagesLoading,
    isFetching: chatMessagesFetching,
  } = useBookingChatMessages(bookingId, { limit: 100 });
  const sendMessageMutation = useSendBookingMessage(bookingId);
  const markReadMutation = useMarkBookingChatRead(bookingId);
  const markReadMutate = markReadMutation.mutate;

  // Wave 2 (BFF): mark the thread read on open. Idempotent on the server, and
  // optimistically clears the inbox row's unread dot via the mutation cache
  // patch in `useMarkBookingChatRead`. Mark-on-open only — no scroll-based
  // mark-read (intentional first cut, see the project brief).
  useEffect(() => {
    markReadMutate();
  }, [bookingId, markReadMutate]);

  const messageRows = chatMessagesData?.data;
  const showThreadLoading = chatMessagesLoading || chatMessagesFetching;
  const chatMessagesForThread = useMemo(() => {
    if (showThreadLoading || !messageRows) return [];
    return messageRows.map((msg) => ({
      id: msg.id,
      message: msg.content,
      sender: msg.senderDisplayName,
      senderId: msg.senderId,
      timestamp: format(new Date(msg.createdAt), "h:mm a"),
    }));
  }, [messageRows, showThreadLoading]);

  return (
    <Flex direction="column" gap="4" className={styles.threadFlex}>
      <Flex
        align="start"
        justify="between"
        wrap="wrap"
        gap="3"
        className={styles.headerBlock}
      >
        <Flex direction="column" gap="2" style={{ minWidth: 0 }}>
          <Flex align="center" gap="3" wrap="wrap" aria-live="polite">
            <Heading as="h2" size="5" mb="0" trim="start">
              Booking #{bookingId.slice(-8).toUpperCase()}
            </Heading>
            {booking?.status ? (
              <Badge
                color={getStatusColor(booking.status)}
                variant="soft"
                size="2"
                highContrast
              >
                {formatStatusLabel(booking.status)}
              </Badge>
            ) : null}
          </Flex>
        </Flex>
        <Button size="2" variant="soft" color="gray" asChild>
          <Link href={`/dashboard/bookings/${bookingId}`}>
            View booking details
          </Link>
        </Button>
      </Flex>
      {chatError ? (
        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
          <Callout.Text>{chatError}</Callout.Text>
        </Callout.Root>
      ) : null}
      <Box className={styles.threadInnerBox}>
        <MessageThread
          title="Messages"
          messages={chatMessagesForThread}
          currentUserId={currentUserId}
          loading={showThreadLoading}
          sending={sendMessageMutation.isPending}
          onSendMessage={(content) => {
            setChatError(null);
            sendMessageMutation.mutate(content, {
              onError: (err) =>
                setChatError(
                  err instanceof Error
                    ? err.message
                    : "We couldn't send your message. Try again in a moment."
                ),
            });
          }}
        />
      </Box>
    </Flex>
  );
}

export function MessagesHub() {
  const params = useParams();
  const router = useRouter();
  const splitWide = useSplitPaneWide();
  const { user } = useAuthStore();
  const { data: inbox = [], isLoading, isError, error } = useChatInbox();

  const rawId = params?.bookingId;
  const idFromRoute = Array.isArray(rawId) ? rawId[0] : rawId;
  const selectedBookingId =
    typeof idFromRoute === "string" && idFromRoute.length > 0 ? idFromRoute : null;

  const viewerRole = user?.role === "welper" ? "welper" : "customer";

  useEffect(() => {
    if (!user || isLoading || selectedBookingId != null) return;
    if (inbox.length > 0) {
      router.replace(`/dashboard/messages/${inbox[0].bookingId}`);
    }
  }, [user, isLoading, selectedBookingId, inbox, router]);

  const handleBackBookings = useCallback(() => {
    router.push("/dashboard/bookings");
  }, [router]);

  if (!user) {
    return (
      <Container size="3" px={{ initial: "4", sm: "6" }}>
        <Card size="3" variant="surface">
          <Flex direction="column" align="center" gap="3" py="6" px="3">
            <Heading as="h1" size="5" align="center" trim="start">
              Sign in to read your messages
            </Heading>
            <Text size="2" color="gray" highContrast align="center" as="p">
              Messages are tied to bookings. Sign in to see them.
            </Text>
          </Flex>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6" style={{ width: "100%", minWidth: 0 }}>
        <Flex align="start" justify="between" wrap="wrap" gap="4">
          <Box style={{ minWidth: 0, flex: "1 1 240px" }}>
            <Heading as="h1" size="7" mb="2" trim="start">
              Messages
            </Heading>
            <Text as="p" size="2" color="gray" highContrast>
              Pick a booking to chat with your{" "}
              {viewerRole === "customer" ? "Welper" : "customer"}.
            </Text>
          </Box>
          <Button size="2" variant="ghost" color="gray" onClick={handleBackBookings}>
            Back to bookings
          </Button>
        </Flex>

        <Flex
          gap="0"
          direction={{ initial: "column", md: "row" }}
          className={styles.shell}
        >
          <Box
            width={{ md: "380px" }}
            className={`${styles.sidebar} ${splitWide ? styles.split : styles.stacked}`}
          >
            <Flex
              direction="column"
              gap="2"
              p="3"
              className={styles.sidebarHeader}
            >
              <Text as="div" size="2" weight="bold">
                Conversations
              </Text>
              <Text as="div" size="1" color="gray" highContrast>
                Bookings you can message
              </Text>
            </Flex>
            <Box className={styles.sidebarBody}>
              {isLoading ? (
                <Flex direction="column" gap="2" p="3" aria-busy="true" aria-live="polite">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} height="72px" />
                  ))}
                </Flex>
              ) : isError ? (
                <Box p="3">
                  <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
                    <Callout.Text>
                      {error instanceof Error
                        ? error.message
                        : "We couldn't load your inbox. Try again in a moment."}
                    </Callout.Text>
                  </Callout.Root>
                </Box>
              ) : inbox.length === 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  gap="3"
                  p="6"
                  className={styles.emptyState}
                >
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "9999px",
                      backgroundColor: "var(--gray-3)",
                      color: "var(--gray-11)",
                    }}
                  >
                    <MessageCircle size={20} aria-hidden="true" />
                  </Flex>
                  <Box>
                    <Text size="2" weight="medium" align="center" as="p" mb="1">
                      No conversations yet
                    </Text>
                    <Text size="1" color="gray" highContrast align="center" as="p">
                      New chats appear here once you have a booking.
                    </Text>
                  </Box>
                </Flex>
              ) : (
                <ul className={styles.list}>
                  {inbox.map((item) => (
                    <InboxRow
                      key={item.bookingId}
                      item={item}
                      isSelected={item.bookingId === selectedBookingId}
                      currentUserId={user.id}
                      viewerRole={viewerRole}
                    />
                  ))}
                </ul>
              )}
            </Box>
          </Box>

          <Flex
            direction="column"
            p="5"
            gap="4"
            className={styles.threadPane}
          >
            {selectedBookingId && user.id ? (
              <MessagesThreadPane
                key={selectedBookingId}
                bookingId={selectedBookingId}
                currentUserId={user.id}
              />
            ) : !isLoading && inbox.length === 0 ? (
              <Flex align="center" justify="center" style={{ flex: 1 }}>
                <Text size="2" color="gray" highContrast>
                  No conversation selected.
                </Text>
              </Flex>
            ) : (
              <Flex align="center" justify="center" style={{ flex: 1 }}>
                <Text size="2" color="gray" highContrast>
                  Pick a booking from the list to start chatting.
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Container>
  );
}
