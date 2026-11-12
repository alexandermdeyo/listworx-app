// Launch blocker: Stripe payments are recorded correctly and never bypass admin approval. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapStripeStatus, normalizeBillingPeriod, activationAfterPayment, buildSubscriptionRow } from '../lib/billing/subscription-record.ts';

const ALLOWED = ['active', 'past_due', 'cancelled', 'incomplete', 'trialing']; // DB check constraint

test('every Stripe status maps to a value the subscriptions table accepts', () => {
  for (const s of ['active', 'past_due', 'unpaid', 'canceled', 'cancelled', 'trialing', 'incomplete', 'incomplete_expired', 'paused', '', null, undefined, 'ACTIVE']) {
    assert.ok(ALLOWED.includes(mapStripeStatus(s)), `${s} -> ${mapStripeStatus(s)}`);
  }
  assert.equal(mapStripeStatus('canceled'), 'cancelled');
  assert.equal(mapStripeStatus('unpaid'), 'past_due');
  assert.equal(mapStripeStatus('ACTIVE'), 'active');
});

test('billing period is always monthly or annual', () => {
  assert.equal(normalizeBillingPeriod('annual'), 'annual');
  assert.equal(normalizeBillingPeriod('yearly'), 'annual');
  assert.equal(normalizeBillingPeriod('monthly'), 'monthly');
  assert.equal(normalizeBillingPeriod(''), 'monthly');
  assert.equal(normalizeBillingPeriod(undefined), 'monthly');
});

test('payment activates only an administrator-approved contractor', () => {
  assert.deepEqual(activationAfterPayment('approved'), { activate: true, notifyAdmin: false });
  assert.deepEqual(activationAfterPayment('active'), { activate: false, notifyAdmin: false });
  for (const s of ['applied', 'under_review', 'rejected', 'paused', 'suspended', 'cancelled', 'removed', null, '']) {
    assert.deepEqual(activationAfterPayment(s), { activate: false, notifyAdmin: true }, `status ${s}`);
  }
});

test('subscription row has only real columns and valid values', () => {
  const row = buildSubscriptionRow({
    contractorId: 'c1', tierId: 't1', stripeSubscriptionId: 'sub_1', stripeCustomerId: 'cus_1',
    stripeStatus: 'active', billingPeriod: 'annual', now: new Date('2026-11-12T18:00:00Z'),
  });
  assert.deepEqual(Object.keys(row).sort(), [
    'billing_period', 'cancel_at_period_end', 'contractor_id', 'current_period_end', 'current_period_start',
    'status', 'stripe_customer_id', 'stripe_subscription_id', 'tier_id', 'updated_at',
  ]);
  assert.equal(row.status, 'active');
  assert.equal(row.billing_period, 'annual');
  assert.equal(row.cancel_at_period_end, false);
  assert.equal(row.current_period_start, '2026-11-12T18:00:00.000Z');
});

test('webhook source uses the shared rules (no direct approved/active shortcuts left)', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync('app/api/stripe-webhook/route.ts', 'utf8');
  assert.ok(!/partner_status:\s*PARTNER_STATUS\.ACTIVE,\s*\n\s*updated_at/.test(src), 'founder path still forces active');
  assert.ok(!src.includes("status: 'active',\n    billing_period"), 'old checkout payload still present');
  assert.equal((src.match(/activationAfterPayment\(/g) || []).length, 3, 'all three payment paths must use the approval rule');
});
