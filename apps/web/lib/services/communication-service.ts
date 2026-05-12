import { apiClient } from "@/lib/api/client";

// ─── Types ──────────────────────────────────────────────────────────────

export interface ChatThread {
  id: string;
  bookingId: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Wave 2 (BFF): the requesting user's last-read cursor for this thread.
   * `null` means "never read". The other party's cursor is intentionally NOT
   * exposed — each user sees only their own read state. Pair with the
   * thread's most recent message timestamp to compute unread state on the
   * client (no more localStorage cursor!).
   */
  lastReadAt: string | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderDisplayName: string;
  content: string;
  createdAt: string;
}

export interface ChatMessagesResponse {
  data: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChatMessagesParams {
  page?: number;
  limit?: number;
}

export interface ChatInboxItem {
  bookingId: string;
  status: string;
  scheduledDate: string | null;
  scheduledStartTime: string | null;
  otherPartyId: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageSenderId: string | null;
  sortAt: string;
  /**
   * Wave 2 (BFF): the requesting user's last-read cursor. `null` means the
   * thread has never been opened by the requesting user. Compute unread:
   *   `unread = lastMessageAt != null && (lastReadAt == null || lastReadAt < lastMessageAt)`
   * This replaces the localStorage cursor pattern, which was unreliable across
   * devices and lost on cache clear.
   */
  lastReadAt: string | null;
}

// ─── API Functions ──────────────────────────────────────────────────────

/** Get or create the chat thread for a booking. */
export async function getBookingChatThread(
  bookingId: string
): Promise<ChatThread> {
  return apiClient.get<ChatThread>(`/api/bookings/${bookingId}/chat`);
}

/** List messages in the booking chat (paginated). */
export async function getBookingChatMessages(
  bookingId: string,
  params: ChatMessagesParams = {}
): Promise<ChatMessagesResponse> {
  return apiClient.get<ChatMessagesResponse>(
    `/api/bookings/${bookingId}/chat/messages`,
    { params: params as Record<string, string | number | boolean | undefined> }
  );
}

/** Send a message in the booking chat. */
export async function sendBookingMessage(
  bookingId: string,
  content: string
): Promise<ChatMessage> {
  return apiClient.post<ChatMessage>(
    `/api/bookings/${bookingId}/chat/messages`,
    { content }
  );
}

/** Chat inbox: participant bookings with last message preview (sorted by activity). */
export async function getChatInbox(): Promise<ChatInboxItem[]> {
  return apiClient.get<ChatInboxItem[]>("/api/chat/inbox");
}

/**
 * Wave 2 (BFF): mark the booking's chat thread as read for the current user.
 * Idempotent — calling twice in a row simply re-bumps the cursor. Returns the
 * updated `ChatThread` so you can swap state without a follow-up read.
 */
export async function markBookingChatRead(bookingId: string): Promise<ChatThread> {
  return apiClient.post<ChatThread>(`/api/bookings/${bookingId}/chat/read`);
}
