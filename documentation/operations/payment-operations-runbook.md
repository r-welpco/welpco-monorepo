# Payment Operations Runbook

> Last verified: 2026-07-27 · generated from implementation

Operator guide for the welper payout pipeline. Money movement source of truth is Stripe; this runbook tells you what the code does and what to check when it goes wrong.

Key code:

| Concern | File |
|---|---|
| Batch lifecycle, transfers | `apps/bff/src/domains/payment/payout-batch.service.ts` |
| Ledger creation/exclusions | `apps/bff/src/domains/payment/welper-payout-ledger.service.ts` |
| Refund sync, recoveries, Stripe Tax | `apps/bff/src/domains/payment/stripe-operations.service.ts` |
| Eligibility rules (Monday, 48-hour hold) | `apps/bff/src/domains/payment/payout-eligibility.ts` |
| Admin endpoints | `apps/bff/src/domains/user-management/admin/admin.controller.ts` |
| Stripe webhooks | `apps/bff/src/domains/payment/stripe-webhook.controller.ts` |
| Statuses | `apps/bff/src/domains/payment/entities/payout-ledger-status.enum.ts` |

## Payout batch lifecycle

### Batch statuses (`PayoutBatchStatus`)

| Status | Meaning | Set by |
|---|---|---|
| `review` | Draft batch built, awaiting admin review | `buildDraftBatch()` (default on create) |
| `approved` | **Reserved.** In the enum and treated as "active" by the unique payout-date index and by the existing-batch queries, but no code path currently sets it — approval and execution are a single step | — (no setter in code today) |
| `executing` | Admin approved; Stripe transfers in flight | `approveAndExecute()` before the transfer loop |
| `completed` | All per-welper transfers succeeded (or batch had zero transferable lines) | `approveAndExecute()` after the loop |
| `partial` | Some transfers succeeded, some failed | `approveAndExecute()` after the loop |
| `failed` | Every transfer failed | `approveAndExecute()` after the loop |

### Ledger line statuses (`WelperPayoutLedgerStatus`)

`pending` → `scheduled` (attached to a batch by `buildDraftBatch`) → `transferred` (Stripe transfer id persisted) — or `failed` (transfer error; auto-reset to `pending` on next build if it has no transfer id) or `excluded` (see exclusion reasons below).

### Transition triggers

1. **Booking payment released** → `WelperPayoutLedgerService.createLedgerForPaymentReleased()` upserts a `welper_payout_ledger` row (`pending`, or `excluded` with a reason).
2. **`POST /api/admin/payouts/batches/build`** → `PayoutBatchService.buildDraftBatch(payoutDate)`:
   - Resets retryable `failed` lines (no `stripe_transfer_id`) back to `pending`.
   - If a `review` batch already exists for that payout date it is deleted and rebuilt (its `scheduled` lines return to `pending` first). If the existing batch is `approved` or `executing`, the build is rejected (`400: already <status> and cannot be rebuilt`).
   - Selects eligible lines (`pending`/`failed`, no transfer id, `welper_net_cents > 0`, not `stripe_fee_pending`, booking is `payment_released`/`completed` and not `disputed`, and payment released for at least 48 elapsed hours — `PAYOUT_HOLD_HOURS = 48`).
   - Creates the batch as `review`; lines become `scheduled`.
   - Only the upcoming Monday or a past Monday may be built (`assertBuildablePayoutDate`).
3. **`POST /api/admin/payouts/batches/:id/approve`** → `PayoutBatchService.approveAndExecute(batchId, adminUserId)`:
   - Rejects unless batch is `review` and today ≥ its payout date (Toronto calendar day, `isPayoutDateReached`). Historical Friday batches remain executable after their stored date.
   - Live Stripe Connect readiness check for every welper with net > 0 (`connectReady`: Stripe payout method chosen, account exists, onboarding complete, payouts enabled). Any not-ready welper aborts the whole approval.
   - Locks batch + lines (pessimistic write), re-validates each line (net > 0, no existing transfer id, hold met, booking not disputed), then sets `executing` + `approved_by` + `approved_at`.
   - Executes **one Stripe transfer per welper** (`stripe.transfers.create`, currency `cad`, `transfer_group = batch id`, deterministic idempotency key from welper id + sorted line ids — `payout-idempotency.util.ts`). Ledger lines flip to `transferred` in the same DB transaction that holds the booking/ledger locks, so a dispute and a payout cannot both cross the boundary.
   - Final batch status: `completed` / `partial` / `failed` per the results; `execution_summary` (jsonb) stores per-welper results including error strings.
