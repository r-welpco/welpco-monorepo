# Payment Operations Runbook

This runbook covers exceptional payment cases for the first Welpco launch.
Normal card authorization, capture, refunds, and payouts remain automated.
Uncertain money movement requires an admin to verify Stripe before retrying.

## General Rules

1. Never retry a payout line that already has a Stripe transfer ID.
2. Never issue a second manual refund until the PaymentIntent and charge refunds
   have been checked in Stripe Dashboard.
3. Record the Stripe object ID and the action taken in the support case.
4. If Stripe and Welpco disagree, treat Stripe as the money-movement source of
   truth and leave the case open until the database is corrected.

## Failed Refund

The dispute page shows the saved refund result and the last attempt time.

1. Open the booking's PaymentIntents in Stripe Dashboard.
2. Check each charge's refunded amount.
3. If no unexpected refund exists, use **Retry refund** once.
4. Reload the dispute and confirm the refund status is `succeeded`.
5. If it remains `failed`, process or investigate it in Stripe Dashboard and
   record the Stripe refund ID in the case notes.

The retry uses the existing resolution ID as its Stripe idempotency key, so the
same application refund operation is not duplicated.

## Partial Refund

`partial` means one or more refund calls succeeded before another failed.

1. Do not create a new resolution.
2. Check all charges under the booking's PaymentIntents in Stripe Dashboard.
3. Confirm the total already refunded.
4. Use **Retry refund** only when the remaining amount is still refundable.
5. Confirm the final total refunded matches the resolution amount.

If the amounts do not reconcile, stop application retries and complete the case
manually in Stripe Dashboard.

## Pending Stripe Fees

Payout lines with `stripe_fee_pending` are excluded from payout batches.

1. Open **Admin > Payouts**.
2. Use **Refresh pending Stripe fees**.
3. Review the reported recovered and still-pending counts.
4. Rebuild the review batch after fees are recovered.

If a line remains pending, verify that its PaymentIntent has a successful charge
and balance transaction in Stripe. Do not pay it outside the normal batch until
the captured amount and processing fee are confirmed.

## Uncertain Or Interrupted Payout Batch

For batches marked `executing`, `partial`, or `failed`:

1. Open the batch and note every displayed Stripe transfer ID.
2. Search those transfer IDs in Stripe Dashboard.
3. Confirm destination account, amount, currency, and transfer status.
4. Do not rebuild or resubmit lines that already have a transfer ID.
5. Lines without a transfer ID may return through the normal failed-line flow
   and be included in a future review batch.

There is intentionally no automatic retry for uncertain transfers at launch.

## Reversed Transfer

A reversed transfer requires manual finance review.

1. Open the transfer in Stripe Dashboard and confirm the reversed amount.
2. Do not retry the original batch.
3. Determine whether the welper should be paid again after resolving the cause.
4. Record the decision, original transfer ID, reversal ID, and any replacement
   transfer ID in the support case and admin audit notes.

## Useful Admin Audit Actions

- `dispute.resolution`
- `dispute.refund_retry`
- `admin.payout_batch.build`
- `admin.payout_batch.approve`
- `admin.payout_fees.refresh`

## Escalate Immediately

Escalate to finance/engineering when:

- Stripe shows a transfer but Welpco has no transfer ID.
- Welpco reports a successful refund but Stripe does not.
- A refund exceeds the recorded resolution amount.
- A customer was charged less than the service receipt but a payout was created.
- A disputed booking appears in a payout batch.
