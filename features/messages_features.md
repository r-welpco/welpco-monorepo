# Messages — open tickets

Source: Day 12 messages + reviews functional audit (`apps/web/AUDIT-LOG.md`).

The audit shipped 4 P1/P2 fixes (catalogued first, for traceability). The remaining open work is below — each ticket-ready, severity- and effort-tagged, ordered by leverage.

Cross-references:
- Reviews surface: `features/reviews_features.md` — same audit; reviews share the trust-and-safety policy work (REVIEWS-007 abuse-report queue) with messages (MESSAGES-006 block / report).
- Booking surface: `features/booking_features.md` — `BOOKING-003` (live status updates) is the same WebSocket / SSE infrastructure that MESSAGES-001 needs for live message arrival; design them together.
- Disputes: every dispute starts as a "this isn't going right" thread, so MESSAGES-006 (block / report) and MESSAGES-007 (scam / off-platform exfil filter) feed the dispute pipeline.

---

## Shipped in the Day 12 pass (no ticket needed; here for traceability)

| # | Severity | Surface | Change |
|---|---|---|---|
| Day12-M-01 | P1 | `MessageThread` (platform) | Messages region had no `aria-live` and no scroll-to-bottom-on-new-message — SR users didn't hear new messages and sighted users had to scroll to find the freshest message. Now: `role="log" aria-live="polite" aria-relevant="additions"` on the messages container, `aria-label` (= title), and a `bottomAnchorRef` that pins to the newest message id on every change. |
| Day12-M-02 | P1 | `ChatInput` (platform) + `MessagesHub` wire | The composer's button copy said "Sending..." while the **list** was loading (the parent passed `chatMessagesLoading` as `loading`). Counter-intuitive: nothing was being sent. Split into two props — `loading` (initial list load — disables input) and `sending` (mutation in flight — drives button copy). MessagesHub now wires `sendMessageMutation.isPending` → `sending`. |
| Day12-M-03 | P2 | `ChatInput` (platform) | No client-side max-length enforcement — BFF rejects 4001+ char messages with a 400. Now exports `CHAT_MESSAGE_MAX_LENGTH = 4000`, sets `maxLength` on the field, shows a counter ≥90% of the cap, and disables the send button with a `role="alert"` over-limit message if a paste pushes over. |
| Day12-M-04 | P2 | `MessageBubble` (platform) | Messages with newlines collapsed into one line; long URLs / unbroken strings overflowed the bubble and pushed the layout. Added `whiteSpace: pre-wrap` + `overflowWrap: anywhere`. Bible §22.6 honesty: render exactly what the sender typed (incl. line breaks). |

---

## MESSAGES-001 — Real-time message delivery (server push, not polling)

- **Priority**: P1 (highest leverage; trust-critical — every dispute begins here)
- **Area**: BFF + web messages hub
- **Problem**: Today messages are fetched on a 30s `staleTime` query (`useBookingChatMessages`) and refetched on focus. A message you sent 5 seconds ago shows up; a message the **other party** sent 5 seconds ago doesn't, until the user clicks somewhere else and back. For a marketplace where messages are the early-warning system for problems, that delay is meaningful trust damage.
- **Proposed solution** (preferred): SSE endpoint `GET /api/bookings/:bookingId/chat/events` — pushes `message.created` and `read.bumped` events. Web subscribes when a thread is opened, closes when navigating away. Falls back to a 10s `refetchInterval` while the page is visible (Page Visibility API). Same infrastructure as `BOOKING-003` — design the pub-sub once, share between domains.
- **Acceptance criteria**:
  - New message from the other party shows up within ~5s without manual refresh.
  - Unread dot in the inbox sidebar updates within the same window.
  - Connection auto-reconnects on transient drops.
  - No connection thrash when the page is backgrounded.
  - Tests: integration — send on welper side, observe customer-side cache update.
