import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getBookingChatThread,
  getBookingChatMessages,
  sendBookingMessage,
  getChatInbox,
  markBookingChatRead,
  type ChatMessagesParams,
  type ChatThread,
  type ChatInboxItem,
} from "@/lib/services/communication-service";

function useIsAuthenticated(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

// ─── Queries ────────────────────────────────────────────────────────────

export function useBookingChatThread(bookingId: string | undefined) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["booking-chat", bookingId],
    queryFn: () => getBookingChatThread(bookingId!),
    enabled: !!bookingId && isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useBookingChatMessages(
  bookingId: string | undefined,
  params: ChatMessagesParams = {}
) {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["booking-chat-messages", bookingId, params.page, params.limit],
    queryFn: () => getBookingChatMessages(bookingId!, params),
    enabled: !!bookingId && isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useChatInbox() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["chat-inbox"],
    queryFn: () => getChatInbox(),
    enabled: isAuthenticated,
    staleTime: 20 * 1000,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────

export function useSendBookingMessage(bookingId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      sendBookingMessage(bookingId!, content),
    onSuccess: (_, __, ___) => {
      if (bookingId) {
        queryClient.invalidateQueries({
          queryKey: ["booking-chat-messages", bookingId],
        });
        queryClient.invalidateQueries({
          queryKey: ["booking-chat", bookingId],
        });
        queryClient.invalidateQueries({ queryKey: ["chat-inbox"] });
      }
    },
  });
}

/**
 * Mark a booking chat as read for the current user (Wave 2 BFF wire).
 *
 * Idempotent — safe to call repeatedly on thread open. Updates the cached
 * thread + the inbox row's `lastReadAt` optimistically so the unread dot
 * disappears without waiting for refetch. Returns the server-confirmed thread.
 *
 * Replaces the previous localStorage cursor pattern, which was unreliable
 * across devices and lost on cache clear.
 */
export function useMarkBookingChatRead(bookingId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markBookingChatRead(bookingId!),
    onSuccess: (updatedThread) => {
      if (!bookingId) return;
      // Swap the per-thread cache with the fresh server shape (saves a GET).
      queryClient.setQueryData<ChatThread>(
        ["booking-chat", bookingId],
        updatedThread,
      );
      // Patch the inbox row so the unread dot clears immediately.
      queryClient.setQueriesData<ChatInboxItem[] | undefined>(
        { queryKey: ["chat-inbox"] },
        (current) => {
          if (!current) return current;
          let mutated = false;
          const next = current.map((item) => {
            if (item.bookingId !== bookingId) return item;
            mutated = true;
            return { ...item, lastReadAt: updatedThread.lastReadAt };
          });
          return mutated ? next : current;
        },
      );
    },
  });
}
