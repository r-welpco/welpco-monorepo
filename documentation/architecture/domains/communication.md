# Communication Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Root: `apps/bff/src/domains/communication/`

## Purpose
Booking-scoped chat between customer and welper: one thread per booking, message history with pagination, per-participant read markers, and a cross-booking inbox view.

## Entities (`entities/`)

| Entity | Table | Key fields |
|---|---|---|
| `ChatThread` | `chat_threads` | bookingId (unique), lastReadAtCustomer, lastReadAtWelper |
| `Message` | `messages` | chatThreadId, senderId, content (text) |

No status/type enums in this domain.

## Services

- `CommunicationService` (`communication.service.ts`) — `getOrCreateThread`, `getMessages` (paginated), `sendMessage` (participant + messaging-window checks via `assertParticipant`/`assertMessagingAllowed` against the booking's status), `markThreadRead`, `listChatInbox` (joins bookings + counterpart profiles, unread counts). Sending a message emits a `message`-category notification through the notification domain.

## API endpoints (prefix `api`)

Both controllers: class-level `JwtAuthGuard + SignupCompletedGuard`.

| Method | Path | Notes |
|---|---|---|
| GET | /api/bookings/:bookingId/chat | get/create thread (`communication.controller.ts`) |
| GET | /api/bookings/:bookingId/chat/messages | paginated (`dto/messages-query.dto.ts`) |
| POST | /api/bookings/:bookingId/chat/messages | send message (201) |
| POST | /api/bookings/:bookingId/chat/read | update read marker |
| GET | /api/chat/inbox | inbox list (`chat-inbox.controller.ts`) |

## Scheduled jobs
None.

## External integrations
None. Messaging is REST/polling only — no WebSocket gateway and no third-party chat provider in this domain.

## Cross-domain dependencies
Imports booking (`BookingModule` + `BookingRequest` entity — participant/window checks), user-management users, profile-management (welper + customer profiles for inbox display), notification (`NotificationModule` for new-message notifications), and payment (`ApplicationSettingsService` for settings used in messaging rules).

## Key files
- `communication.module.ts`
- `communication.service.ts`
- `communication.controller.ts`, `chat-inbox.controller.ts`
- `entities/chat-thread.entity.ts`, `entities/message.entity.ts`