- **Effort**: M (SSE + shared pub-sub) or S (poll fallback only).
- **Files**: `apps/bff/src/domains/communication/communication.controller.ts` (SSE endpoint), new `chat-events.service.ts`, web `useBookingChatMessages` (subscribe + invalidate), `useChatInbox` (push patches).

---

## MESSAGES-002 — Typing indicator

- **Priority**: P2
- **Area**: BFF + platform `ChatInput` + web messages hub
- **Problem**: When the other party is composing a long reply, today's UI gives no signal — the customer waits on a silent screen and assumes nothing is happening. A typing indicator is the cheapest possible signal and a near-universal chat affordance (bible §17.2 latency reassurance).
- **Proposed solution**: throttled `POST /api/bookings/:bookingId/chat/typing` (debounced 1s on keystroke; auto-expires at 3s with no further keystrokes). The same SSE channel from MESSAGES-001 broadcasts `typing.started` / `typing.stopped`. Render as `[Other party] is typing…` above the composer, `aria-live="polite"`.
- **Acceptance criteria**:
  - Typing indicator appears within 1s of the other party starting to type.
  - Disappears within 3s of them stopping.
  - Suppresses while own send is in flight (you don't show a typing indicator for the message you're about to receive — it'd flicker).
  - SR-friendly.
- **Effort**: S (assuming MESSAGES-001 lands first).
- **Files**: `apps/bff/src/domains/communication/communication.controller.ts`, `apps/bff/src/domains/communication/communication.service.ts`, `packages/ui/src/platform/communication/chat-input.tsx`, web `MessagesThreadPane`.

---

## MESSAGES-003 — Read receipts (surface the cursor we already store)

- **Priority**: P2
- **Area**: Platform `MessageBubble` + web wire
- **Problem**: The BFF tracks `last_read_at_customer` and `last_read_at_welper` per thread (Wave 2). The other party's cursor is intentionally not exposed in the per-thread DTO today — but for own-bubble read state, we have everything we need to show `Read` vs `Delivered` honestly. Today every own-bubble shows `Delivered` regardless. The component already accepts `isRead` (line 27 of `message-bubble.tsx`); nobody passes it.
- **Proposed solution**: extend `ChatThreadDto` with the **other party's** `lastReadAt` so own-bubbles whose `createdAt <= other.lastReadAt` can render "Read". Privacy guard: this is a 1:1 booking-scoped chat where both parties already know each other; bible §22.6 read-receipts policy = on by default for booking chats (commerce trust >> chitchat privacy). Add a per-user opt-out in settings (notification-preferences extension).
- **Acceptance criteria**:
  - `MessageBubble` shows "Read" once the other party has opened the thread after that message landed.
  - Stale messages from before the other party's first-ever open still show "Delivered" (no retroactive over-claiming).
  - Settings toggle to disable in `notification-preferences`.
  - Tests cover the cursor-vs-message ordering edge cases.
- **Effort**: S.
- **Files**: `apps/bff/src/domains/communication/dto/chat-thread.dto.ts`, `apps/bff/src/domains/communication/communication.service.ts`, web `MessagesThreadPane` mapper, `packages/ui/src/platform/communication/message-bubble.tsx`.

---

## MESSAGES-004 — File / image attachments

- **Priority**: P2
- **Area**: BFF + web composer + platform `MessageBubble`
- **Problem**: `ChatInput` already has an `onAttachment` prop and a paperclip icon — it's wired to nothing. Customers can't share a photo of "is this the right house" or a screenshot of a confirmation. Wave 2 already shipped signed S3 URLs for dispute evidence (same pattern); chat attachments can ride that infra.
- **Proposed solution**: extend `Message` entity with optional `attachment_url`, `attachment_filename`, `attachment_mime_type`, `attachment_size_bytes`. Use the existing `signed-url.service` for upload. Render in `MessageBubble` as either an image preview (≤10MB JPEG/PNG/WebP) or a file pill. Cap upload size at 10MB; cap file types to image + PDF (no executables).
- **Acceptance criteria**:
  - Customer can pick a file, see upload progress, and send.
  - The recipient sees the attachment inline; clicking opens it in a new tab.
  - Attachments respect the same booking-participants ACL as the messages.
  - Virus / mime-type sniffing on upload (or at least defence-in-depth allowlist).
  - Tests cover happy path + oversize reject + wrong-type reject.
- **Effort**: M.
- **Files**: `apps/bff/src/domains/communication/entities/message.entity.ts` (migration), `communication.service.ts`, `dto/send-message.dto.ts`, `chat-input.tsx`, `message-bubble.tsx`.

---

## MESSAGES-005 — Search within thread + jump to date

- **Priority**: P3
- **Area**: Web messages hub + BFF
- **Problem**: Long-running threads (a recurring booking with the same welper) scroll to hundreds of messages. Today the only way to find "the address you sent me last Tuesday" is to scroll. Pagination exists at 100 messages per page but there's no UI to navigate older pages.
- **Proposed solution**: search box at the top of the thread pane; submits `?q=` to `/api/bookings/:bookingId/chat/messages?q=…`. BFF runs ILIKE against `content` (later: `pg_trgm` similarity, same as `BOOKING-005`). Results highlight matches; jump-to scrolls into view. Also add a date-jump dropdown ("Apr 12, Mar 28, Feb 14") so users can jump by booking-event.
- **Acceptance criteria**:
  - Search returns matching messages within ~500ms for threads up to 1k messages.
  - Empty state when no match.
  - Match-context shown (1 message before + after).
- **Effort**: M.
- **Files**: BFF `messages-query.dto.ts` + `communication.service.ts`, web `MessagesThreadPane`.

---

## MESSAGES-006 — Block / report user (anti-abuse foundation)

- **Priority**: P1 (T&S; deferred-but-required)
- **Area**: BFF + web (messages, welper profile, booking detail) + admin
- **Problem**: There is no user-level block. A welper who feels harassed by a customer (or vice-versa) can mute notifications by going to settings, but has no way to stop the offending user from sending more messages, booking them again, or appearing in their search. There's no "report this user / message" path either — every abuse report must go through the dispute flow today, which is heavy-weight and tied to a specific booking.
- **Proposed solution**: new `user_blocks` table (`blocker_id`, `blocked_id`, `reason`, `created_at`); `report_messages` table (similar). On message send, BFF rejects with 403 if either party has blocked the other. On welper search, exclude blocked welpers from results. Block from any of: thread overflow menu, welper profile, booking detail. Report opens a small modal with categories (spam, abuse, scam, off-platform, other) + free-text. Reports flow into the moderation queue (admin app — separate ticket; this ticket ships the producer side only).
- **Acceptance criteria**:
  - Block from the thread → other party can't send more messages (gets a friendly error); can't book again.
  - Unblock from settings.
  - Report a single message → sends a moderation event with the message id + thread id.
  - Tests cover the BFF guard on send.
- **Effort**: M (producer side); admin moderation queue is a separate ticket.
- **Files**: new `apps/bff/src/domains/trust-safety/{user-block.entity, message-report.entity, trust-safety.service, trust-safety.controller}.ts`, web overflow menu in `MessagesThreadPane`, modal for reporting, settings page block-list section.

---

## MESSAGES-007 — Off-platform exfil + scam content filter

- **Priority**: P1 (T&S; marketplace integrity)
- **Area**: BFF
- **Problem**: A common marketplace exfil pattern: "Why don't you pay me directly via Venmo / Cashapp? I'll give you 10% off." That kills the trust contract — customer loses dispute protection, BFF loses the booking, welper bypasses platform fees, and the customer has no recourse if anything goes wrong. Today there's no detection.
- **Proposed solution**: regex / wordlist filter at `sendMessage` write-time. Detect (a) phone numbers (E.164-ish + US formats), (b) email addresses, (c) common off-platform payment keywords (`venmo`, `cashapp`, `zelle`, `paypal.me`, `bitcoin`, etc.), (d) Telegram / WhatsApp / Signal handles. On match, two policy levels: (1) **soft** — prepend a system warning bubble in the recipient's view: "This message contains contact info — be careful sharing payment details outside Welpco. Welpco can only protect you if your booking is paid through us."; (2) **hard** for repeat offenders or known scam phrases — block the send with a friendly error and log a `message_reports` row for moderator review.
- **Acceptance criteria**:
  - Soft warning fires on first detection per thread.
  - Hard block fires after 3 detections per thread or on a confirmed scam phrase.
  - False-positive rate ≤5% (manual eval on a 200-message corpus).
  - Tests cover the regex set + the soft-vs-hard threshold.
- **Effort**: M.
- **Files**: new `apps/bff/src/domains/communication/content-filter.service.ts`, hooked into `communication.service.sendMessage`. Wordlist in a YAML file under `domains/communication/content-filter.wordlist.ts`.

---

## MESSAGES-008 — Per-thread message rate limit (anti-spam)

- **Priority**: P2
- **Area**: BFF
- **Problem**: Today there's no rate limit on `POST /api/bookings/:bookingId/chat/messages`. A misbehaving client (or a malicious actor) can flood a thread with thousands of messages in a few seconds — which (a) abuses the recipient with notifications, (b) bloats the messages table, (c) breaks the thread UX.
- **Proposed solution**: Redis token-bucket per `(senderId, threadId)` — refill 1 message / 2s, burst 5. On exhaust, BFF responds 429 with retry-after. Web shows "Slow down — wait a moment before sending again."
- **Acceptance criteria**:
  - Burst of 5 messages OK; 6th in <10s blocked.
  - Retry-after header populated.
  - Tests cover the bucket math.
- **Effort**: S (Redis already wired for sessions).
- **Files**: new `apps/bff/src/common/rate-limit/per-resource.guard.ts` (or extend the existing throttler), `communication.controller.ts`.

---

## MESSAGES-009 — Empty / loading thread copy honesty

- **Priority**: P3
- **Area**: Platform `MessageThread` + messages hub
- **Problem**: The empty-thread copy ("No messages yet — Start the conversation — say hello.") is fine for an active booking; for a `COMPLETED` booking it's tone-deaf ("say hello" — they're done). And on the inbox empty state ("No conversations yet — New chats appear here once you have a booking."), an authenticated user with zero bookings has no CTA to make a booking.
- **Proposed solution**: empty-thread copy splits by booking status — for ACCEPTED/IN_PROGRESS: "Start the conversation — coordinate the details." for COMPLETED: "This booking is wrapped up. You can still send a message if anything comes up." Inbox empty state grows a `<Button>Find a Welper</Button>` linking to `/dashboard/search`.
- **Acceptance criteria**:
  - Copy switches by status; manual review by product on each branch.
  - Inbox empty state has a primary CTA.
