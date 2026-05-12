# Booking & Scheduling Domain

> **Status**: Implemented (core lifecycle) — acceptance/decline, check-in/out, service receipt, cancellation, payment hooks; recurring bookings and automated reminders not yet implemented
> **Classification**: Core
> **Priority**: Critical
> **Module**: `domains/booking/`

**Implemented BFF path (simplified):** there is no separate `confirmed` status. Flow is `pending` → `accepted` (welper accept; customer authorizes Stripe hold while `accepted`) → `in_progress` (check-in) → `completed` (check-out) → `payment_released` (after capture succeeds). The `no_show` enum value remains for legacy DB rows and future welper tooling, not the default happy path.

## Purpose

Manages the complete booking lifecycle from creation through service completion and payment release. Handles acceptance workflows, payment hold coordination, check-in/check-out, recurring bookings, modifications, cancellations, calendar conflict detection, and reminder scheduling. This is the central transaction domain of the platform.

## Core Capabilities

### 1. Booking Creation

- Created directly from search results (customer selects Welper + service + date/time)
- Created automatically when a job application is accepted (from Job Posting domain)
- Validates Welper availability and detects calendar conflicts before creation

### 2. Full State Machine

**Target / rich product vision** (below) may include steps not all wired in code yet. **Current BFF:** no `confirmed` row — use `accepted` through payment authorization, then `in_progress` → `completed` → `payment_released` after Stripe capture.

```
┌───────────────────┐
│  PendingApproval   │  ← Booking created, waiting for Welper response
└────────┬──────────┘
         │
    ┌────▼────┐     ┌──────────┐
    │Accepted │     │ Declined │  → Customer notified with link to search
    └────┬────┘     └──────────┘
         │
         │ Customer authorizes Stripe (manual capture) while accepted
         │
         │ Welper taps "Start Service"
         │
    ┌────▼───────┐
    │ InProgress │  ← Check-in recorded with timestamp (+ optional GPS)
    └────┬───────┘
         │
         │ Welper taps "Complete Service"
         │
    ┌────▼───────┐
    │ Completed  │  ← Check-out recorded; capture delay starts
    └────┬───────┘
         │
         │ Stripe capture succeeds (scheduler / webhook)
         │
    ┌────▼───────────┐
    │ PaymentReleased │  ← Booking status after capture (MVP: platform account)
    └─────────────────┘

  ── Branching states ──

    ┌───────────┐
    │ Cancelled │  ← By customer or Welper; cancellation policy (fees TBD in MVP)
    └───────────┘

    ┌───────────┐
    │ Disputed  │  ← Escalated to Dispute Resolution domain
    └───────────┘

    ┌────────────┐
    │ NoShow     │  ← Reserved / legacy; not created by default API path today
    └────────────┘
```

### State Transition Rules

| From | To | Trigger | Side Effects |
|---|---|---|---|
| `PendingApproval` | `Accepted` | Welper accepts (within 48h) | Trigger payment hold |
| `PendingApproval` | `Declined` | Welper declines | Notify customer with search link |
| `PendingApproval` | `Expired` | 48h timeout | Auto-decline, notify customer |
| `Accepted` | `Confirmed` | Payment hold succeeds | Schedule reminders (36h + 1h) |
| `Accepted` | `Cancelled` | Payment hold fails | Notify both parties |
| `Confirmed` | `InProgress` | Welper check-in | Record timestamp + optional GPS |
| `Confirmed` | `Cancelled` | Customer or Welper cancels | Apply cancellation policy |
| `Confirmed` | `NoShow` | 30 min past start, no check-in | Auto-detect via cron, notify customer |
| `InProgress` | `Completed` | Welper check-out | Trigger receipt + review prompt (24h) |
| `Completed` | `PaymentReleased` | 24h auto-release (or dispute window) | Release funds to Welper |
| `Completed` | `Disputed` | Customer files dispute within 24h | Freeze payment, escalate |
| Any pre-`Completed` | `Cancelled` | Cancel action | Apply policy, process refund if paid |

### 3. Modification Workflow

- Either party can request a modification (reschedule date/time, change duration, price adjustment)
- Modifications create a `BookingModification` record with `Pending` status
- Other party must approve or reject the modification
- Approved modifications update the booking and re-check calendar conflicts
- Modifications within 24h of service start are restricted (only cancellation allowed)

### 4. Recurring Bookings

- Supports `daily`, `weekly`, and `monthly` recurrence patterns
- Customer sets a recurrence pattern with an optional end date
- System generates individual bookings for each occurrence
- Each occurrence goes through the normal acceptance flow independently
- Recurring series can be cancelled (cancels all future unconfirmed occurrences)
- Maximum series length: 52 occurrences (1 year weekly)

