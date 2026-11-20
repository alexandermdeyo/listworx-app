// Voluntary cancellation keeps paid benefits to the paid-through date, then drops to free Network.
// Never reactivates paused/suspended, archived, rejected or not-yet-active contractors. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  afterPaidSubscriptionEnds,
  eventMatchesCurrentSubscription,
  buildNetworkDowngrade,
  hasActivePaidSubscription,
} from '../lib/billing/subscription-record.ts';

test('an active, non-archived contractor drops to Network when the paid plan ends', () => {
  assert.equal(afterPaidSubscriptionEnds({ partnerStatus: 'active', archived: false }), 'downgrade_to_network');
  assert.equal(afterPaidSubscriptionEnds({ partnerStatus: 'ACTIVE', archived: null }), 'downgrade_to_network');
});

test('suspended/paused, archived, rejected, applied or approved contractors are never reactivated', () => {
  for (const partnerStatus of ['paused', 'suspended', 'rejected', 'applied', 'approved', '', null, undefined]) {
    assert.equal(afterPaidSubscriptionEnds({ partnerStatus, archived: false }), 'record_cancelled_only', String(partnerStatus));
  }
  assert.equal(afterPaidSubscriptionEnds({ partnerStatus: 'active', archived: true }), 'record_cancelled_only');
});

test('end-of-subscription events are idempotent and ignore superseded subscriptions', () => {
  assert.equal(eventMatchesCurrentSubscription('sub_1', 'sub_1'), true);
  assert.equal(eventMatchesCurrentSubscription(null, 'sub_1'), false, 'already downgraded (repeat delivery)');
  assert.equal(eventMatchesCurrentSubscription('sub_2', 'sub_1'), false, 'contractor re-subscribed since');
  assert.equal(eventMatchesCurrentSubscription(undefined, undefined), false);
});

test('the Network downgrade keeps the membership active with no Stripe subscription', () => {
  const row = buildNetworkDowngrade({ networkTierId: 'network-id', now: new Date('2026-12-20T00:00:00Z') });
  assert.equal(row.tier_id, 'network-id');
  assert.equal(row.status, 'active');
  assert.equal(row.stripe_subscription_id, null);
  assert.equal(row.cancel_at_period_end, false);
  assert.equal(row.current_period_end, null);
  assert.ok(!('stripe_customer_id' in row), 'keeps the Stripe customer so the member can upgrade again');
});

test('a second paid checkout is refused while a paid plan is active; Network never blocks an upgrade', () => {
  assert.equal(hasActivePaidSubscription({ status: 'active', stripe_subscription_id: 'sub_1' }), true);
  assert.equal(hasActivePaidSubscription({ status: 'active', stripe_subscription_id: null }), false);
  assert.equal(hasActivePaidSubscription({ status: 'cancelled', stripe_subscription_id: 'sub_1' }), false);
  assert.equal(hasActivePaidSubscription(null), false);
});

const webhook = readFileSync('app/api/stripe-webhook/route.ts', 'utf8');

test('webhook routes a "canceled" update through the same end-of-paid path and no longer pauses on cancel', () => {
  assert.ok(webhook.includes("if (subscription.status === 'canceled') {\n    await handleSubscriptionDeleted(subscription);"));
  assert.ok(!webhook.includes("subscription.status === 'past_due' || subscription.status === 'canceled'"));
  assert.ok(!/partner_status → paused \(subscription deleted\)/.test(webhook));
  assert.ok(webhook.includes('afterPaidSubscriptionEnds('));
  assert.ok(webhook.includes('eventMatchesCurrentSubscription('));
});

test('archived contractors cannot reactivate themselves through checkout or Join Free', () => {
  const checkout = readFileSync('app/api/create-checkout-session/route.ts', 'utf8');
  const free = readFileSync('app/api/activate-free-membership/route.ts', 'utf8');
  assert.ok(checkout.includes('statusRow?.archived === true'));
  assert.ok(free.includes('profile.archived === true'));
  assert.ok(checkout.includes('hasActivePaidSubscription(currentMembership)'));
});

test('locked add-ons are refused at checkout and listed with a reason', async () => {
  const { ADDON_PURCHASE_DISABLED, isAddonPurchaseDisabled } = await import('../lib/tiers-config.ts');
  for (const id of ['ironclad_badge_kit', 'featured_spotlight', 'social_content_pack', 'flyer_builder']) {
    assert.ok(isAddonPurchaseDisabled(id), id);
  }
  for (const id of ['decal_package_standard', 'google_business_optimization', 'contractor_profile_video']) {
    assert.equal(isAddonPurchaseDisabled(id), false, id);
  }
  assert.ok(Object.values(ADDON_PURCHASE_DISABLED).every((r) => typeof r === 'string' && r.length > 10));
  assert.ok(readFileSync('app/api/create-checkout-session/route.ts', 'utf8').includes('isAddonPurchaseDisabled('));
});

test('active members can open /billing to upgrade; paused members go to their dashboard', () => {
  const mw = readFileSync('middleware.ts', 'utf8');
  assert.ok(mw.includes("contractorStatus !== 'approved' && contractorStatus !== 'active'"));
  assert.ok(!mw.includes("reason: 'active contractor should use dashboard'"));
});
