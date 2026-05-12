import Stripe from 'stripe';

/** Pinned to the Stripe Node SDK’s typed version; bump SDK + this when upgrading the API. */
export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2025-02-24.acacia';

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
}
