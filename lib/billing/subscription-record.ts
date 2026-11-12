/**
 * Rules the Stripe webhook uses to record a contractor's subscription and
 * account status. Framework-free so they can be tested directly.
 * Matches supabase/proposed/20261112000100_billing_subscriptions.sql.
 */

export type SubscriptionRecordStatus = 'active' | 'past_due' | 'cancelled' | 'incomplete' | 'trialing';

/** Stripe subscription status -> the value stored in subscriptions.status. */
export function mapStripeStatus(stripeStatus: string | null | undefined): SubscriptionRecordStatus {
  switch ((stripeStatus || '').toLowerCase()) {
    case 'active':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'trialing':
      return 'trialing';
    default:
      // incomplete, incomplete_expired, paused, unknown
      return 'incomplete';
  }
}

/** Checkout metadata -> 'monthly' | 'annual' (the only values the table accepts). */
export function normalizeBillingPeriod(value: string | null | undefined): 'monthly' | 'annual' {
  const v = (value || '').trim().toLowerCase();
  return v === 'annual' || v === 'yearly' || v === 'year' ? 'annual' : 'monthly';
}

/**
 * A successful payment may move a contractor to "active" only after an
 * administrator approved them. Payment never bypasses approval, and never
 * reactivates a contractor an administrator paused, suspended or removed.
 */
export function activationAfterPayment(currentPartnerStatus: string | null | undefined): {
  activate: boolean;
  notifyAdmin: boolean;
} {
  const status = (currentPartnerStatus || '').toLowerCase();
  if (status === 'approved') return { activate: true, notifyAdmin: false };
  if (status === 'active') return { activate: false, notifyAdmin: false };
  // applied, under_review, rejected, paused, suspended, cancelled, removed, unknown
  return { activate: false, notifyAdmin: true };
}

/** The subscriptions row for one contractor (upserted on contractor_id). */
export function buildSubscriptionRow(input: {
  contractorId: string;
  tierId: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  stripeStatus: string | null | undefined;
  billingPeriod: string | null | undefined;
  periodStart?: string | null;
  periodEnd?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  now?: Date;
}) {
  const now = (input.now || new Date()).toISOString();
  return {
    contractor_id: input.contractorId,
    tier_id: input.tierId,
    stripe_subscription_id: input.stripeSubscriptionId,
    stripe_customer_id: input.stripeCustomerId,
    status: mapStripeStatus(input.stripeStatus),
    billing_period: normalizeBillingPeriod(input.billingPeriod),
    current_period_start: input.periodStart ?? now,
    current_period_end: input.periodEnd ?? null,
    cancel_at_period_end: Boolean(input.cancelAtPeriodEnd),
    updated_at: now,
  };
}
