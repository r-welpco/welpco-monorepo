# Notification Domain

> **Status**: Partial — transactional email for booking lifecycle (SMTP; Mailhog in dev); SMS, push, and full template/preference product not implemented
> **Classification**: Infrastructure
> **Priority**: High
> **Module**: `domains/notification/` (to be created)

## Purpose

Provides multi-channel notification delivery (email, SMS, push, in-app) with a template system, user preferences, scheduled notifications, delivery tracking, and retry logic. Serves as the centralized notification hub that all other domains use to communicate with users. Handles both transactional notifications (booking confirmations) and scheduled notifications (reminders, review prompts).

## Core Capabilities

### 1. Notification Channels

| Channel | Provider | Use Case |
|---|---|---|
| **Email** | AWS SES (Simple Email Service) | Detailed notifications: booking confirmations, receipts, dispute updates |
| **SMS** | AWS SNS (Simple Notification Service) | Time-sensitive: booking reminders, verification codes |
| **Push** | FCM (Android) / APNS (iOS) | Real-time alerts: new messages, booking accepted, payment released |
| **In-App** | WebSocket (`/notifications` namespace) | Live UI updates: unread counts, status changes |

### 2. Template System

- **Email templates**: MJML (responsive email markup) compiled to HTML at build time
- **SMS templates**: plain text with variable interpolation
- **Push templates**: title + body + optional deep link
- Templates support **Handlebars** syntax for variable interpolation:

```handlebars
Hi {{firstName}},

Your booking with {{welperName}} on {{bookingDate}} has been confirmed.

Service: {{serviceName}}
Time: {{startTime}} - {{endTime}}
Address: {{serviceAddress}}

[View Booking]({{bookingUrl}})
```

- Templates are versioned and stored in the database
- Each notification type has a default template per channel

### 3. Notification Preferences

Users can configure per-channel preferences for each notification category:

| Category | Email | SMS | Push | In-App | Overridable |
|---|---|---|---|---|---|
| Booking updates | Default ON | Default ON | Default ON | Always ON | Yes |
| Payment updates | Default ON | Default OFF | Default ON | Always ON | Yes |
| Reminders | Default ON | Default ON | Default ON | Always ON | Yes |
| Review prompts | Default ON | Default OFF | Default ON | Always ON | Yes |
| Marketing | Default OFF | Default OFF | Default OFF | Default OFF | Yes |
| Security alerts | Always ON | Always ON | Always ON | Always ON | **No** (critical) |
| Dispute updates | Always ON | Default OFF | Always ON | Always ON | **No** (critical) |

- Critical notifications (security, disputes) cannot be disabled by the user
- Users manage preferences via the settings page

### 4. Scheduled Notifications

| Trigger | Timing | Notification |
|---|---|---|
| Booking confirmed | +36h before service | Reminder with modify/cancel options |
| Booking confirmed | +1h before service | Final reminder with address and contact |
| Service completed | +24h after | Review prompt to customer |
| Background check expiring | -30 days | Renewal reminder to Welper |
| Job posting | -3 days before expiry | Expiration warning to customer |

Scheduling is implemented via a `ScheduledNotification` table and a NestJS `@Cron` job that runs every minute, picking up due notifications.

### 5. Delivery Tracking & Retry Logic

- Every notification attempt is logged with status: `Pending`, `Sent`, `Delivered`, `Failed`, `Bounced`
- **Email**: delivery status via AWS SES notifications (SNS topic for bounces/complaints)
- **SMS**: delivery receipt via AWS SNS
- **Push**: delivery receipt via FCM/APNS response

**Retry strategy (exponential backoff)**:

| Attempt | Delay | Max Retries |
|---|---|---|
| 1st retry | 1 minute | — |
| 2nd retry | 5 minutes | — |
| 3rd retry | 30 minutes | — |
| 4th retry | 2 hours | — |
| Final | — | Marked as `Failed`, alert to admin |

### 6. Unsubscribe Handling