### 5. Reminder System

- **36 hours before**: reminder to both parties with options to modify or cancel
- **1 hour before**: final reminder to both parties with service address and contact info
- Reminders are scheduled when booking status transitions to `Confirmed`
- If the booking is cancelled, pending reminders are cancelled

### 6. Calendar Conflict Detection

- Before creating or modifying a booking, check the Welper's existing confirmed bookings for time overlap
- Also checks against the Welper's availability calendar (recurring patterns + exceptions)
- Buffer time: 30 minutes between consecutive bookings for travel
- Conflict returns `409 Conflict` with details of the conflicting booking time

### 7. Cancellation Policy

| Timing | Cancelled By | Result |
|---|---|---|
| > 24h before service | Customer | Full refund |
| > 24h before service | Welper | Full refund + Welper reliability score impact |
| 2-24h before service | Customer | 50% refund (50% cancellation fee to Welper) |
| 2-24h before service | Welper | Full refund + stronger reliability impact |
| < 2h before service | Customer | No refund |
| < 2h before service | Welper | Full refund + possible account review |

> **Implementation note (current MVP):** Participant cancel releases **uncaptured** holds only. **Captured** card amounts are **not** auto-refunded using the windows above; use **admin dispute resolution** (Stripe full/partial refunds). The table describes the **target** policy for a later iteration.

## Data Entities

### Booking

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `customerId` | `uuid` | FK → `UserAccount.id` |
| `welperId` | `uuid` | FK → `UserAccount.id` |
| `serviceOfferingId` | `uuid` | FK → `ServiceOffering.id` |
| `jobPostingId` | `uuid` | FK → `JobPosting.id`, nullable |
| `serviceAddress` | `varchar(500)` | Not null |
| `serviceAddressLat` | `decimal(10,7)` | |
| `serviceAddressLng` | `decimal(10,7)` | |
| `scheduledDate` | `date` | Not null |
| `scheduledTimeStart` | `time` | Not null |
| `scheduledTimeEnd` | `time` | Not null |
| `durationHours` | `decimal(4,1)` | Not null |
| `hourlyRate` | `decimal(10,2)` | Snapshot from offering at booking time |
| `totalAmount` | `decimal(10,2)` | `hourlyRate × durationHours` |
| `platformFee` | `decimal(10,2)` | Calculated at booking time |
| `status` | `enum` | See state machine above |
| `recurringBookingId` | `uuid` | FK → `RecurringBooking.id`, nullable |
| `promoCodeId` | `uuid` | FK → `PromoCode.id`, nullable |
| `discountAmount` | `decimal(10,2)` | Default `0.00` |
| `finalAmount` | `decimal(10,2)` | `totalAmount - discountAmount` |
| `welperAcceptedAt` | `timestamptz` | Nullable |
| `confirmedAt` | `timestamptz` | Nullable (after payment hold) |
| `checkInAt` | `timestamptz` | Nullable |
| `checkOutAt` | `timestamptz` | Nullable |
| `completedAt` | `timestamptz` | Nullable |
| `cancelledAt` | `timestamptz` | Nullable |
| `cancelledBy` | `enum` | `Customer`, `Welper`, `System`, nullable |
| `cancellationReason` | `text` | Nullable |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### RecurringBooking

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `customerId` | `uuid` | FK → `UserAccount.id` |
| `welperId` | `uuid` | FK → `UserAccount.id` |
| `serviceOfferingId` | `uuid` | FK → `ServiceOffering.id` |
| `recurrencePattern` | `enum` | `daily`, `weekly`, `monthly` |
| `startDate` | `date` | Not null |
| `endDate` | `date` | Nullable (open-ended if null) |
| `maxOccurrences` | `integer` | Default `52` |
| `isActive` | `boolean` | Default `true` |
| `createdAt` | `timestamptz` | Auto |

### BookingModification

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `bookingId` | `uuid` | FK → `Booking.id` |
| `requestedBy` | `enum` | `Customer`, `Welper` |
| `modificationType` | `enum` | `Reschedule`, `DurationChange`, `PriceChange` |
| `originalValue` | `jsonb` | Previous values |
| `newValue` | `jsonb` | Requested values |
| `status` | `enum` | `Pending`, `Approved`, `Rejected` |
| `respondedAt` | `timestamptz` | Nullable |
| `createdAt` | `timestamptz` | Auto |

### ServiceCheckEvent

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `bookingId` | `uuid` | FK → `Booking.id` |
| `eventType` | `enum` | `CheckIn`, `CheckOut` |
| `timestamp` | `timestamptz` | Not null |
| `latitude` | `decimal(10,7)` | Nullable (GPS optional) |
| `longitude` | `decimal(10,7)` | Nullable |
| `notes` | `text` | Nullable |

