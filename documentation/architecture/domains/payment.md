# Payment Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

`apps/bff/src/domains/payment/` — Stripe integration for the whole platform: customer card holds and captures, Stripe Tax, refunds, the welper payout ledger, and Friday payout batches executed as Stripe Connect transfers. All money amounts are integer cents, currency `cad`.

## Purpose

1. Hold the customer's card when a welper accepts a booking (manual-capture PaymentIntent for one hour of service + tax).
2. Capture the hold (plus a delta charge if needed) when the welper submits the service receipt.
3. Once all charges settle, mark the booking `payment_released` and write a `welper_payout_ledger` row.
4. Every Friday (America/Toronto), admins build, review, approve, and execute a payout batch that transfers each welper's net earnings to their Stripe Connect account.
5. Handle refunds (via dispute resolutions), Stripe Tax transactions/reversals, and transfer-reversal recovery bookkeeping.

## Entities (`entities/`)

| Entity | Table | Key fields | Status enum |
|---|---|---|---|
| `BookingPayment` (`booking-payment.entity.ts`) | `booking_payments` | `bookingId`, `customerId`, `welperId`, `stripePaymentIntentId` (unique), `amountCents`, `paymentKind`, `capturedAmountCents`, `captureEligibleAt`, `refundedAmountCents`, `stripeFeeCents`, `stripeBalanceTransactionId` | `BookingPaymentRecordStatus`: `pending`, `requires_action`, `authorized`, `captured`, `canceled`, `failed`. `BookingPaymentKind`: `hold` (primary authorization) or `delta_receipt` (extra charge above the hold) |
| `BookingRefund` (`booking-refund.entity.ts`) | `booking_refunds` | `bookingId`, `resolutionId`, `stripeRefundId` (unique), `stripeChargeId`, `stripePaymentIntentId`, `amountCents`, `taxReversalStatus`, `stripeTaxReversalId` | `status` is a plain varchar mirroring the Stripe refund status |
| `PayoutBatch` (`payout-batch.entity.ts`) | `payout_batches` | `payoutFriday` (date), totals (`totalWelperNetCents`, `totalPlatformGrossCents`, `totalStripeFeeCents`, `totalCustomerCapturedCents`), `bookingCount`, `welperCount`, `approvedBy`, `approvedAt`, `executedAt`, `executionSummary` (jsonb) | `PayoutBatchStatus`: `review`, **`approved`**, `executing`, `completed`, `partial`, `failed` (see note below) |
| `WelperPayoutLedger` (`welper-payout-ledger.entity.ts`) | `welper_payout_ledger` | One row per booking (`bookingId` unique): `welperId`, `customerId`, `paymentReleasedAt`, customer amounts, `welperGrossCents`, `welperRefundCents`, `welperNetCents`, `platformGrossCents`, `stripeFeeCents`, `exclusionReason`, `payoutBatchId`, `stripeTransferId` | `WelperPayoutLedgerStatus`: `pending`, `scheduled`, `transferred`, `excluded`, `failed` |
| `PaymentRecoveryTask` (`payment-recovery-task.entity.ts`) | `payment_recovery_tasks` | `bookingId`, `resolutionId` (unique), `stripeTransferId`, `requiredReversalCents`, `recoveredCents`, `stripeDashboardUrl`, `exceptionMessage` | varchar `status`, default `open` |
| `StripeTransferState` (`stripe-transfer-state.entity.ts`) | `stripe_transfer_states` | `stripeTransferId` (unique), `amountCents`, `amountReversedCents`, `destinationAccountId`, `payoutBatchId`, `welperId`, `lastEventAt` | — |
| `ProcessedWebhookEvent` (`processed-webhook-event.entity.ts`) | `processed_webhook_events` | `eventId` (PK), `eventType`, `processedAt` — webhook idempotency | — |
| `ApplicationSetting` (`application-setting.entity.ts`) | `application_settings` | `key` (unique), `value`, `description` — runtime settings (`payment_capture_delay_minutes`, `dispute_report_window_minutes`, `booking_tax_rate_bps`) | — |

