# Communication Domain

> **Status**: Partial — booking-scoped REST threads/messages and inbox; WebSocket, attachments, support forms, and moderation not implemented
> **Classification**: Core
> **Priority**: High
> **Module**: `domains/communication/` (to be created)

## Purpose

Provides real-time messaging between customers and Welpers, scoped to bookings. Supports text messages, system messages (automated booking status updates), generative UI messages (from the AI chatbot), file/image sharing, read receipts, typing indicators, and support form submission. All communication happens within the platform to ensure safety and auditability.

## Core Capabilities

### 1. Real-Time Messaging via Socket.io

- NestJS WebSocket gateway using `@nestjs/websockets` with Socket.io adapter
- Authenticated connections (JWT token passed during handshake)
- Namespace-based separation: `/messaging` for conversations, `/notifications` for real-time alerts

### 2. Booking-Scoped Conversations

- Every confirmed booking automatically creates a conversation between the customer and the Welper
- Conversations are tied to a specific `bookingId` — participants cannot message outside of booking context
- Conversation remains accessible after booking completion (read-only after 30 days)

### 3. Message Types

| Type | Description | Sender |
|---|---|---|
| `text` | Free-form user message | Customer or Welper |
| `system` | Automated status update (e.g., "Booking confirmed", "Welper checked in") | System |
| `generative_ui` | Rich interactive component from AI chatbot (service cards, calendar picker, map) | AI System |
| `image` | Image attachment via S3 presigned URL | Customer or Welper |
| `file` | File attachment via S3 presigned URL | Customer or Welper |

### 4. Read Receipts & Typing Indicators

- Read receipts: when a user opens a conversation, all unread messages are marked as read and a `messages_read` event is emitted to the other participant
- Typing indicators: `typing_start` and `typing_stop` events broadcasted via WebSocket (debounced, no persistence)

### 5. File & Image Sharing

- Files are uploaded to S3 via presigned URLs (never through the backend directly)
- Flow: client requests presigned upload URL → uploads directly to S3 → sends message with the S3 object key
- Supported types: JPEG, PNG, GIF, WebP, PDF (max 10MB)
- Images are served via CloudFront CDN URLs

### 6. Support Form Integration

- Support form submissions create a `SupportTicket` in the Dispute Resolution domain
- Pre-filled fields: user name, email, phone, related booking ID (if from a booking context)
- Support form is accessible from any page and from within conversations

### 7. Moderation

- **Profanity filter**: server-side check against a configurable word list before message persistence
- **PII detection**: regex-based detection of phone numbers, email addresses, and social media handles in messages — flagged but not blocked (warning shown to user)
- **Rate limiting**: max 30 messages per minute per user per conversation (WebSocket-level throttle)
- **Abuse reporting**: users can flag a message; flagged messages are queued for admin review

## Data Entities

### Conversation

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `bookingId` | `uuid` | FK → `Booking.id`, unique |
| `customerId` | `uuid` | FK → `UserAccount.id` |
| `welperId` | `uuid` | FK → `UserAccount.id` |
| `status` | `enum` | `Active`, `ReadOnly`, `Closed` |
| `lastMessageAt` | `timestamptz` | Updated on each new message |
| `createdAt` | `timestamptz` | Auto |

### Message

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `conversationId` | `uuid` | FK → `Conversation.id` |
| `senderId` | `uuid` | FK → `UserAccount.id`, nullable (null for system messages) |
| `messageType` | `enum` | `text`, `system`, `generative_ui`, `image`, `file` |
| `content` | `text` | Message body (text or JSON for generative_ui) |
| `attachmentUrl` | `varchar(500)` | S3 URL, nullable |
| `attachmentMimeType` | `varchar(100)` | Nullable |
| `attachmentSizeBytes` | `integer` | Nullable |
| `isRead` | `boolean` | Default `false` |
| `readAt` | `timestamptz` | Nullable |
| `isFlagged` | `boolean` | Default `false` |
| `flagReason` | `varchar(255)` | Nullable |
| `isDeleted` | `boolean` | Default `false` (soft delete) |
| `createdAt` | `timestamptz` | Auto |

