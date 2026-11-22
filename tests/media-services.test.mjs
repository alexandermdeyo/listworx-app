// ListWorx Media Services + membership benefits. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildMediaQuote, MediaQuoteError, mediaDiscountPercent, canTransition, visitMinutes } from '../lib/media/catalog.ts';
import { availableSlots, isPublishedSlot, slotFor, slotsOverlap, zonedToUtc, openWindows } from '../lib/media/schedule.ts';
import { currentMembership, hasFlyerBuilder, hasPaidResources, socialPostAllowance, COMPARISON_ROWS, periodMonth } from '../lib/membership/benefits.ts';

// ── Pricing and discounts ───────────────────────────────────────────────────
test('retail pricing for guests and Network; 5% Growth; 10% Business Pro; never stacked', () => {
  assert.equal(buildMediaQuote('contractor_essentials', [], null).totalCents, 59900);
  assert.equal(buildMediaQuote('contractor_essentials', [], 'network').totalCents, 59900);
  const g = buildMediaQuote('contractor_growth_media', ['drone_photo'], 'growth');
  assert.equal(g.retailCents, 149900 + 17500);
  assert.equal(g.discountPercent, 5);
  assert.equal(g.totalCents, g.retailCents - g.discountCents);
  assert.equal(g.discountCents, Math.round(149900 * 0.05) + Math.round(17500 * 0.05));
  const bp = buildMediaQuote('contractor_authority_media', [], 'business_pro');
  assert.equal(bp.totalCents, 299900 - 29990);
  assert.equal(mediaDiscountPercent('business_pro'), 10);
  assert.equal(mediaDiscountPercent(/** @type any */ ('elite')), 0, 'legacy/unknown tiers get no discount');
});

test('add-ons need a qualifying service; unknown and duplicate codes are rejected', () => {
  assert.throws(() => buildMediaQuote('drone_photo', [], null), MediaQuoteError, 'add-on cannot be bought alone');
  assert.throws(() => buildMediaQuote('extra_hour', [], 'business_pro'), MediaQuoteError);
  assert.throws(() => buildMediaQuote('contractor_essentials', ['drone_photo', 'drone_photo'], null), MediaQuoteError);
  assert.throws(() => buildMediaQuote('contractor_essentials', ['matterport'], null), MediaQuoteError);
  assert.throws(() => buildMediaQuote('matterport', [], null), MediaQuoteError, 'Matterport is not sold');
  assert.equal(buildMediaQuote('team_headshots', ['extra_15_photos'], null).totalCents, 29900 + 17500);
});

test('approved catalog prices', () => {
  const p = (c) => buildMediaQuote(c, [], null).totalCents;
  assert.deepEqual(
    [p('contractor_essentials'), p('contractor_growth_media'), p('contractor_authority_media'), p('jobsite_progress'), p('before_after'), p('profile_video'), p('team_headshots')],
    [59900, 149900, 299900, 39900, 74900, 49900, 29900],
  );
  assert.equal(buildMediaQuote('before_after', [], null).visits, 2);
});

test('checkout never reads a browser price or discount', () => {
  const src = readFileSync('app/api/media/checkout/route.ts', 'utf8');
  assert.ok(src.includes('buildMediaQuote(body.service, body.addons, membership?.tier || null)'));
  assert.ok(!/body\.(price|total|discount|amount)/i.test(src));
  assert.ok(src.includes('getVerifiedMembership(user.id)'));
});