- **Effort**: XS.
- **Files**: `apps/web/app/(dashboard)/dashboard/messages/messages-hub-client.tsx`, `packages/ui/src/platform/communication/message-thread.tsx` (accept an optional `emptyMessage` prop).

---

## MESSAGES-010 — Mobile composer keyboard avoidance

- **Priority**: P2
- **Area**: Platform `MessageThread` (mobile)
- **Problem**: On 375px viewports with the iOS / Android virtual keyboard open, the composer is pushed off-screen by the keyboard — users can't see what they're typing. The current MessageThread is a fixed-height card (`height: "600px"` line 44 of `message-thread.tsx`), which assumes desktop. On mobile the thread should be full-viewport with the composer pinned to the visual viewport bottom.
- **Proposed solution**: switch the card to use the visual viewport on mobile (`100dvh`/`100svh` modern dynamic viewport units, with a fallback) and let the composer use `position: sticky; bottom: 0` inside the scroll container. Use `interactive-widget=resizes-content` on the meta tag (already shipped on iOS Safari 17+).
- **Acceptance criteria**:
  - Composer stays visible above the keyboard on iOS Safari 16+, Chrome Android.
  - No layout jump when the keyboard opens.
- **Effort**: S.
- **Files**: `packages/ui/src/platform/communication/message-thread.tsx`, `apps/web/app/(dashboard)/dashboard/messages/messages-hub.module.css`.