4. **Stripe webhook** (`/api/webhooks/stripe`): `transfer.created` → `handleTransferWebhook` (syncs `stripe_transfer_states`, marks any remaining `scheduled`/`failed` lines for that batch+welper as `transferred`). `transfer.reversed` → `handleTransferReversed` (syncs state, applies reversal amounts to open recovery tasks, logs a warning — no automatic re-pay).

## The active-batch unique index

Partial unique index `IDX_payout_batches_active_friday` on `payout_batches(payout_friday)`:

- `20260602000001-AddPayoutBatchActiveFridayIndex.ts` — predicate `status IN ('review', 'executing')`.
- **`20260703000001-IncludeApprovedPayoutBatchesInActiveFridayIndex.ts`** (landed in de88bd4) — predicate is now `status IN ('review', 'approved', 'executing')`.

`payout_friday` and the index name are legacy database identifiers retained to avoid a risky data migration. The application property and API field are `payoutDate`; future batches use Mondays while historical Friday dates remain intact.

Operational implication: **at most one active batch per payout date** across `review`/`approved`/`executing`. Terminal batches (`completed`, `partial`, `failed`) never block a rebuild, but `buildDraftBatch` only rebuilds `review` batches; after a `partial`/`failed` run, retryable lines flow into the next Monday batch.

## Admin operations

All under the BFF global prefix + admin controller: `/api/admin/...` (`admin.controller.ts`). Every mutating endpoint writes an `admin_audit_logs` row.

| Method & path | Service call | What it does | Use when |
|---|---|---|---|
| `GET /payouts/upcoming` | `getUpcomingPreview()` | Preview of upcoming Monday: eligible pending lines, or the existing active batch | Weekly review before building |
| `POST /payouts/batches/build` (body: optional `payoutDate` YYYY-MM-DD) | `buildDraftBatch()` | Build or rebuild the `review` batch for a Monday | Before approval; after fixing excluded/failed lines |
| `GET /payouts/batches?payoutDate=&limit=` | `listBatches()` | Batch summaries (max 100) | History / find a batch id |
| `GET /payouts/batches/:id` | `getBatchReview(id, {liveConnectCheck: true})` | Full review payload with per-welper rollups and live Connect readiness | Reviewing before approve; inspecting after execution |
| `POST /payouts/batches/:id/approve` | `approveAndExecute()` | Approve **and execute** Stripe transfers (single step) | On/after the payout date, after review checks pass |
| `GET /payouts/batches/:id/export` | `exportBatchCsv()` | CSV (`welpco-payout-<id>.csv`) for finance | Reconciliation / bookkeeping |
| `POST /payouts/refresh-pending-fees` | `refreshPendingStripeFees()` | Re-fetch Stripe balance-transaction fees for lines excluded as `stripe_fee_pending`; recovered lines become `pending` | Lines missing from preview because fees hadn't settled |
| `POST /payouts/retry-tax` | `StripeOperationsService.retryPendingTaxTransactions()` | Retry failed/missing Stripe Tax transactions and refund tax reversals; recovered bookings get their ledger row (re)created | Lines excluded as `stripe_tax_pending`, or `tax-failures` list is non-empty |
| `GET /payouts/tax-failures?limit=` | `listTaxFailures()` | Failed Stripe Tax transactions + refund reversals | Monitoring; before `retry-tax` |
| `GET /payouts/recoveries` | `listOpenRecoveryTasks()` | Open/partial `payment_recovery_tasks` (money owed back after refund-after-transfer) | Post-dispute monitoring |
| `POST /payouts/recoveries/:transferId/refresh` | `reconcileTransferById()` | Re-pull the transfer from Stripe and apply reversal amounts to recovery tasks | After doing a transfer reversal in Stripe Dashboard |

