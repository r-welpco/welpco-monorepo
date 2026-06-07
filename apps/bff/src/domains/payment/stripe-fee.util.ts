import Stripe from 'stripe';

/** Pull Stripe processing fee from a captured PaymentIntent charge. */
export async function syncStripeFeeForPaymentIntent(
  stripe: Stripe,
  paymentIntentId: string,
): Promise<{ feeCents: number; balanceTransactionId: string | null }> {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge.balance_transaction'],
  });
  const charge = pi.latest_charge;
  if (!charge || typeof charge === 'string') {
    return { feeCents: 0, balanceTransactionId: null };
  }
  const bt = charge.balance_transaction;
  if (!bt || typeof bt === 'string') {
    return { feeCents: 0, balanceTransactionId: null };
  }
  return {
    feeCents: bt.fee ?? 0,
    balanceTransactionId: bt.id ?? null,
  };
}
