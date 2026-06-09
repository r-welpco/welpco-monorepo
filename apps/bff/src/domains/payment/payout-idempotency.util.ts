import { createHash } from 'crypto';

/** Stable Stripe idempotency key from welper + ledger line ids (survives batch rebuild). */
export function buildTransferIdempotencyKey(
  welperId: string,
  ledgerLineIds: readonly string[],
): string {
  const sorted = [...ledgerLineIds].sort();
  const hash = createHash('sha256').update(sorted.join(',')).digest('hex').slice(0, 32);
  return `payout-welper-${welperId}-${hash}`;
}