Audit actions to search in `admin_audit_logs`: `admin.payout_batch.build`, `admin.payout_batch.approve`, `admin.payout_fees.refresh`, `admin.payout_tax.retry`, `admin.payout_recovery.refresh`.

The admin UI for all of this is `apps/admin/app/(dashboard)/payouts/` backed by `apps/admin/lib/services/admin-payouts-service.ts`.

## Scheduled jobs

There is **no cron for payout batches** — building and approving batches is always a manual admin action. The only payment-domain cron is:

- `PaymentCaptureScheduler.runPaymentOperations()` — `@Cron('*/15 * * * *')` in `apps/bff/src/domains/payment/payment-capture.scheduler.ts`. Every 15 minutes it runs `processDeferredAuthorizations()`, `cancelExpiredAuthorizationBookings()`, `reconcileStalePaymentRows()`, and `retryPendingTaxTransactions()` (so `stripe_tax_pending` exclusions usually self-heal without the manual retry endpoint).

## Ledger exclusion reasons

| `exclusion_reason` | Cause | Recovery path |
|---|---|---|
| `stripe_fee_pending` | Stripe balance transaction/fee not yet available at ledger creation | `POST /payouts/refresh-pending-fees`, then rebuild |
| `stripe_tax_pending` | Stripe Tax transaction not yet `succeeded` for the receipt | 15-min cron retry, or `POST /payouts/retry-tax`, then rebuild |
| `fully_refunded` | Refunds consumed the welper net (`welper_net_cents <= 0`) | None — nothing to pay |
| `dispute_open` | Booking disputed while line was pending/scheduled (`excludeForDispute`) | Auto-restored to `pending` when dispute resolves without full refund (`restoreAfterDisputeResolved`) |

## Failure handling

- **Per-welper failure isolation.** One welper's transfer failure marks only that welper's lines `failed`; other welpers still get paid (batch ends `partial`).
- **Retry path.** `failed` lines with `stripe_transfer_id IS NULL` are automatically reset to `pending` by the next `buildDraftBatch` and picked up by the next Monday batch. **Never** retry a line that already has a transfer id — the code refuses to (`Ledger line ... already has a Stripe transfer`), and so should you.
- **Idempotency.** Transfers use a deterministic idempotency key (welper + line ids), so an accidental double-execute of the same line set cannot double-pay at Stripe.
- **Refund after transfer.** `applyRefundDelta` logs `manual ops required` and does nothing to a `transferred` line. The dispute/refund flow (`stripe-operations.service.ts` → `reconcileRefundWorkflow`) instead creates a `payment_recovery_tasks` row with the required reversal amount and a Stripe dashboard URL; reversals done in Stripe flow back via `transfer.reversed` → `syncTransfer`, which marks the task `partial`/`completed` and finalizes the dispute resolution.
- **Ledger/batch consistency.** Batch totals are denormalized; `recalculateBatchTotals` reruns after dispute exclusions and refund deltas. `getBatchReview` recomputes totals from lines, so review payloads never trust stale batch rows.

## Stripe touchpoints