- Every marketing email includes an unsubscribe link (CAN-SPAM / CASL compliance)
- Unsubscribe link updates the user's notification preferences
- One-click unsubscribe header (`List-Unsubscribe`) included in marketing emails
- Transactional emails (booking confirmations, security alerts) do not include unsubscribe — they are legally required

### 7. CAN-SPAM / CASL Compliance

- **Transactional notifications**: booking confirmations, payment receipts, security alerts — always sent, no opt-out
- **Marketing notifications**: promotional offers, platform news — opt-in required, easy opt-out
- All marketing emails include: sender identity, physical address, unsubscribe link
- SMS marketing requires explicit opt-in during registration

## Data Entities

### Notification

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id` |
| `channel` | `enum` | `Email`, `SMS`, `Push`, `InApp` |
| `category` | `enum` | `Booking`, `Payment`, `Review`, `Dispute`, `Security`, `Marketing`, `System` |
| `templateId` | `uuid` | FK → `NotificationTemplate.id` |
| `subject` | `varchar(255)` | For email; nullable for other channels |
| `body` | `text` | Rendered content |
| `recipientAddress` | `varchar(255)` | Email address, phone number, or device token |
| `status` | `enum` | `Pending`, `Sent`, `Delivered`, `Failed`, `Bounced` |
| `retryCount` | `integer` | Default `0` |
| `nextRetryAt` | `timestamptz` | Nullable |
| `sentAt` | `timestamptz` | Nullable |
| `deliveredAt` | `timestamptz` | Nullable |
| `failureReason` | `text` | Nullable |
| `externalMessageId` | `varchar(255)` | SES message ID, SNS message ID, etc. |
| `metadata` | `jsonb` | Additional context (bookingId, deep link, etc.) |
| `createdAt` | `timestamptz` | Auto |

### NotificationTemplate

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `varchar(100)` | Unique identifier (e.g., `booking_confirmed_email`) |
| `channel` | `enum` | `Email`, `SMS`, `Push` |
| `category` | `enum` | Same as Notification categories |
| `subjectTemplate` | `varchar(255)` | Handlebars template for subject |
| `bodyTemplate` | `text` | Handlebars/MJML template for body |
| `variables` | `jsonb` | List of expected variables with descriptions |
| `version` | `integer` | Template version number |
| `isActive` | `boolean` | Default `true` |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### NotificationPreference

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id` |
| `category` | `enum` | Notification category |
| `emailEnabled` | `boolean` | |
| `smsEnabled` | `boolean` | |
| `pushEnabled` | `boolean` | |
| `inAppEnabled` | `boolean` | Always `true` for most categories |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

**Unique constraint**: `(userId, category)`

### ScheduledNotification

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `notificationType` | `varchar(100)` | e.g., `booking_reminder_36h`, `review_prompt` |
| `userId` | `uuid` | FK → `UserAccount.id` |
| `scheduledFor` | `timestamptz` | When to send |
| `templateId` | `uuid` | FK → `NotificationTemplate.id` |
| `templateVariables` | `jsonb` | Variables for template rendering |
| `status` | `enum` | `Scheduled`, `Sent`, `Cancelled` |
| `referenceId` | `uuid` | Related entity ID (bookingId, etc.) |
| `referenceType` | `varchar(50)` | `Booking`, `Job`, `Review`, etc. |
| `sentAt` | `timestamptz` | Nullable |
| `cancelledAt` | `timestamptz` | Nullable |
| `createdAt` | `timestamptz` | Auto |

### PushDeviceToken

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `userId` | `uuid` | FK → `UserAccount.id` |
| `platform` | `enum` | `iOS`, `Android`, `Web` |
| `token` | `varchar(500)` | FCM or APNS token |
| `isActive` | `boolean` | Default `true` |
| `lastUsedAt` | `timestamptz` | |
| `createdAt` | `timestamptz` | Auto |

## API Endpoints

All prefixed with `/api/notifications`.

