// Runs the REAL matcher (lib/contractor-matching.ts) against an in-memory
// stand-in for the Supabase query builder, to show compliance holds only
// remove contractors and never change the ranking of the rest. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMatchedContractors } from '../lib/contractor-matching.ts';

function fakeSupabase(tables) {
  const calls = [];
  return {
    from(name) {
      let rows = [...(tables[name] || [])];
      const q = {
        select() { return q; },
        eq(col, v) { rows = rows.filter((r) => r[col] === v); return q; },
        in(col, vs) { rows = rows.filter((r) => vs.includes(r[col])); return q; },
        maybeSingle() { return Promise.resolve({ data: rows[0] ?? null, error: null }); },
        then(res, rej) { return Promise.resolve({ data: rows, error: null }).then(res, rej); },
      };
      return q;
    },
    calls,
    rpc(name, args) {
      calls.push([name, args]);
      if (name !== 'referral_eligibility') return Promise.resolve({ data: null, error: null });
      const rows = (tables.contractor_compliance || []).filter((r) => args.p_contractor_ids.includes(r.contractor_id));
      return Promise.resolve({ data: rows, error: tables.rpcError || null });
    },
  };
}

const county = 'county-1';
const trade = 'trade-1';
const profile = (id, tier) => ({ id, user_id: `u-${id}`, company_name: id, owner_name: id, email: `${id}@x.com`, phone: '', partner_status: 'active', archived: false, subscription_tier: tier });

function world({ enforced, compliance, rpcError }) {
  const ids = ['elite1', 'pref1', 'basic1', 'basic2'];
  return fakeSupabase({
    contractor_counties: ids.map((id) => ({ contractor_id: id, county_id: county })),
    contractor_categories: ids.map((id) => ({ contractor_id: id, category_id: trade })),
    contractor_profiles: [profile('elite1', 'elite'), profile('pref1', 'preferred'), profile('basic1', 'basic'), profile('basic2', 'basic')],
    admin_settings: [{ key: 'compliance_holds_enforced', value: enforced ? 'true' : 'false' }],
    contractor_compliance: compliance,
    rpcError,
  });
}
const allEligible = ['elite1', 'pref1', 'basic1', 'basic2'].map((id) => ({ contractor_id: id, referral_eligible: true, hold_reasons: [] }));
const prefHeld = allEligible.map((r) => (r.contractor_id === 'pref1' ? { ...r, referral_eligible: false, hold_reasons: ['insurance_missing_or_expired'] } : r));
const opts = { countyId: county, categoryIds: [trade], jobRequestId: 'job-42' };
const names = (list) => list.map((c) => c.id);

test('no holds: the matcher returns its normal top 3', async () => {
  const picks = await findMatchedContractors(world({ enforced: true, compliance: allEligible }), opts);
  assert.equal(picks.length, 3);
  assert.equal(picks[0].id, 'elite1');
});

test('enforced hold removes the held contractor; everyone else keeps their score and order', async () => {
  const normal = await findMatchedContractors(world({ enforced: true, compliance: allEligible }), opts);
  const held = await findMatchedContractors(world({ enforced: true, compliance: prefHeld }), opts);
  assert.ok(!names(held).includes('pref1'));
  const expected = normal.filter((c) => c.id !== 'pref1');
  const scoreOf = Object.fromEntries(normal.map((c) => [c.id, c.score]));
  for (const c of held) if (c.id in scoreOf) assert.equal(c.score, scoreOf[c.id], `score changed for ${c.id}`);
  assert.deepEqual(names(held).slice(0, expected.length), names(expected));
  assert.ok(held.length <= 3, 'never more than 3');
});

test('shadow mode (not enforced): held contractor still matched', async () => {
  const picks = await findMatchedContractors(world({ enforced: false, compliance: prefHeld }), opts);
  assert.ok(names(picks).includes('pref1'));
});

test('enforced and nobody compliant: no matches (request falls back to manual matching)', async () => {
  const none = allEligible.map((r) => ({ ...r, referral_eligible: false, hold_reasons: ['insurance_awaiting_review'] }));
  assert.deepEqual(await findMatchedContractors(world({ enforced: true, compliance: none }), opts), []);
});

test('compliance is judged for this job: its county and requested trades are sent to the database', async () => {
  const sb = world({ enforced: true, compliance: allEligible });
  await findMatchedContractors(sb, opts);
  const call = sb.calls.find(([name]) => name === 'referral_eligibility');
  assert.ok(call, 'referral_eligibility was not called');
  assert.equal(call[1].p_county_id, county);
  assert.deepEqual(call[1].p_category_ids, [trade]);
  assert.deepEqual([...call[1].p_contractor_ids].sort(), ['basic1', 'basic2', 'elite1', 'pref1']);
});

test('enforced and the eligibility check fails: nobody matched (fail closed)', async () => {
  const picks = await findMatchedContractors(world({ enforced: true, compliance: allEligible, rpcError: { message: 'down' } }), opts);
  assert.deepEqual(picks, []);
});

test('not enforced and the eligibility check fails: matching continues normally', async () => {
  const picks = await findMatchedContractors(world({ enforced: false, compliance: allEligible, rpcError: { message: 'down' } }), opts);
  assert.equal(picks.length, 3);
});