| Touchpoint | Where | Notes |
|---|---|---|
| `stripe.transfers.create` | `payout-batch.service.ts` (`transferWelperLinesAtomically`) | CAD, `transfer_group` = batch id, metadata `batchId`/`welperId`/`payoutDate`; E2E accounts (prefix `E2E_STRIPE_CONNECT_ACCOUNT_PREFIX`) short-circuit to fake ids outside production |
| Fee sync (balance transactions) | `stripe-fee.util.ts` via `welper-payout-ledger.service.ts` | Fills `booking_payments.stripe_fee_cents`; missing fee ⇒ `stripe_fee_pending` |
| Stripe Tax transactions + reversals | `stripe-operations.service.ts` (`ensureTaxTransaction`, `recordTaxReversal`) | Idempotency keys `tax-transaction-booking-<id>` / `tax-reversal-<refundId>` |
| Refund sync | `stripe-operations.service.ts` (`syncRefund`, `syncChargeRefunds`) | Updates `booking_refunds`, `booking_payments.refunded_amount_cents`, applies welper refund share to the ledger |
| Transfer state mirror | `stripe-transfer_states` table via `syncTransfer` | Tracks `amount_reversed_cents`; drives recovery tasks |
| Webhooks | `stripe-webhook.controller.ts` (`/api/webhooks/stripe`) | Needs `transfer.created`, `transfer.reversed`, `charge.refunded`, `payment_intent.*`, etc.; idempotent via `processed_webhook_events` |
| Config | `STRIPE_SECRET_KEY` (all services no-op/reject without it), `STRIPE_WEBHOOK_SECRET` | `sk_live_` prefix flips dashboard URLs from test to live mode |

## Troubleshooting a stuck batch

Tables: `payout_batches`, `welper_payout_ledger`, `stripe_transfer_states`, `payment_recovery_tasks`, `booking_payments`, `booking_refunds`, `admin_audit_logs`.

| Symptom | What to check |
|---|---|
| Batch stuck in `review`, approve returns 400 | Has its payout date been reached in Toronto? Connect-not-ready welpers? `GET /payouts/batches/:id` shows `connectReady` per welper — have the welper finish Stripe onboarding, or rebuild after resolving blockers. |
| Batch stuck in `executing` | The process died mid-loop (approve is synchronous; `executing` is normally seconds). Check `execution_summary` (null = crash before finish). Then: `SELECT status, stripe_transfer_id FROM welper_payout_ledger WHERE payout_batch_id = '<id>';` — cross-check each transfer id in Stripe Dashboard (search `transfer_group = <batch id>`). Lines `transferred` are done; `scheduled` lines with no transfer id were never sent and are safe to move forward manually only after confirming no transfer exists in Stripe for that welper/batch. There is no automatic recovery from a crashed `executing` batch — escalate to engineering. |
| Batch `partial` / `failed` | Read `execution_summary.transfers[]` error strings. Failed lines (`status='failed'`, no transfer id) auto-return to the next build. `missing_connect_account` ⇒ welper lost their Connect account between review and execute. Do **not** rebuild the same payout date — a terminal batch can't be rebuilt into; the lines flow to the next Monday. |
| Expected booking missing from preview | `SELECT status, exclusion_reason FROM welper_payout_ledger WHERE booking_id = '...';` — `stripe_fee_pending` → refresh fees; `stripe_tax_pending` → retry tax; `dispute_open` → resolve dispute; `fully_refunded` → nothing owed; no row at all → booking never reached `payment_released` or has no service receipt (see `createLedgerForPaymentReleased` warning log). Also verify that at least 48 elapsed hours have passed since `payment_released_at`. |
| Transfer exists in Stripe but line not `transferred` | Webhook gap. `POST /payouts/recoveries/:transferId/refresh` syncs the transfer state; `transfer.created` webhook marks lines. Check `processed_webhook_events` and Stripe webhook delivery logs. |
| Transfer reversed | Check `GET /payouts/recoveries`; reversals apply to open recovery tasks automatically via webhook. A reversal without a recovery task is a manual finance decision — never re-run the batch. |
| Duplicate active batch error on build | The legacy-named unique index (`IDX_payout_batches_active_friday`) fired: a `review`/`approved`/`executing` batch already exists for that payout date. `SELECT id, status FROM payout_batches WHERE payout_friday = '...';` |

### Escalate immediately

- Stripe shows a transfer that no `welper_payout_ledger` row references.
- A batch stayed `executing` and its `execution_summary` is null.
- A disputed booking appears inside an approved batch.
- Refunds recorded in Welpco don't match Stripe charge refunds for the same booking.