// ── Membership access ───────────────────────────────────────────────────────
test('only current paid memberships unlock paid benefits', () => {
  const now = new Date('2026-11-22T12:00:00Z');
  const future = '2026-12-22T00:00:00Z';
  assert.equal(currentMembership([{ status: 'active', stripe_subscription_id: 'sub_1', current_period_end: future, tier_name: 'Business Pro' }], now), 'business_pro');
  assert.equal(currentMembership([{ status: 'active', stripe_subscription_id: 'sub_1', current_period_end: '2026-11-01T00:00:00Z', tier_name: 'Growth' }], now), null, 'expired');
  assert.equal(currentMembership([{ status: 'cancelled', stripe_subscription_id: 'sub_1', current_period_end: future, tier_name: 'Growth' }], now), null);
  assert.equal(currentMembership([{ status: 'past_due', stripe_subscription_id: 'sub_1', current_period_end: future, tier_name: 'Growth' }], now), null);
  assert.equal(currentMembership([{ status: 'active', stripe_subscription_id: null, current_period_end: future, tier_name: 'Growth' }], now), null, 'paid tier needs a Stripe subscription');
  assert.equal(currentMembership([{ status: 'active', stripe_subscription_id: 'sub', tier_name: 'Network Elite — Founding' }], now), null, 'legacy tiers grant nothing new');
  assert.equal(currentMembership([{ status: 'active', tier_name: 'Network' }], now), 'network');
  assert.equal(hasFlyerBuilder('growth'), false);
  assert.equal(hasFlyerBuilder('business_pro'), true);
  assert.equal(hasPaidResources('network'), false);
  assert.equal(hasPaidResources('growth'), true);
  assert.deepEqual([socialPostAllowance('network'), socialPostAllowance('growth'), socialPostAllowance('business_pro')], [0, 0, 2]);
  assert.equal(periodMonth(new Date('2026-12-01T03:00:00Z')), '2026-11-01', 'calendar month in Central time');
});

test('comparison table matches the approved benefits', () => {
  const row = (l) => COMPARISON_ROWS.find((r) => r.label.startsWith(l)).values;
  assert.deepEqual(row('Custom branded social posts'), ['No', 'No', '2 per month']);
  assert.deepEqual(row('ListWorx Media Services'), ['Retail pricing', '5% discount', '10% discount']);
  assert.deepEqual(row('Full Flyer Builder'), ['No', 'No', 'Yes']);
  assert.ok(row('Business Growth Consultations').every((v) => v.startsWith('Not available')));
});

// ── Scheduling ──────────────────────────────────────────────────────────────
const settings = { timezone: 'America/Chicago', slot_interval_minutes: 30, buffer_minutes: 30, min_notice_hours: 24, booking_window_days: 60 };
const rules = [{ weekday: 1, start_time: '09:00', end_time: '13:00' }]; // Mondays
const NOW = new Date('2026-11-20T12:00:00Z');

test('slots fit inside published hours, in Central time', () => {
  const slots = availableSlots({ date: '2026-11-23', durationMinutes: 90, settings, rules, exceptions: [], busy: [], now: NOW });
  assert.equal(slots[0].starts_at, '2026-11-23T15:00:00.000Z'); // 9:00 CST
  assert.equal(slots.at(-1).starts_at, '2026-11-23T17:30:00.000Z'); // 11:30 + 90m = 13:00
  assert.equal(availableSlots({ date: '2026-11-24', durationMinutes: 90, settings, rules, exceptions: [], busy: [], now: NOW }).length, 0, 'Tuesday closed');
  assert.equal(zonedToUtc('2026-07-06', '09:00', 'America/Chicago').toISOString(), '2026-07-06T14:00:00.000Z', 'CDT');
});

test('past dates, minimum notice, and blocked days produce no slots', () => {
  assert.equal(availableSlots({ date: '2026-11-16', durationMinutes: 60, settings, rules, exceptions: [], busy: [], now: NOW }).length, 0);
  assert.equal(availableSlots({ date: '2026-11-23', durationMinutes: 60, settings: { ...settings, min_notice_hours: 24 * 5 }, rules, exceptions: [], busy: [], now: NOW }).length, 0);
  assert.deepEqual(openWindows('2026-11-23', rules, [{ date: '2026-11-23', kind: 'blocked', start_time: null, end_time: null }]), []);
  const partial = availableSlots({ date: '2026-11-23', durationMinutes: 60, settings, rules, exceptions: [{ date: '2026-11-23', kind: 'blocked', start_time: '10:00', end_time: '12:00' }], busy: [], now: NOW });
  assert.ok(partial.every((s) => s.label === '9:00 AM' || s.label === '12:00 PM'));
});

