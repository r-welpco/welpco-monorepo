# Dispute Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

`apps/bff/src/domains/dispute/` — problem reports ("disputes") filed on bookings by either participant, admin resolutions (optionally with Stripe refunds), and general support tickets.

## Purpose

A customer or welper can file a dispute on a booking within a short post-completion window (or while in progress via the state machine). Filing freezes the booking (`disputed`) and pulls the welper's payout line out of any payout batch. Admins resolve with an outcome (complete/cancel the booking) and optionally a full/partial refund driven through Stripe.

## Entities (`entities/`)

| Entity | Table | Key fields | Status enums |
|---|---|---|---|
| `Dispute` (`dispute.entity.ts`) | `disputes` | `bookingId`, `filerId`, `filerType`, `category`, `subject`, `description`, `evidence` (jsonb: `{type: 'file'\|'message', key?, id?}`) | `DisputeStatus` (varchar, `dispute-status.enum.ts`): `open`, `in_review`, `resolved`, `closed`, `escalated`, `awaiting_refund`, `awaiting_recovery`, `withdrawn`. `DisputeCategory`: `no_show`, `quality`, `overcharge`, `safety`, `other`. `FilerType`: `customer`, `welper` |
| `Resolution` (`resolution.entity.ts`) | `resolutions` | One per dispute (`disputeId` unique): `resolutionType`, `notes`, `refundAmount`, `resolvedById`, `resolvedAt`, refund workflow fields (`refundStatus`, `refundBaselineCents`, `refundTargetCents`, `refundConfirmedCents`, `pendingBookingOutcome`, `refundException`, `recommendedRefundAllocation` jsonb, `stripeLastSyncedAt`) | `workflowStatus` (varchar, default `completed`): also `awaiting_refund`, `awaiting_recovery` |
| `SupportTicket` (`support-ticket.entity.ts`) | `support_tickets` | User-filed general tickets; admin assignment columns (migration `20260403120001`) | varchar status |

## Services

### `DisputeService` (`dispute.service.ts`)

- `create()` — transactional: locks the booking, verifies participant + `validateTransition(status, DISPUTED)` + report window open (`isDisputeReportWindowOpen`, default 24 hours after completion, setting `dispute_report_window_minutes`), rejects a second open dispute, validates evidence ownership (files by S3 key prefix, messages must belong to the booking's chat thread), saves the dispute `open`, sets the booking `disputed`, and calls `WelperPayoutLedgerService.excludeForDispute()` (ledger line → `excluded`/`dispute_open`, detached from any scheduled payout batch, batch totals recalculated). Notifies the counterparty.
- `findByBooking()` / `findMine()` / `findById()` — participant- or admin-scoped reads; evidence S3 keys are presigned on the way out.
- `presignEvidenceUpload()` — S3 presigned upload URLs for evidence files.
- `createResolution()` (admin) — locks dispute + booking; dispute must be in a resolvable status; only one resolution per dispute. For `resolutionType` `refund`/`partial_refund` it builds a `RefundDecisionSnapshot` (`StripeOperationsService`) and sets `workflowStatus: 'awaiting_refund'`, dispute status `awaiting_refund`, `pendingBookingOutcome` (`completed`/`cancelled`) — the booking outcome is applied later when refunds are confirmed via webhooks/`finalizeRefundResolution` (which may escalate to `awaiting_recovery` + `PaymentRecoveryTask` when a paid-out transfer must be reversed). Non-refund resolutions apply immediately: booking → `completed` (payout ledger restored via `restoreAfterDisputeResolved`) or → `cancelled`, dispute → `resolved`.
- `withdraw()` — filer withdraws before resolution: dispute → `withdrawn`; a `disputed` booking is restored to `completed` and the payout ledger line restored.
- `reconcileResolutionRefund()` (admin) — re-syncs a refund-type resolution against Stripe.

### `SupportTicketService` (`support-ticket.service.ts`)

`create`, `findMine`, plus admin operations `findAllForAdmin`, `findByIdForAdmin`, `updateForAdmin` (used by the admin controller under `/api/admin/support-tickets...`).

## API endpoints

Class guards `JwtAuthGuard, SignupCompletedGuard` (`dispute.controller.ts`), `JwtAuthGuard` (`support-ticket.controller.ts`); base prefix `/api`.

| Method | Path | Extra guards | Purpose |
|---|---|---|---|
| POST | `/disputes/evidence/presign` | — | Presign evidence upload |
| POST | `/bookings/:bookingId/disputes` | — | File a dispute |
| GET | `/bookings/:bookingId/dispute` | — | Latest dispute for a booking |
| GET | `/disputes` | — | My disputes (paginated) |
| GET | `/disputes/:id` | — | Dispute detail |
| DELETE | `/disputes/:id` | — | Withdraw own dispute |
| POST | `/disputes/:id/resolution` | Roles(`ADMIN`) | Create resolution (optional refund) |
| POST | `/disputes/:id/resolution/refund/reconcile` | Roles(`ADMIN`) | Reconcile refund workflow with Stripe |
| POST | `/support-tickets` | — | Create support ticket |
| GET | `/support-tickets` | — | My support tickets |

## Scheduled jobs

None. Refund workflow progress is driven by Stripe webhooks (`refund.*`, `charge.refunded`) and the admin reconcile endpoints.

## Cross-domain dependencies

- **booking** — state transitions `→ disputed → completed/cancelled`; report-window helpers in `booking/dispute-report-window.ts` ([booking.md](booking.md)).
- **payment** — `WelperPayoutLedgerService` (exclude/restore payout lines), `StripeOperationsService` (refund snapshots, refund workflow, recovery tasks) ([payment.md](payment.md)).
- **communication** — message-evidence validation against the booking's chat thread.
- **notification** — dispute filed/resolved notifications to participants.
- **user-management (admin)** — support-ticket admin endpoints in `admin.controller.ts`; admin audit logging.

## Key files

- `apps/bff/src/domains/dispute/dispute.service.ts`
- `apps/bff/src/domains/dispute/dispute.controller.ts`
- `apps/bff/src/domains/dispute/support-ticket.service.ts`
- `apps/bff/src/domains/dispute/entities/dispute-status.enum.ts`
- `apps/bff/src/domains/dispute/entities/resolution.entity.ts`
- `apps/bff/src/domains/dispute/migrations/`
