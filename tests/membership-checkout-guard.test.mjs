import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Source-level guards for the ListWorx 2.0 pricing launch: founding enrollment
// and the legacy $125/$215/$365 tiers must not be purchasable by new
// contractors, and paid membership checkout is Growth/Business Pro monthly only.

const checkout = readFileSync('app/api/create-checkout-session/route.ts', 'utf8');

test('new membership checkout is limited to growth and business_pro', () => {
  assert.ok(checkout.includes("const NEW_MEMBERSHIP_TIER_IDS = ['growth', 'business_pro'];"));
  assert.ok(checkout.includes('!NEW_MEMBERSHIP_TIER_IDS.includes(requestedTier)'));
});

test('founding-partner checkout is rejected before any Stripe price is resolved', () => {
  const guard = checkout.indexOf('if (isFounderActivation) {\n      return NextResponse.json(');
  const resolve = checkout.indexOf('getFounderRenewalPriceId(');
  assert.ok(guard > 0, 'founder activation must be rejected');
  assert.ok(guard < resolve, 'rejection must come before the founder price lookup');
});

test('paid membership checkout is monthly only (no annual price exists)', () => {
  assert.ok(checkout.includes("!== 'monthly'"));
});

test('no one-time activation fee price is used by any checkout route', () => {
  assert.ok(!checkout.includes('getFounderActivationPriceId'));
  assert.ok(!readFileSync('app/api/listing-studio/create-checkout/route.ts', 'utf8').includes('getFounderActivationPriceId'));
});

test('approved contractors on the dashboard are sent to /billing, not the founding picker', () => {
  const src = readFileSync('app/contractor-dashboard/SubscriptionSection.tsx', 'utf8');
  const firstApproved = src.indexOf('if (partnerStatus === PARTNER_STATUS.APPROVED) {');
  const firstBillingLink = src.indexOf('<a href="/billing">', firstApproved);
  const founderPicker = src.indexOf('Become a Founding Partner', firstApproved);
  assert.ok(firstBillingLink > firstApproved && firstBillingLink < founderPicker);
});

test('/billing hides annual billing while no annual Growth/Business Pro price exists', () => {
  assert.ok(readFileSync('app/billing/page.tsx', 'utf8').includes('const ANNUAL_BILLING_AVAILABLE = false;'));
});

test('Listing Studio checkout accepts the current tier prices and refuses founding/inactive prices', () => {
  const src = readFileSync('app/api/listing-studio/create-checkout/route.ts', 'utf8');
  for (const k of ['starter_agent.monthly', 'agent_pro.monthly', 'elite.monthly']) {
    assert.ok(src.includes(`STRIPE_PRICES.realtor_v2.${k}`), k);
  }
  assert.ok(src.includes("requestedPrice.metadata?.is_founder === 'true'"));
  assert.ok(src.includes('!requestedPrice.active'));
});

test('homepage no longer shows a Founding Partner badge or referral priority', () => {
  const src = readFileSync('app/page.tsx', 'utf8');
  assert.ok(!src.includes('hold first position'));
  assert.ok(!src.includes("variant: 'founder'"));
  assert.ok(!src.includes('Founding Partner'));
});

test('public Listing Studio page no longer offers founding-rate checkout', () => {
  const src = readFileSync('app/listing-studio/page.tsx', 'utf8');
  assert.ok(!src.includes("handleCheckout('founding_agent_pro'"));
  assert.ok(!src.includes("handleCheckout('founding_elite'"));
  assert.ok(!src.includes('Lock Your Rate Forever'));
  for (const t of ['starter_agent', 'agent', 'elite']) assert.ok(src.includes(`${t}: {`), t);
});

test('application form no longer offers a Founding Partner spot', () => {
  assert.ok(!readFileSync('app/contractor-dashboard/ApplicationForm.tsx', 'utf8').includes('Founding Partner spot'));
});

test('/founding-partner stays retired; /pricing is its own page with only current plans', () => {
  const cfg = readFileSync('next.config.js', 'utf8');
  assert.ok(!cfg.includes("{ source: '/pricing', destination: '/contractors'"));
  assert.ok(cfg.includes("{ source: '/founding-partner', destination: '/contractors'"));
  const pricing = readFileSync('app/pricing/page.tsx', 'utf8') + readFileSync('app/pricing/layout.tsx', 'utf8');
  assert.ok(!/founding|founder|locked for life|\$125|\$100/i.test(pricing));
  assert.ok(pricing.includes('MembershipComparison'));
  const sitemap = readFileSync('app/sitemap.xml/route.ts', 'utf8');
  assert.ok(sitemap.includes("'/pricing'") && !sitemap.includes("'/founding-partner'"));
});

test('approved/active dashboard copy does not imply payment is required or certification is granted', () => {
  const card = readFileSync('app/contractor-dashboard/StatusCard.tsx', 'utf8');
  assert.ok(!card.includes('Subscription Required'));
  assert.ok(!card.includes('Your IronClad status is active'));
  assert.ok(!readFileSync('app/contractor-dashboard/types.ts', 'utf8').includes('Subscription Required'));
});

test('archived contractors are told their membership is inactive (display only; matching rules untouched)', () => {
  const card = readFileSync('app/contractor-dashboard/StatusCard.tsx', 'utf8');
  assert.ok(card.includes("profile.archived === true"));
  assert.ok(card.includes('you will not receive referrals'));
  assert.ok(card.includes('isArchived ? ARCHIVED_STATUS : getStatusConfig('));
  const matching = readFileSync('lib/contractor-matching.ts', 'utf8');
  assert.ok(matching.includes(".eq('archived', false)"), 'matching must still exclude archived contractors');
});
