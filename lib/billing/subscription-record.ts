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

/**
 * Same business rule as activationAfterPayment() above, reused verbatim for
 * Free Network activation (no Stripe involved): only an approved applicant
 * may activate, activation never bypasses admin approval, and a contractor
 * an admin paused/suspended/removed is never silently reactivated by this
 * path either. Returns a third outcome -- 'already_active' -- so the caller
 * can treat a repeat click as a harmless no-op rather than an error.
 */
export function canActivateFree(currentPartnerStatus: string | null | undefined): {
  outcome: 'activate' | 'already_active' | 'blocked';
} {
  const status = (currentPartnerStatus || '').toLowerCase();
  if (status === 'active') return { outcome: 'already_active' };
  const { activate } = activationAfterPayment(currentPartnerStatus);
  return { outcome: activate ? 'activate' : 'blocked' };
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

/** Name of the free tiers row every downgraded or free member is attached to. */
export const NETWORK_TIER_NAME = 'Network';

/**
 * What happens when a paid Growth/Business Pro subscription actually ends
 * (Stripe customer.subscription.deleted, or an update reporting status
 * "canceled"). A voluntary cancel keeps paid benefits until the paid-through
 * date -- Stripe only sends this once that date has passed.
 *
 * - An active, non-archived contractor drops to free Network and stays active
 *   (approval and referral eligibility unchanged).
 * - Anyone else (paused/suspended, archived, rejected, not yet active) only has
 *   the paid subscription recorded as cancelled. They are never reactivated
 *   here, and their status is left exactly as an admin or billing set it.
 */
export function afterPaidSubscriptionEnds(input: {
  partnerStatus: string | null | undefined;
  archived: boolean | null | undefined;
}): 'downgrade_to_network' | 'record_cancelled_only' {
  const status = (input.partnerStatus || '').toLowerCase();
  if (status === 'active' && input.archived !== true) return 'downgrade_to_network';
  return 'record_cancelled_only';
}

/**
 * Idempotency/ordering guard: a Stripe event may change the contractor's
 * membership row only if that row is still attached to the same Stripe
 * subscription. A repeat delivery after the downgrade (row now has no Stripe
 * subscription), or a late event for an older subscription after the
 * contractor re-subscribed, is ignored.
 */
export function eventMatchesCurrentSubscription(
  rowStripeSubscriptionId: string | null | undefined,
  eventSubscriptionId: string | null | undefined,
): boolean {
  return Boolean(rowStripeSubscriptionId) && rowStripeSubscriptionId === eventSubscriptionId;
}

/** Row update that moves a membership from a paid tier back to free Network. */
export function buildNetworkDowngrade(input: { networkTierId: string; now?: Date }) {
  const now = (input.now || new Date()).toISOString();
  return {
    tier_id: input.networkTierId,
    status: 'active' as const,
    stripe_subscription_id: null,
    billing_period: 'monthly' as const,
    current_period_start: now,
    current_period_end: null,
    cancel_at_period_end: false,
    cancelled_at: now,
    updated_at: now,
  };
}

/**
 * A new paid-membership checkout is refused while the contractor already has
 * an active paid subscription, so nobody is billed for two plans at once.
 * Free Network rows (no Stripe subscription) never block an upgrade.
 */
export function hasActivePaidSubscription(row: {
  status?: string | null;
  stripe_subscription_id?: string | null;
} | null | undefined): boolean {
  return Boolean(row && row.stripe_subscription_id && (row.status || '').toLowerCase() === 'active');
}
