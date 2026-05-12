import Stripe from 'stripe';

let cachedStripeClient: Stripe | null = null;

export function createStripeServerClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable.');
  }

  if (!cachedStripeClient) {
    cachedStripeClient = new Stripe(secretKey, {
      apiVersion: '2026-01-28.clover',
    });
  }

  return cachedStripeClient;
}
