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

test('billing period is read from the subscription item (Stripe API 2025-03-31+), with a top-level fallback', async () => {
  const { subscriptionPeriod, scheduledCancellation } = await import('../lib/billing/subscription-record.ts');
  const t = 1797724800; // 2026-12-20T00:00:00Z
  assert.equal(subscriptionPeriod({ items: { data: [{ current_period_start: t - 86400 * 30, current_period_end: t }] } }).end, '2026-12-20T00:00:00.000Z');
  assert.equal(subscriptionPeriod({ current_period_end: t }).end, '2026-12-20T00:00:00.000Z');
  assert.equal(subscriptionPeriod({}).end, null);
  const item = { items: { data: [{ current_period_end: t }] } };
  assert.deepEqual(scheduledCancellation({ ...item, cancel_at_period_end: false, cancel_at: null }), { scheduled: false, endsAt: null });
  assert.deepEqual(scheduledCancellation({ ...item, cancel_at_period_end: true }), { scheduled: true, endsAt: '2026-12-20T00:00:00.000Z' });
  assert.deepEqual(scheduledCancellation({ ...item, cancel_at_period_end: false, cancel_at: t }), { scheduled: true, endsAt: '2026-12-20T00:00:00.000Z' });
});

test('paused/suspended contractors cannot open a new checkout, and the dashboard hides Upgrade for them', () => {
  const checkout = readFileSync('app/api/create-checkout-session/route.ts', 'utf8');
  assert.ok(checkout.includes("if (!['approved', 'active'].includes(status)) {"));
  const page = readFileSync('app/contractor-dashboard/page.tsx', 'utf8');
  assert.ok(page.includes("canUpgrade={profile?.partner_status === 'active' && profile?.archived !== true}"));
  assert.ok(readFileSync('app/contractor-dashboard/SubscriptionSection.tsx', 'utf8').includes("currentTier === 'Network' && canUpgrade &&"));
});

test('contractor dashboard: no legacy Preferred/Elite upgrades, no founder decal, honest add-on and hold messaging', async () => {
  const marketing = readFileSync('app/contractor-dashboard/MarketingSection.tsx', 'utf8');
  for (const legacy of ['Upgrade to Preferred', 'Upgrade to Elite', '$215/mo', '$365/mo', "'Available Now'"]) {
    assert.ok(!marketing.includes(legacy), legacy);
  }
  assert.ok(marketing.includes("title: 'Growth Membership'") && marketing.includes("title: 'Business Pro Membership'"));
  assert.ok(marketing.includes("window.location.href = '/billing'"));
  assert.ok(marketing.includes("badge: 'Temporarily unavailable'"), 'disabled add-ons drop their availability badge');

  const sub = readFileSync('app/contractor-dashboard/SubscriptionSection.tsx', 'utf8');
  assert.ok(!sub.includes('Upgrade Plan') && !sub.includes('isBasicOrPreferred'));
  assert.ok(!sub.includes('Update Payment & Reactivate'));

  const status = readFileSync('app/contractor-dashboard/StatusCard.tsx', 'utf8');
  assert.ok(!status.includes('IronClad Standards: Suspended'));
  assert.ok(!status.includes('resolve your IronClad status'));

  const { ADDON_LIST, isAddonPurchaseDisabled, getAddonById } = await import('../lib/tiers-config.ts');
  assert.ok(!ADDON_LIST.some((a) => a.id === 'decal_package_founder'));
  assert.equal(getAddonById('decal_package_founder'), null, 'refused at checkout');
  assert.ok(isAddonPurchaseDisabled('decal_package_founder'));
  const byId = Object.fromEntries(ADDON_LIST.map((a) => [a.id, a]));
  // Verified against live Stripe 2026-11-19: $99, $149, $299 (and $249 discounted video price).
  assert.equal(byId.decal_package_standard.price, 99);
  assert.equal(byId.google_business_optimization.price, 149);
  assert.equal(byId.contractor_profile_video.price, 299);
  assert.equal(byId.contractor_profile_video.elitePrice, 249);
});
