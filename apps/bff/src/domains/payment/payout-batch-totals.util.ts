import { WelperPayoutLedger } from './entities/welper-payout-ledger.entity';
import { PayoutBatch } from './entities/payout-batch.entity';

export type PayoutBatchTotals = {
  bookingCount: number;
  welperCount: number;
  totalWelperNetCents: number;
  totalPlatformGrossCents: number;
  totalStripeFeeCents: number;
  totalCustomerCapturedCents: number;
};

export function computeTotalsFromLines(lines: readonly WelperPayoutLedger[]): PayoutBatchTotals {
  return {
    bookingCount: lines.length,
    welperCount: new Set(lines.map((l) => l.welperId)).size,
    totalWelperNetCents: lines.reduce((s, l) => s + l.welperNetCents, 0),
    totalPlatformGrossCents: lines.reduce((s, l) => s + l.platformGrossCents, 0),
    totalStripeFeeCents: lines.reduce((s, l) => s + (l.stripeFeeCents ?? 0), 0),
    totalCustomerCapturedCents: lines.reduce((s, l) => s + l.customerTotalCents, 0),
  };
}

export function applyTotalsToBatch(batch: PayoutBatch, totals: PayoutBatchTotals): void {
  batch.bookingCount = totals.bookingCount;
  batch.welperCount = totals.welperCount;
  batch.totalWelperNetCents = totals.totalWelperNetCents;
  batch.totalPlatformGrossCents = totals.totalPlatformGrossCents;
  batch.totalStripeFeeCents = totals.totalStripeFeeCents;
  batch.totalCustomerCapturedCents = totals.totalCustomerCapturedCents;
}
