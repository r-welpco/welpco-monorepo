# Booking Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

`apps/bff/src/domains/booking/` — the booking request lifecycle from customer request through welper acceptance, service delivery, receipt-based billing, and hand-off to payment release.

## Purpose

Customers book a welper's service offering for a scheduled time slot; welpers accept/decline, check in/out, and submit a service receipt that triggers payment capture. The domain owns the booking state machine, conflict checking, the cancellation policy, and the service receipt.

## Entities (`entities/`)

| Entity | Table | Key fields | Status enum |
|---|---|---|---|
| `BookingRequest` (`booking-request.entity.ts`) | `booking_requests` | `customerId`, `welperId`, `serviceOfferingId`, `answers` (jsonb), scheduling (`scheduledDate`, `scheduledStartTime`, `scheduledEndTime`, `durationMinutes`, `timezoneOffsetMinutes`), pricing (`hourlyRate`, `totalPrice`), `address` (jsonb), lifecycle timestamps (`acceptedAt`, `declinedAt`, `checkedInAt`, `checkedOutAt`, `completedAt`, `paymentReleasedAt`, `cancelledAt`), cancellation/decline reason fields, and payment-authorization tracking columns (`paymentAuthorizationStatus/ScheduledAt/DueAt/DeadlineAt/LastAttemptAt/AttemptCount/FailureCode/FailureMessage/LeaseUntil`, `holdStripeTaxCalculationId`) | `BookingRequestStatus`: `pending`, `accepted`, `in_progress`, `completed`, `payment_released`, `declined`, `cancelled`, `disputed`, `no_show` |
| `BookingServiceReceipt` (`booking-service-receipt.entity.ts`) | `booking_service_receipts` | One per booking: `billingCheckInAt`/`billingCheckOutAt` (snapped to 15-min grid), `hourlyRate`, `subtotalCents`, `taxCents`, `taxRateBps`, `totalCents`, Stripe Tax columns (`stripeTaxCalculationId`, `stripeTaxTransactionId/Status/Error`), `notes`, `confirmedAt`, `sentToCustomerAt`, `evidenceFiles` (jsonb, S3 keys) | — |

There is **no** `Confirmed` status — it was removed by migration `migrations/20260403000001-RemoveConfirmedBookingStatus.ts`.

## State machine (`booking-state-machine.ts`)

`validateTransition(current, next)` throws `BadRequestException` on invalid transitions. The full transition table:

| From | Allowed next |
|---|---|
| `pending` | `accepted`, `declined`, `cancelled` |
| `accepted` | `in_progress`, `cancelled` |
| `in_progress` | `completed`, `disputed` |
| `completed` | `payment_released`, `disputed` |
| `payment_released` | `disputed` |
| `declined` | *(terminal)* |
| `cancelled` | *(terminal)* |
| `disputed` | `completed`, `cancelled` |
| `no_show` | `cancelled`, `disputed` |

Note: no code path currently sets `no_show`; the status exists in the enum/state machine and is read by other domains (job-posting status helper, welper aggregates, communication) but has no setter in `BookingService`.

### Which service methods perform which transitions (`booking.service.ts`)

| Transition | Method | Details |
|---|---|---|
| — → `pending` | `create()` | Customer creates request; requires a default payment method (`PaymentService.assertCustomerHasDefaultPaymentMethod`), validates service-question answers, resolves address, checks scheduling conflicts (`checkConflicts`) |
| `pending → accepted` | `accept()` | Welper accepts. Order: background-check gate (`BackgroundCheckService.assertCanAcceptBookings`), lock + conflict re-check, then `PaymentService.prepareAuthorizationForAcceptance()` (**hold placed or scheduled before the status flips**), then locked transition to `accepted`. If the final transaction fails the hold is released (`onBookingCanceled`) |
| `pending → declined` | `decline()` | Welper declines; `onBookingCanceled` releases any hold |
| `accepted → in_progress` | `checkIn()` | Welper checks in (`checkedInAt`) |
| `in_progress → completed` | `submitServiceReceipt()` (also called by `checkOut()`, which auto-fills the billing window from `checkedInAt`→now) | Persists the receipt (subtotal from billed minutes × hourly rate, tax via `BookingTaxService.quoteServiceReceipt`), flips to `completed`, then `PaymentService.captureForServiceReceipt()` captures the hold + optional delta charge. **On capture failure the receipt is deleted and the booking rolled back to `in_progress`.** May return `deltaPayment` (client secret) when customer SCA is needed |
| `completed → payment_released` | `PaymentService.tryCompletePaymentReleasedForBooking()` (payment domain) | Automatic once all charges are captured and cover the receipt total; sets `paymentReleasedAt` and writes the welper payout ledger row |
| `* → cancelled` | `cancel()` | Customer or welper (welper may not cancel `pending` — must decline; nobody may cancel `disputed`). Customer cancellation within `FREE_CANCELLATION_HOURS = 24` of the start charges a one-hour late fee via `PaymentService.onBookingCanceled({ chargeLateCancellationFee: true })` |
| `* → cancelled` (admin) | `cancelByAdmin()` | Admin cancellation from the admin console |
| `→ disputed` / `disputed →` | Dispute domain | `DisputeService.create()` sets `disputed`; resolution/withdrawal restores `completed` or `cancelled` (see [dispute.md](dispute.md)) |

