/** Pure helpers for media order refunds and visits. Self-contained for unit tests. */

type StripeRefundLike = { id: string; amount: number; status: string | null };

/** Stripe's refunds for a payment → what the database should record. Failed/canceled refunds don't count. */
export function reconcileRefunds(totalCents: number, refunds: StripeRefundLike[]) {
  const counted = refunds.filter((r) => ['succeeded', 'pending', 'requires_action'].includes(String(r.status)));
  const refundedCents = Math.min(totalCents, counted.reduce((s, r) => s + r.amount, 0));
  return {
    refundedCents,
    refundIds: counted.map((r) => r.id),
    paymentStatus: refundedCents <= 0 ? 'paid' : refundedCents >= totalCents ? 'refunded' : 'partially_refunded',
  } as const;
}

/** Number of distinct visits that have a live appointment. */
export function liveVisitCount(appts: Array<{ visit_number: number }>) {
  return new Set(appts.map((a) => a.visit_number)).size;
}