test('booked time (with buffers) is not offered again', () => {
  const taken = slotFor(new Date('2026-11-23T16:00:00Z'), 90, 30, 'America/Chicago'); // 10:00 to 11:30 CST
  const slots = availableSlots({ date: '2026-11-23', durationMinutes: 90, settings, rules, exceptions: [], busy: [taken], now: NOW });
  for (const s of slots) assert.equal(slotsOverlap(s, taken), false);
  assert.equal(isPublishedSlot('2026-11-23T16:00:00.000Z', slots), false);
  assert.equal(isPublishedSlot('2026-11-23T15:00:00.000Z', slots), false, '9:00 visit + buffer touches the 10:00 booking buffer');
});

test('add-on time extends the first visit only', () => {
  const q = buildMediaQuote('before_after', ['extra_hour'], null);
  assert.equal(visitMinutes(q, {}, 1), 150);
  assert.equal(visitMinutes(q, {}, 2), 90);
  assert.equal(visitMinutes(q, { before_after: 120 }, 2), 120);
});

// ── Order status ────────────────────────────────────────────────────────────
test('unpaid orders cannot be confirmed; terminal states stay terminal', () => {
  assert.equal(canTransition('awaiting_payment', 'confirmed', 'pending'), false);
  assert.equal(canTransition('pending_confirmation', 'confirmed', 'pending'), false);
  assert.equal(canTransition('pending_confirmation', 'confirmed', 'paid'), true);
  assert.equal(canTransition('pending_confirmation', 'reschedule_proposed', 'paid'), true);
  assert.equal(canTransition('reschedule_proposed', 'confirmed', 'paid'), true);
  assert.equal(canTransition('confirmed', 'completed', 'paid'), true);
  assert.equal(canTransition('completed', 'confirmed', 'paid'), false);
  assert.equal(canTransition('canceled', 'confirmed', 'paid'), false);
  assert.equal(canTransition('awaiting_payment', 'canceled', 'pending'), true);
});

// ── Webhook and database guards ─────────────────────────────────────────────
test('media webhook is verified, paid-only, and idempotent', () => {
  const hook = readFileSync('app/api/stripe-webhook/route.ts', 'utf8');
  assert.ok(hook.indexOf('constructEvent(body, signature, webhookSecret)') < hook.indexOf('isMediaSession(event.data.object)'));
  const media = readFileSync('lib/server/media-webhook.ts', 'utf8');
  assert.ok(media.includes("session.payment_status !== 'paid'"));
  assert.ok(media.indexOf("rpc('mark_media_order_paid'") < media.indexOf('sendAdminPaidOrderEmail('));
  assert.ok(media.includes('if (!firstTime) return;'));
  const sql = readFileSync('supabase/migrations/20261122200000_media_services_and_social_posts.sql', 'utf8');
  assert.ok(sql.includes("where stripe_checkout_session_id = p_session_id and payment_status = 'pending'"));
  assert.ok(sql.includes('exclude using gist'));
  assert.ok(sql.includes('unique (contractor_id, period_month, slot_number)'));
});

test('admin media routes require an ADMIN', () => {
  for (const f of ['app/api/admin/media/orders/route.ts', 'app/api/admin/media/orders/[id]/route.ts', 'app/api/admin/media/schedule/route.ts', 'app/api/admin/social-posts/route.ts']) {
    const src = readFileSync(f, 'utf8');
    const handlers = src.match(/export async function (GET|POST|PATCH)/g) || [];
    const guards = src.match(/if \(!\(await requireAdminRequest\(request\)\)\) return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);/g) || [];
    assert.ok(handlers.length > 0 && guards.length === handlers.length, f);
  }
});

test('refunds are admin-initiated only', () => {
  const files = ['app/api/media/checkout/route.ts', 'lib/server/media-webhook.ts', 'app/api/social-posts/route.ts'];
  for (const f of files) assert.ok(!readFileSync(f, 'utf8').includes('refunds.create'), f);
  assert.ok(readFileSync('app/api/admin/media/orders/[id]/route.ts', 'utf8').includes('refunds.create'));
});