## Payment hold / capture / release points

1. **Hold** — after acceptance (`prepareAuthorizationForAcceptance`): a manual-capture Stripe PaymentIntent for **one hour of service + tax** (`BOOKING_HOLD_DURATION_HOURS = 1` in `booking-pricing.ts`). If the scheduled start is more than 72 hours away the authorization is deferred (`scheduled`) and executed by the payment cron; the deadline is 24 h before the start, after which an unresolved booking is auto-cancelled without a fee. Stripe's `capture_before` must cover scheduled end plus the safety buffer.
2. **Capture** — at receipt submission: hold captured up to the receipt total; any excess is charged as a `delta_receipt` PaymentIntent.
3. **Release** — automatic (`completed → payment_released`) once every payment row is settled; feeds the payout ledger. See [payment.md](payment.md).

## Pricing & scheduling helpers

- `booking-pricing.ts` — `CUSTOMER_CHARGE_MULTIPLIER = 1.25` (customer hourly = welper rate × 1.25; welper share = 1/1.25), minimum billable duration 60 min, 15-minute receipt billing grid, hold total computation, welper/platform gross split, refund share pro-rating.
- `booking-schedule-time.ts` — converts `scheduledDate` + `scheduledStartTime` + timezone offset to UTC ms.
- `dispute-report-window.ts` — post-completion problem-report window (default 10 min, overridable via `application_settings.dispute_report_window_minutes`); anchored at `completedAt` for `completed`/`payment_released`/`no_show`.
- Conflict checking (`checkConflicts`/`countConflicts`) prevents a welper double-booking overlapping accepted/in-progress slots. Availability calendars themselves live in profile-management (`AvailabilityCalendar`, `AvailabilityException`), not here.

## API endpoints (`booking.controller.ts`)

Class guards: `JwtAuthGuard, SignupCompletedGuard`; base path `/api/bookings`.

| Method | Path | Extra guards | Purpose |
|---|---|---|---|
| GET | `/bookings` | — | List my bookings (role-aware, filters/pagination) |
| GET | `/bookings/:id` | — | Booking detail (participant only) |
| POST | `/bookings` | Roles(`customer`) + EmailVerified | Create booking request |
| POST | `/bookings/:id/payment-intent` | Roles(`customer`) + EmailVerified | Customer-driven authorization intent (SCA path) |
| PATCH | `/bookings/:id/accept` | Roles(`welper`) + EmailVerified | Accept (places hold) |
| PATCH | `/bookings/:id/decline` | Roles(`welper`) + EmailVerified | Decline |
| PATCH | `/bookings/:id/check-in` | Roles(`welper`) + EmailVerified | Start service |
| PATCH | `/bookings/:id/check-out` | Roles(`welper`) + EmailVerified | End service (auto receipt) |
| GET | `/bookings/:id/service-receipt` | — | Receipt draft/confirmed view |
| POST | `/bookings/:id/service-receipt` | Roles(`welper`) + EmailVerified | Submit receipt (capture) |
| PATCH | `/bookings/:id/cancel` | EmailVerified | Cancel (customer or welper) |

Admin booking endpoints (`/api/admin/bookings...`) live in `apps/bff/src/domains/user-management/admin/admin.controller.ts` (list, detail, admin cancel via `BookingService.findAllForAdmin` / `findByIdForAdmin` / `cancelByAdmin`).

## Scheduled jobs

None in this domain. Deferred authorization and deadline cancellation for bookings run in the payment domain's 15-minute cron (`payment-capture.scheduler.ts`).

## Cross-domain dependencies

- **payment** — hold/capture/release, late-cancellation fee, tax quotes, payment summary attached to booking responses ([payment.md](payment.md)).
- **dispute** — sets/clears `disputed`; report window helpers live here ([dispute.md](dispute.md)).
- **safety-verification** — background-check gate on accept.
- **notification** — lifecycle notifications (accepted, declined, checked-in, receipt, cancelled) via `NotificationService`.
- **profile-management / content-management** — offering + service-question validation on create.

## Key files

- `apps/bff/src/domains/booking/booking.service.ts`
- `apps/bff/src/domains/booking/booking.controller.ts`
- `apps/bff/src/domains/booking/booking-state-machine.ts`
- `apps/bff/src/domains/booking/booking-pricing.ts`
- `apps/bff/src/domains/booking/entities/booking-request.entity.ts`
- `apps/bff/src/domains/booking/entities/booking-service-receipt.entity.ts`
- `apps/bff/src/domains/booking/dispute-report-window.ts`
- `apps/bff/src/domains/booking/migrations/`
