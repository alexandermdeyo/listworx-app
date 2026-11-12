// Essential vs optional contractor email (owner decision 6). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canSendContractorEmail } from '../lib/notifications/policy.ts';

test('essential notices go out even when optional emails are turned off', () => {
  assert.deepEqual(canSendContractorEmail('essential', { email: 'pro@example.com', optionalEmailsEnabled: false }), { send: true });
});

test('optional emails respect the contractor setting', () => {
  assert.deepEqual(canSendContractorEmail('optional', { email: 'pro@example.com', optionalEmailsEnabled: false }), { send: false, reason: 'opted_out' });
  assert.deepEqual(canSendContractorEmail('optional', { email: 'pro@example.com', optionalEmailsEnabled: true }), { send: true });
});

test('nothing is sent without a valid address on the account', () => {
  for (const email of [null, '', 'not-an-email', ' @x.com']) {
    assert.equal(canSendContractorEmail('essential', { email }).send, false);
  }
});

// ---------- new-referral emails follow the contractor's setting ----------
import { findMatchedContractors } from '../lib/contractor-matching.ts';

function fakeDb(profiles) {
  return {
    from(name) {
      const tables = {
        contractor_counties: profiles.map((p) => ({ contractor_id: p.id, county_id: 'c1' })),
        contractor_categories: profiles.map((p) => ({ contractor_id: p.id, category_id: 't1' })),
        contractor_profiles: profiles,
      };
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
    rpc() { return Promise.resolve({ data: null, error: null }); },
  };
}

test('matching still picks a contractor who turned emails off, and carries the setting for the email step', async () => {
  const base = { partner_status: 'active', archived: false, subscription_tier: 'basic', company_name: 'X', owner_name: 'X', phone: '' };
  const picks = await findMatchedContractors(fakeDb([
    { ...base, id: 'on', email: 'on@example.com', notification_email: true },
    { ...base, id: 'off', email: 'off@example.com', notification_email: false },
    { ...base, id: 'unset', email: 'unset@example.com' },
  ]), { countyId: 'c1', categoryIds: ['t1'], jobRequestId: 'j1' });
  const byId = Object.fromEntries(picks.map((p) => [p.id, p.notification_email]));
  assert.deepEqual(byId, { on: true, off: false, unset: true }, 'opted-out contractor must still be matched');
  const emailed = picks.filter((c) => canSendContractorEmail('optional', { email: c.email, optionalEmailsEnabled: c.notification_email }).send).map((c) => c.id).sort();
  assert.deepEqual(emailed, ['on', 'unset']);
});
