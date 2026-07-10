# Notification Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Root: `apps/bff/src/domains/notification/`

## Purpose
In-app notification store plus email fan-out, with per-user, per-category channel preferences and locale-aware email rendering. Other domains call `NotificationService`/`EmailNotificationService`; the HTTP layer lives in the `modules/notifications` facade.

## Entities (`entities/`)

| Entity | Table | Key fields | Enums |
|---|---|---|---|
| `Notification` | `notifications` | userId, category, channel, title, body, isRead, readAt, metadata (jsonb) | `NotificationCategory`: booking, payment, review, message, dispute, job, security, system · `NotificationChannel`: email, in_app |
| `NotificationPreference` | `notification_preferences` | userId, category, emailEnabled, inAppEnabled | — |

## Services

- `NotificationService` (`notification.service.ts`) — `emitForUser`/`send` (preference-aware, deduplicating via `isDuplicate`), list with filters, unread count, mark read / mark all / clear all, get/update preferences, `deleteForUser`. Resolves user locale via `notification-locale.helper.ts`.
- `EmailNotificationService` (`email-notification.service.ts`, bound to token `EMAIL_NOTIFICATION_SERVICE`) — typed email senders (`sendBookingEmailForUser`, `sendPaymentEmailForUser`, `sendDisputeEmailForUser`, `sendWelcomeEmail`, generic) and guardian-copy emails for minor welpers (reads `MinorGuardianConsent`).

## API endpoints (prefix `api`)

No controller in the domain folder. Routes are exposed by the facade `apps/bff/src/modules/notifications/notifications.controller.ts`, all `JwtAuthGuard`:

| Method | Path |
|---|---|
| GET | /api/notifications |
| GET | /api/notifications/unread-count |
| POST | /api/notifications/:id/read |
| POST | /api/notifications/read-all |
| POST | /api/notifications/clear-all |
| GET | /api/notifications/preferences |
| PUT | /api/notifications/preferences |

## Scheduled jobs
None.

## External integrations
Email delivery via user-management's `EmailModule` → `@welpco/email` (Resend API, SMTP fallback). No push/SMS provider (no Twilio).

## Cross-domain dependencies
Imports `UserAccount` (user-management) and `MinorGuardianConsent` (safety-verification) entities, and user-management `EmailModule`. Consumed by booking, payment, dispute, review, job-posting and communication for event notifications.

## Key files
- `notification.module.ts`, `notification.service.ts`, `email-notification.service.ts`
- `entities/notification.entity.ts`, `entities/notification-preference.entity.ts`
- Facade: `apps/bff/src/modules/notifications/`