---

## MESSAGES-011 — Inbox status filter (active / completed / cancelled tabs)

- **Priority**: P3
- **Area**: Web messages hub
- **Problem**: The inbox shows everything — active bookings mixed with cancelled ones from 6 months ago. A power user with 50 bookings has to scroll past dead threads to find the one they care about. Bible §17.3 says useful filters; this is a missing one.
- **Proposed solution**: 3 tabs at the top of the sidebar: All / Active (PENDING / ACCEPTED / IN_PROGRESS / DISPUTED) / Completed (COMPLETED / PAYMENT_RELEASED / CANCELLED / DECLINED / NO_SHOW). Default = Active. Persist last selection in `localStorage` (UI preference; not security-sensitive).
- **Acceptance criteria**:
  - Tabs filter the inbox client-side (already on a 100-row cap from the BFF).
  - Selection persists across reloads.
- **Effort**: XS.
- **Files**: `apps/web/app/(dashboard)/dashboard/messages/messages-hub-client.tsx`.

---

## MESSAGES-012 — Draft persistence per thread

- **Priority**: P3
- **Area**: Web messages hub + platform `ChatInput`
- **Problem**: Today the composer state is local React state. Switching threads clears the draft; closing the tab loses it. For a long, careful message ("about that situation last week — I want to be clear, the thing was…"), losing the draft is a trust-damaging bug.
- **Proposed solution**: persist draft per `bookingId` in `localStorage` (key: `chat-draft:<bookingId>`); restore on thread open; clear on send-success or explicit "Discard draft". Same pattern as the booking wizard form-persistence (`BOOKING-007`).
- **Acceptance criteria**:
  - Type → switch threads → switch back → draft restored.
  - Close tab → reopen → draft restored.
  - Send → draft cleared (no zombie draft after the message lands).