Both status enums live in `entities/payout-ledger-status.enum.ts`.

**Note on `PayoutBatchStatus.APPROVED` (working-tree state):** `approved` exists in the enum and is treated as an *active* batch state — `PayoutBatchService.getUpcomingPreview()` and `buildDraftBatch()` include it in their `In([REVIEW, APPROVED, EXECUTING])` queries (a batch in `approved` blocks rebuilding that Friday), and the new migration `20260703000001-IncludeApprovedPayoutBatchesInActiveFridayIndex.ts` recreates the partial unique index `IDX_payout_batches_active_friday` on `payout_friday WHERE status IN ('review','approved','executing')` (previously only `review`/`executing`). However, no code path currently *writes* `approved`: `approveAndExecute()` transitions `review → executing` in one step. The status is reserved/handled for a decoupled approve-then-execute flow (the admin app's `apps/admin/lib/services/admin-payouts-service.ts` already types it).

## Services

### `PaymentService` (`payment.service.ts`)

Customer-side card lifecycle:

- **Payment methods / SetupIntents** — `ensureStripeCustomer`, `createSetupIntent`, `completeSetupIntentForUser` / `applySetupIntentSuccess` (sets `stripeDefaultPaymentMethodId`), `listPaymentMethods`, `setDefaultPaymentMethod`, `detachPaymentMethod`, `assertCustomerHasDefaultPaymentMethod` (error code `PAYMENT_METHOD_REQUIRED`).
- **Authorization hold** — `prepareAuthorizationForAcceptance(bookingId)`: called from `BookingService.accept()`. Computes due/deadline windows from the scheduled start (authorize 5 days before start; hard deadline 24 h before). If the due time is in the future the hold is `scheduled` (deferred); otherwise `authorizeHoldBeforeWelperAccept()` runs immediately: manual-capture, off-session PaymentIntent for one hour of service + tax (`BookingTaxService.quoteAuthorizationHold`). SCA cards fail with code `payment_requires_action`. Idempotency keys per attempt (`booking-<id>-authorize-v2-<n>`).
- **Deferred processing** — `processDeferredAuthorizations()` (lease-locked, `skip_locked`) authorizes due scheduled holds; `cancelExpiredAuthorizationBookings()` cancels accepted bookings whose authorization deadline passed without success.
- **Capture** — `captureForServiceReceipt()`: captures the hold up to the receipt total (partial capture allowed); if the receipt exceeds the hold, creates and confirms a separate `delta_receipt` PaymentIntent (may return a `clientSecret` for customer SCA). `onBookingServiceCompleted()` alternatively schedules `captureEligibleAt = completedAt + payment_capture_delay_minutes` (default 30).
- **Release** — `tryCompletePaymentReleasedForBooking()`: when every hold/delta row is settled and captured totals cover the receipt, transitions the booking `completed → payment_released` (via the booking state machine), sets `paymentReleasedAt`, syncs Stripe fees, ensures the Stripe Tax transaction, and upserts the payout ledger row (all in one transaction with row locks).
- **Cancellation** — `onBookingCanceled()`: cancels uncaptured PaymentIntents; optionally captures a one-hour late-cancellation fee (`chargeLateCancellationFee`) when the customer cancels within the free-cancellation window.
- **Webhooks** — `processWebhookEvent()` dedupes by `ProcessedWebhookEvent`, then dispatches: `payment_method.detached`, `setup_intent.succeeded`, `payment_intent.succeeded|amount_capturable_updated|canceled|payment_failed`, `charge.refunded`, `refund.created|updated|failed`. `syncPaymentIntentFromWebhook()` mirrors Stripe PI status into `BookingPayment` and the booking's `paymentAuthorizationStatus`, and triggers release on capture.
- Notifications throughout via `NotificationService` (payment captured/failed/refund, payment released).

### `PayoutBatchService` (`payout-batch.service.ts`) — payout batch lifecycle

Timing rules in `payout-eligibility.ts`: timezone `America/Toronto`, `PAYOUT_HOLD_DAYS = 7`. A ledger line is eligible for payout Friday *F* when `paymentReleasedAt` is ≥ 7 Toronto calendar days before *F*. Batches may only be built for the upcoming Friday or earlier (`assertBuildablePayoutFriday`); transfers may only execute on/after the batch's Friday (`isPayoutFridayReached`).

End-to-end lifecycle as implemented now:

1. **Ledger accrual** — `WelperPayoutLedgerService.upsertLedgerForReleasedBooking()` writes a `pending` ledger row when a booking reaches `payment_released`. Split (from `booking/booking-pricing.ts`): customer pays welper rate × 1.25; `welperGrossCents = subtotal / 1.25`, `platformGrossCents = subtotal − welperGross`. Rows are `excluded` with reason `stripe_fee_pending` / `stripe_tax_pending` until Stripe fee + tax transaction are synced, or `fully_refunded` when net ≤ 0.
2. **Preview** — `getUpcomingPreview()`: upcoming Friday, eligible pending lines, per-welper rollups (`PayoutWelperRollupDto` with Connect readiness), or the existing active batch (`review`/`approved`/`executing`).
3. **Build** — `buildDraftBatch(payoutFriday?)` (transactional): resets retryable `failed` lines to `pending`; if an active batch exists for that Friday it must be in `review` (its `scheduled` lines are released and the batch deleted) — a batch in `approved`/`executing` throws "already {status} and cannot be rebuilt". Eligible lines (status `pending`/`failed`, no transfer id, net > 0, 7-day hold met, booking in `payment_released`/`completed` and not `disputed`) are locked, marked `scheduled`, and attached to a new `review` batch with computed totals (`payout-batch-totals.util.ts`). The partial unique index `IDX_payout_batches_active_friday` guarantees at most one active batch per Friday.
4. **Review** — `getBatchReview(batchId, { liveConnectCheck })` returns summary + per-welper rollups; with `liveConnectCheck` it queries Stripe Connect status per welper (batched 5 at a time). `exportBatchCsv()` produces the finance CSV.
5. **Approve + execute** — `approveAndExecute(batchId, adminUserId)` (admin endpoint `POST /api/admin/payouts/batches/:id/approve`):
   - Preconditions: Stripe configured; batch status `review`; payout Friday reached (Toronto); every welper with net > 0 is Connect-ready (live check).
   - Transactionally locks the batch and its `scheduled` lines, re-validates each line (net > 0, no existing transfer, 7-day hold, booking not disputed/missing), then sets `status = executing`, `approvedBy`, `approvedAt`.
   - Groups lines per welper and calls `transferWelperLinesAtomically()`: inside a transaction it locks bookings + ledger lines in deterministic order (the dispute-creation path locks the same rows in the same order, so exactly one side crosses the payout boundary), re-checks state, then creates one `stripe.transfers.create` per welper (idempotency key from `payout-idempotency.util.ts`, `transfer_group = batchId`, metadata `batchId`/`welperId`/`payoutFriday`; E2E accounts get a fake `e2e_tr_*` id in non-production). Lines become `transferred` with the transfer id before commit. Failures mark that welper's lines `failed`.
   - Final batch status: `completed` (no failures), `partial` (mixed), `failed` (all failed); `executedAt` + `executionSummary.transfers` recorded.
6. **Webhook reconciliation** — `handleTransferWebhook` (`transfer.created`) syncs `StripeTransferState` and marks any missed lines `transferred`; `handleTransferReversed` logs and syncs reversal amounts.
7. **Retry** — rebuilding a Friday resets `failed` (transfer-less) lines to `pending`; `refreshPendingStripeFees()` re-checks `stripe_fee_pending` exclusions.

### `WelperPayoutLedgerService` (`welper-payout-ledger.service.ts`)

Ledger CRUD + dispute/refund interplay: `excludeForDispute()` (row → `excluded`/`dispute_open`, detaches from a `scheduled` batch and recalculates its totals), `restoreAfterDisputeResolved()`, `applyRefundDelta()` (pro-rates the customer refund into `welperRefundCents` via `computeWelperRefundShareCents`; a refund after transfer only logs "manual ops required"), `syncStripeFeesForBooking()`, `refreshPendingStripeFees()`, `recalculateBatchTotals()`.

### `StripeOperationsService` (`stripe-operations.service.ts`)

Stripe-led refund/transfer/tax operations bookkeeping:

- `syncRefund` / `syncChargeRefunds` / `reconcileBookingRefunds` — mirror Stripe refunds into `BookingRefund` and `BookingPayment.refundedAmountCents`, apply refund deltas to the ledger, and record Stripe Tax reversals (`recordTaxReversal`).
- `reconcileRefundWorkflow` / `finalizeRefundResolution` — drive dispute resolutions with `workflowStatus: awaiting_refund` to completion once confirmed refunds reach the target; if the welper was already paid, creates a `PaymentRecoveryTask` for the transfer reversal (`awaiting_recovery`).
- `syncTransfer` / `reconcileTransferById` — maintain `StripeTransferState` (amount reversed, destination) and recovery-task progress.
- `ensureTaxTransaction` / `retryPendingTaxTransactions` / `retryPendingTaxReversals` — create Stripe Tax transactions from receipt calculations and retry failures; `listTaxFailures`, `listOpenRecoveryTasks`, `getRefundDecisionSnapshot` (per-charge refund allocation with Stripe dashboard URLs) feed the admin UI.

### Other services

- `StripeConnectService` (`stripe-connect.service.ts`) — welper Express-account onboarding: `getStatus`, `syncAccount`, `createAccountLink`, persists `payoutMethodChoice` when onboarding completes.
- `BookingTaxService` (`booking-tax.service.ts`) — Stripe Tax quotes (`quoteAuthorizationHold`, `quoteServiceReceipt`, `quoteScheduledJobTotal`) with fallback rate from `booking_tax_rate_bps`; address resolution in `booking-tax-address.util.ts`.
- `ApplicationSettingsService` (`application-settings.service.ts`) — typed accessors over `application_settings`.

## API endpoints

All under global prefix `/api`. Controllers in this domain:

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/payments/setup-intent` | JWT + Roles(`customer`) + EmailVerified | Create SetupIntent for saving a card |
| POST | `/payments/setup-intent/complete` | JWT + Roles(`customer`) + EmailVerified | Confirm SetupIntent server-side (dev-webhook fallback) |
| GET | `/payments/payment-methods` | JWT + Roles(`customer`) | List saved cards |
| POST | `/payments/payment-methods/:id/default` | JWT + Roles(`customer`) + EmailVerified | Set default card |
| DELETE | `/payments/payment-methods/:id` | JWT + Roles(`customer`) + EmailVerified | Detach card |
| GET | `/payment/connect/status` | JWT + Roles(`welper`) | Stripe Connect status |
| POST | `/payment/connect/sync` | JWT + Roles(`welper`) | Re-sync Connect account from Stripe |
| POST | `/payment/connect/account-link` | JWT + Roles(`welper`) | Onboarding/account link |
| POST | `/webhooks/stripe` | Public (Stripe signature verified via `rawBody` + `STRIPE_WEBHOOK_SECRET`) | Routes `checkout.session.completed` (background check) → safety-verification; everything else → `PaymentService.processWebhookEvent`; `transfer.created`/`transfer.reversed`/`payout.failed` → payout handlers |

Admin payout endpoints live in `apps/bff/src/domains/user-management/admin/admin.controller.ts` (class-level `JWT + Roles(ADMIN)`, every mutation writes an `AdminAuditLog`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/payouts/upcoming` | Preview upcoming Friday batch |
| GET | `/admin/payouts/batches` | List batches (`limit`, `payoutFriday`) |
| GET | `/admin/payouts/batches/:id` | Full review payload (live Connect check) |
| POST | `/admin/payouts/batches/build` | Build/rebuild draft batch for a Friday |
| POST | `/admin/payouts/batches/:id/approve` | Approve + execute transfers (`approveAndExecute`) |
| GET | `/admin/payouts/batches/:id/export` | CSV export |
| POST | `/admin/payouts/refresh-pending-fees` | Retry `stripe_fee_pending` exclusions |
| POST | `/admin/payouts/retry-tax` | Retry Stripe Tax transactions/reversals |
| GET | `/admin/payouts/recoveries` | Open transfer-reversal recovery tasks |
| POST | `/admin/payouts/recoveries/:transferId/refresh` | Re-reconcile a transfer |
| GET | `/admin/payouts/tax-failures` | Tax transaction/reversal failures |

## Scheduled jobs

One cron in the whole BFF — `PaymentCaptureScheduler` (`payment-capture.scheduler.ts`), `@Cron('*/15 * * * *')`:

1. `processDeferredAuthorizations()` — authorize scheduled holds that are due.
2. `cancelExpiredAuthorizationBookings()` — cancel bookings past the authorization deadline.
3. `reconcileStalePaymentRows()` — re-sync stale `BookingPayment` rows against Stripe.
4. `retryPendingTaxTransactions()` — retry failed Stripe Tax transactions.

Payout batches are **not** cron-driven; they are admin-triggered.

## Migrations (`migrations/`)

| File | What it does |
|---|---|
| `20260330000001-CreateApplicationSettingsTable.ts` | `application_settings` |
| `20260330000002-AddStripeColumnsToUserAccounts.ts` | `stripe_customer_id` etc. on `user_accounts` |
| `20260330000003-CreateBookingPaymentsTable.ts` | `booking_payments` |
| `20260601000001-AddWelperPayoutLedgerAndBatches.ts` | `welper_payout_ledger` + `payout_batches` |
| `20260602000001-AddPayoutBatchActiveFridayIndex.ts` | Partial unique index `IDX_payout_batches_active_friday` on `payout_friday WHERE status IN ('review','executing')` |
| `20260609000001-FixPayoutLedgerFeeNullabilityAndBackfill.ts` | `stripe_fee_cents` nullability fix + backfill |
| `20260614000001-StripeLedPaymentOperations.ts` | `booking_refunds`, `payment_recovery_tasks`, `stripe_transfer_states`, resolution workflow columns |
| `20260703000001-IncludeApprovedPayoutBatchesInActiveFridayIndex.ts` | **New** — recreates the active-Friday unique index to also cover `'approved'` |

Related cross-domain migration: `src/database/migrations/20260413120001-AddBookingPaymentRefundColumns.ts` (refund columns on `booking_payments`).

## Cross-domain dependencies

- **booking** — `BookingService` calls `prepareAuthorizationForAcceptance`, `captureForServiceReceipt`, `onBookingCanceled`, `getBookingPaymentSummary`; payment drives the `completed → payment_released` transition. See [booking.md](booking.md).
- **dispute** — dispute creation excludes ledger rows; resolutions issue refunds through `StripeOperationsService`. See [dispute.md](dispute.md).
- **profile-management** — `WelperProfile.stripeConnectAccountId` / `payoutMethodChoice`; customer profile completion refresh on card save.
- **user-management** — Stripe customer/default-payment-method columns on `UserAccount`; admin endpoints + audit log.
- **notification** — payment/booking notification emissions.
- **safety-verification** — shares the Stripe webhook endpoint for background-check checkout sessions.

## Key files

- `apps/bff/src/domains/payment/payment.module.ts`
- `apps/bff/src/domains/payment/payment.service.ts`
- `apps/bff/src/domains/payment/payout-batch.service.ts`
- `apps/bff/src/domains/payment/welper-payout-ledger.service.ts`
- `apps/bff/src/domains/payment/stripe-operations.service.ts`
- `apps/bff/src/domains/payment/stripe-connect.service.ts`
- `apps/bff/src/domains/payment/booking-tax.service.ts`
- `apps/bff/src/domains/payment/payout-eligibility.ts`
- `apps/bff/src/domains/payment/stripe-webhook.controller.ts`
- `apps/bff/src/domains/payment/entities/payout-ledger-status.enum.ts`
- `apps/bff/src/domains/user-management/admin/admin.controller.ts` (admin payout endpoints)