### User Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications` | Bearer | List in-app notifications (paginated, newest first). |
| `GET` | `/notifications/unread-count` | Bearer | Get unread notification count. |
| `POST` | `/notifications/:id/read` | Bearer | Mark a notification as read. |
| `POST` | `/notifications/read-all` | Bearer | Mark all notifications as read. |
| `GET` | `/notifications/preferences` | Bearer | Get user's notification preferences. |
| `PUT` | `/notifications/preferences` | Bearer | Update notification preferences. |
| `POST` | `/notifications/push-token` | Bearer | Register a push device token. |
| `DELETE` | `/notifications/push-token/:tokenId` | Bearer | Unregister a device token. |

### Internal Endpoints (called by other domains)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/notifications/send` | Internal | Send a notification. Body: `{ userId, templateName, variables, channels? }`. |
| `POST` | `/notifications/schedule` | Internal | Schedule a future notification. Body: `{ userId, templateName, variables, scheduledFor, referenceId, referenceType }`. |
| `POST` | `/notifications/cancel-scheduled` | Internal | Cancel a scheduled notification. Body: `{ referenceId, referenceType, notificationType }`. |

### Admin Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications/templates` | Admin | List all templates. |
| `POST` | `/notifications/templates` | Admin | Create a template. |
| `PATCH` | `/notifications/templates/:id` | Admin | Update a template. |
| `GET` | `/notifications/delivery-report` | Admin | Delivery statistics (sent, delivered, failed, bounced). |

## Business Rules

1. **Channel selection**: when a domain calls `send`, the Notification service determines which channels to use based on the user's preferences and the notification category. Critical notifications override preferences.
2. **Template rendering**: templates are rendered server-side with Handlebars. Missing variables are rendered as empty strings (not errors).
3. **Deduplication**: notifications with the same `userId + templateName + referenceId` within 5 minutes are deduplicated.
4. **Scheduled notification cancellation**: when a booking is cancelled, all scheduled reminders for that booking are cancelled.
5. **Push token cleanup**: tokens that receive `InvalidRegistration` or `NotRegistered` errors from FCM/APNS are marked inactive.
6. **Email bounce handling**: hard bounces mark the email as invalid on the user account. Soft bounces trigger retries.
7. **SMS rate limiting**: max 5 SMS per user per hour to prevent abuse.
8. **In-app notifications are always created**: even if the user disables email/SMS/push for a category, the in-app notification is still created for the notification center.

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Consumed by all domains** | — | All domains call `send` or `schedule` to trigger notifications |
| **Depends on** | User Management | User contact info (email, phone) and account status |
| **Depends on** | Communication | WebSocket `/notifications` namespace for real-time in-app delivery |
| **Depends on** | External: AWS SES | Email delivery |
| **Depends on** | External: AWS SNS | SMS delivery |
| **Depends on** | External: FCM/APNS | Push notification delivery |

## Security Considerations

- AWS SES credentials stored as environment variables (`AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY`, `AWS_SES_REGION`)
- Email sending domain is verified in SES with DKIM and SPF records
- Push device tokens are user-scoped — a user can only register/unregister their own tokens
- Notification content never includes sensitive data (passwords, full payment details)
- Unsubscribe tokens are signed (HMAC) to prevent unauthorized preference changes

## Implementation Plan

### Phase 1 — Email & In-App (Sprint 1-2)
1. Create `NotificationModule` with entities and migrations
2. AWS SES integration for email delivery
3. MJML email template compilation pipeline
4. In-app notification creation and REST API
5. WebSocket integration for real-time in-app delivery
6. `send` internal endpoint for other domains to use

### Phase 2 — Scheduling & Preferences (Sprint 3)
1. Scheduled notification table and cron job (runs every minute)
2. Notification preferences CRUD
3. Preference-aware channel selection logic
4. Retry logic with exponential backoff

### Phase 3 — SMS & Push (Sprint 4)
1. AWS SNS integration for SMS
2. FCM/APNS integration for push notifications
3. Push device token management
4. Delivery tracking and bounce handling

### Phase 4 — Compliance & Admin (Sprint 5)
1. Unsubscribe link generation and handling
2. CAN-SPAM/CASL compliance headers
3. Admin template management
4. Delivery report dashboard