- **Effort**: S.
- **Files**: `apps/web/app/(dashboard)/dashboard/messages/messages-hub-client.tsx`, `packages/ui/src/platform/communication/chat-input.tsx` (accept `value` + `onChange`).

---

## Suggested execution bundles

These are loosely-coupled bundles you can ship in successive PRs without inter-dependencies blocking each other. Within a bundle, tickets are listed in the order they should land.

### Bundle A — Real-time + presence (1.5 sprints)

The "messages feel like a chat app, not a refresh-to-see-it" bundle. Highest leverage by far — every other ticket benefits from this infra.

- MESSAGES-001 — Server push for messages (M, foundational)
- MESSAGES-003 — Read receipts (S)
- MESSAGES-002 — Typing indicator (S)

### Bundle B — Trust + safety (1 sprint)

The "marketplace integrity" bundle. Closes the gaps that would let bad actors abuse the platform. Pair with REVIEWS-007 which builds the same admin moderation queue.

- MESSAGES-006 — Block / report (M)
- MESSAGES-007 — Scam / off-platform filter (M)
- MESSAGES-008 — Rate limit (S)

### Bundle C — Composer polish (1 sprint)

- MESSAGES-004 — Attachments (M)
- MESSAGES-010 — Mobile keyboard avoidance (S)
- MESSAGES-012 — Draft persistence (S)
- MESSAGES-009 — Empty / loading copy honesty (XS)

### Bundle D — Inbox UX (post-Bundle-A)

- MESSAGES-011 — Inbox status tabs (XS)
- MESSAGES-005 — In-thread search (M)
