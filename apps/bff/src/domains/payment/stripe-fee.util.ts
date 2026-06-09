import Stripe from 'stripe';

export type StripeFeeSyncResult = {
  feeCents: number;
  balanceTransactionId: string | null;
  synced: boolean;
};

/** Pull Stripe processing fee from a captured PaymentIntent charge. */
export async function syncStripeFeeForPaymentIntent(
  stripe: Stripe,
  paymentIntentId: string,
): Promise<StripeFeeSyncResult> {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge.balance_transaction'],
  });
  const charge = pi.latest_charge;
  if (!charge || typeof charge === 'string') {
    return { feeCents: 0, balanceTransactionId: null, synced: false };
  }
  const bt = charge.balance_transaction;
  if (!bt || typeof bt === 'string') {
    return { feeCents: 0, balanceTransactionId: null, synced: false };
  }
  return {
    feeCents: bt.fee ?? 0,
    balanceTransactionId: bt.id ?? null,
    synced: true,
  };
}

export function isStripeFeeSynced(
  stripeFeeCents: number | null | undefined,
  balanceTransactionId: string | null | undefined,
): boolean {
  return stripeFeeCents != null && !!balanceTransactionId;
}
