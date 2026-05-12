/**
 * Welper's payout-step choice during signup. Day 15 follow-up — Phase 1's
 * `submitWelperPayoutStep` was a no-op which left the welper-payout step
 * permanently incomplete (`getState` returned `nextStep: 'welperPayout'`
 * forever, so the wizard re-routed to the same step on every advance).
 *
 * Persisting an explicit choice lets `getState` mark the step complete
 * honestly. NULL means "step not yet visited."
 *
 * STRIPE = welper clicked "Set up payouts" and we trust the click as the
 *          signal until the real Stripe Connect round-trip lands
 *          (`WELPER-PAYOUTS-001`).
 * SKIPPED = welper explicitly deferred via the warning callout. Banner on
 *           dashboard surfaces the consequence ("can't receive payments
 *           yet"). Welper can finish payout setup any time from settings.
 */
export enum PayoutMethodChoice {
  STRIPE = 'stripe',
  SKIPPED = 'skipped',
}