### BookingReminder

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `bookingId` | `uuid` | FK → `Booking.id` |
| `reminderType` | `enum` | `36h_before`, `1h_before` |
| `scheduledFor` | `timestamptz` | Not null |
| `sentAt` | `timestamptz` | Nullable |
| `status` | `enum` | `Scheduled`, `Sent`, `Cancelled` |
| `createdAt` | `timestamptz` | Auto |

## API Endpoints

All prefixed with `/api/bookings`.

### Booking Lifecycle

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/bookings` | Bearer (Customer) | Create a booking (direct or auto from job). |
| `GET` | `/bookings` | Bearer | List bookings for current user (customer or Welper view). Filters: `status`, `from`, `to`. |
| `GET` | `/bookings/:id` | Bearer | Get booking details. |
| `POST` | `/bookings/:id/accept` | Bearer (Welper) | Accept a pending booking. |
| `POST` | `/bookings/:id/decline` | Bearer (Welper) | Decline a pending booking. |
| `POST` | `/bookings/:id/cancel` | Bearer | Cancel booking. Body: `{ reason }`. |
| `POST` | `/bookings/:id/check-in` | Bearer (Welper) | Record service start. Body: `{ lat?, lng?, notes? }`. |
| `POST` | `/bookings/:id/check-out` | Bearer (Welper) | Record service end. Body: `{ notes? }`. |

### Modifications

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/bookings/:id/modifications` | Bearer | Request a modification. |
| `POST` | `/bookings/:id/modifications/:modId/approve` | Bearer | Approve a modification request. |
| `POST` | `/bookings/:id/modifications/:modId/reject` | Bearer | Reject a modification request. |

### Recurring Bookings

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/bookings/recurring` | Bearer (Customer) | Create a recurring booking series. |
| `GET` | `/bookings/recurring/:id` | Bearer | Get recurring series details with all occurrences. |
| `POST` | `/bookings/recurring/:id/cancel` | Bearer | Cancel all future unconfirmed occurrences. |

## Business Rules

1. **Welper response window**: 48 hours to accept or decline. Auto-expires if no response.
2. **Booking requires payment hold**: after Welper accepts, payment authorization must succeed before status moves to `Confirmed`. Failed auth → `Cancelled`.
3. **Calendar conflict**: booking creation and modifications check for time overlap with existing confirmed bookings + 30-min buffer.
4. **No-show detection**: a cron job runs every 15 minutes. If a booking is `Confirmed` and the scheduled start was > 30 minutes ago with no check-in, it transitions to `NoShow`.
5. **Automatic payment release**: 24 hours after `Completed` status, if no dispute is filed, funds are released automatically.
6. **Hourly rate snapshot**: the rate is captured from the service offering at booking creation time. Later rate changes do not affect existing bookings.
7. **Recurring booking limits**: max 52 occurrences. Each occurrence is an independent `Booking` entity that goes through its own acceptance flow.

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Depends on** | User Management | Authenticated user context |
| **Depends on** | Profile Management | Welper availability for conflict detection |
| **Depends on** | Service Discovery | Service selection triggers booking creation |
| **Depends on** | Job Posting & Matching | Job acceptance creates booking |
| **Depends on** | Payment Processing | Payment hold on acceptance, release on completion |
| **Depends on** | Notification | Reminders, status change notifications |
| **Produces for** | Review & Rating | `ServiceCompleted` event enables review submission |
| **Produces for** | Dispute Resolution | Booking context for disputes |
| **Produces for** | Payment Processing | Triggers authorization, capture, and release |

## Security Considerations

- Welpers can only accept/decline/check-in/check-out bookings assigned to them
- Customers can only view and manage their own bookings
- Service address is shared with the Welper only after the booking is confirmed
- GPS location on check-in is optional and stored for dispute resolution purposes only
- Admin users can force status transitions for support cases

## Implementation Plan

### Phase 1 — Core Booking Flow (Sprint 1-2)
1. Extend existing `BookingRequest` entity to full `Booking` entity with state machine
2. Implement accept/decline workflow with 48h timeout (NestJS `@Cron`)
3. Integrate with Payment Processing for hold/release (initially stubbed)
4. Implement check-in/check-out endpoints

### Phase 2 — Advanced Features (Sprint 3-4)
1. Modification workflow with approval
2. Calendar conflict detection with 30-min buffer
3. Recurring booking generation
4. Cancellation policy enforcement with refund calculation
5. No-show detection cron job

### Phase 3 — Reminders & Polish (Sprint 5)
1. Reminder scheduling (36h and 1h)
2. Integration with Notification domain for all alerts
3. Admin override endpoints for support cases