### SupportFormSubmission

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id` |
| `userType` | `enum` | `Customer`, `Welper` |
| `name` | `varchar(200)` | Pre-filled from profile |
| `email` | `varchar(255)` | Pre-filled |
| `phone` | `varchar(30)` | Pre-filled |
| `subject` | `varchar(200)` | Not null |
| `message` | `text` | Not null |
| `bookingId` | `uuid` | FK → `Booking.id`, nullable |
| `status` | `enum` | `Submitted`, `Forwarded` |
| `createdAt` | `timestamptz` | Auto |

## WebSocket Events

### Namespace: `/messaging`

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join_conversation` | Client → Server | `{ conversationId }` | Join a conversation room |
| `leave_conversation` | Client → Server | `{ conversationId }` | Leave a conversation room |
| `send_message` | Client → Server | `{ conversationId, content, messageType, attachmentUrl? }` | Send a message |
| `new_message` | Server → Client | Full `Message` object | Broadcast to conversation participants |
| `messages_read` | Server → Client | `{ conversationId, readBy, readAt }` | Read receipt |
| `typing_start` | Client → Server | `{ conversationId }` | User started typing |
| `typing_stop` | Client → Server | `{ conversationId }` | User stopped typing |
| `typing_indicator` | Server → Client | `{ conversationId, userId, isTyping }` | Typing indicator broadcast |

### Namespace: `/notifications`

| Event | Direction | Payload | Description |
|---|---|---|---|
| `subscribe` | Client → Server | `{ userId }` | Subscribe to user's notification channel |
| `notification` | Server → Client | `{ type, title, body, data }` | Real-time in-app notification |
| `unread_count` | Server → Client | `{ count }` | Updated unread message count |

## API Endpoints (REST)

REST endpoints complement WebSocket for cases where real-time is not needed.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/conversations` | Bearer | List conversations for current user (paginated). |
| `GET` | `/conversations/:id` | Bearer | Get conversation with recent messages. |
| `GET` | `/conversations/:id/messages` | Bearer | Paginated message history. Params: `before` (cursor), `limit`. |
| `POST` | `/conversations/:id/messages/:msgId/flag` | Bearer | Flag a message for moderation. |
| `POST` | `/conversations/upload-url` | Bearer | Get S3 presigned upload URL. Body: `{ fileName, mimeType }`. |
| `POST` | `/support/submit` | Bearer | Submit support form. |

## Business Rules

1. **Conversations are 1:1 per booking**: one customer + one Welper per conversation. No group chats.
2. **Booking must be confirmed**: conversation is created when booking reaches `Confirmed` status.
3. **Read-only after 30 days**: conversations become read-only 30 days after booking completion. Messages are preserved for dispute resolution.
4. **System messages are not editable or deletable**: they serve as an audit trail of booking events.
5. **PII warning**: the platform warns users when PII (phone, email) is detected in messages. Communication outside the platform voids platform protections.
6. **File size limit**: max 10MB per attachment. Only allowed MIME types are accepted.
7. **Rate limit**: 30 messages/minute/user/conversation. Excess messages receive a `429` error via WebSocket.
8. **Message retention**: messages are retained indefinitely for dispute resolution. Soft-deleted messages are hidden from users but preserved in the database.

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Depends on** | User Management | JWT authentication for WebSocket handshake |
| **Depends on** | Booking & Scheduling | Booking confirmation creates conversation; booking events generate system messages |
| **Depends on** | Dispute Resolution | Support form creates support ticket |
| **Consumed by** | Notification | New message triggers push/email notification if recipient is offline |
| **Consumed by** | Dispute Resolution | Message history used as evidence in disputes |
| **Consumed by** | AI Conversational Experience (future) | Generative UI messages injected into conversations |

## Security Considerations

- WebSocket connections require valid JWT token during handshake (`auth.token` in connection query)
- Users can only join conversations they are a participant in (server-side validation)
- S3 presigned URLs expire after 15 minutes
- File uploads are scanned for malware (future: integration with AWS S3 Object Lambda or ClamAV)
- Soft-deleted messages are hidden from API responses but retained for admin access
- Moderation queue is accessible only to admin users

## Implementation Plan

### Phase 1 — Core Messaging (Sprint 1-2)
1. Create `CommunicationModule` with WebSocket gateway (`@WebSocketGateway`)
2. Implement conversation creation on booking confirmation
3. Text message send/receive with persistence
4. REST endpoints for message history

### Phase 2 — Rich Features (Sprint 3)
1. Read receipts and typing indicators
2. S3 presigned URL flow for file/image uploads
3. System message generation from booking events
4. Moderation: profanity filter and PII detection

### Phase 3 — Support & Polish (Sprint 4)
1. Support form submission and ticket creation
2. `/notifications` WebSocket namespace for real-time alerts
3. Unread count tracking
4. Message flagging and admin moderation queue
