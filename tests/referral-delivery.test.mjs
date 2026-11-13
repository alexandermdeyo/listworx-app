// Owner rules 2026-11-12: a referral counts when the contractor reaches the requestor;
// one email per referral, no job details; email failures never change the count. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  deliverableContractors,
  notifyReferredContractors,
  referralEmailPayload,
  requestorCard,
} from '../lib/server/referral-notify.ts';

const matched = [
  { id: 'c1', email: 'a@x.com', owner_name: 'A', company_name: 'A Co' },
  { id: 'c2', email: 'b@x.com', owner_name: 'B', company_name: 'B Co' },
  { id: 'c3', email: 'c@x.com', owner_name: 'C', company_name: 'C Co' },
];

test('only contractors with a recorded referral are delivered, each once', () => {
  const out = deliverableContractors(matched, [
    { id: 'r1', contractor_id: 'c1' },
    { id: 'r3', contractor_id: 'c3' },
  ]);
  assert.deepEqual(out.map((c) => [c.id, c.referralId]), [['c1', 'r1'], ['c3', 'r3']]);
});

test('nothing recorded means nothing delivered (failed insert)', () => {
  assert.deepEqual(deliverableContractors(matched, null), []);
  assert.deepEqual(deliverableContractors(matched, []), []);
});

test('the referral email carries no job, requestor, trade or location details', () => {
  const payload = referralEmailPayload({ referralId: 'r1', email: 'a@x.com', ownerName: 'A', companyName: 'A Co' });
  assert.deepEqual(Object.keys(payload).sort(), ['companyName', 'contractorName', 'to', 'type']);
  assert.equal(payload.type, 'referral_notification');
});

test('one email per referral: a second notifier for the same referral sends nothing', async () => {
  const claimed = new Set();
  const sent = [];
  const deps = {
    async claim(id) { if (claimed.has(id)) return false; claimed.add(id); return true; },
    async release(id) { claimed.delete(id); },
    async send(p) { sent.push(p.to); return true; },
  };
  const list = [{ referralId: 'r1', email: 'a@x.com', ownerName: 'A', companyName: 'A Co' }];
  const first = await notifyReferredContractors(list, deps);
  const second = await notifyReferredContractors(list, deps);
  assert.equal(first[0].outcome, 'sent');
  assert.equal(second[0].outcome, 'already_sent');
  assert.deepEqual(sent, ['a@x.com']);
});

test('a failed send releases the claim (retry possible) and never throws', async () => {
  const released = [];
  const deps = {
    async claim() { return true; },
    async release(id) { released.push(id); },
    async send() { throw new Error('provider down'); },
  };
  const out = await notifyReferredContractors(
    [{ referralId: 'r9', email: 'z@x.com', ownerName: 'Z', companyName: 'Z Co' }],
    deps
  );
  assert.equal(out[0].outcome, 'failed');
  assert.deepEqual(released, ['r9']);
});

test('no email address: skipped, nothing claimed', async () => {
  let claims = 0;
  const out = await notifyReferredContractors(
    [{ referralId: 'r2', email: null, ownerName: 'B', companyName: 'B Co' }],
    { async claim() { claims++; return true; }, async release() {}, async send() { return true; } }
  );
  assert.equal(out[0].outcome, 'no_email');
  assert.equal(claims, 0);
});

test('job-request route delivers only recorded contractors and reports emailSent truthfully', () => {
  const src = readFileSync(new URL('../app/api/job-request/route.ts', import.meta.url), 'utf8');
  assert.match(src, /contractors: delivered\.map\(\(c\) =>\s*requestorCard\(/);
  assert.match(src, /emailSent: requestorEmailSent/);
  assert.doesNotMatch(src, /jobDescription: esc\(/, 'contractor email must not carry the job description');
});

test('referral email template has the approved wording and no request details', () => {
  const src = readFileSync(new URL('../supabase/functions/send-contractor-email/index.ts', import.meta.url), 'utf8');
  const block = src.slice(src.indexOf("case 'referral_notification'"), src.indexOf('default:', src.indexOf("case 'referral_notification'")));
  assert.match(block, /subject = 'ListWorx Has Referred You!'/);
  for (const line of [
    'ListWorx has referred your business to a homeowner or property professional.',
    'They have received your contact information and may contact you directly.',
    'Please be ready for a possible call, text, or email.',
    'Thank you for being part of ListWorx.',
  ]) assert.ok(block.includes(line), line);
  assert.doesNotMatch(block, /jobCategory|jobCounty|jobState|jobDescription|requesterType/);
});

test('requestors receive only public card fields', () => {
  const card = requestorCard({
    id: 'c1', company_name: 'A Co', owner_name: 'A', email: 'a@x.com', phone: '1', website: null, bio: 'b',
    years_in_business: 8, license_document_url: 'https://signed', insurance_document_url: 'https://signed',
    stripe_customer_id: 'cus_1', license_number: 'X', partner_status: 'active', user_id: 'u1', referralId: 'r1',
  });
  for (const k of ['license_document_url', 'insurance_document_url', 'stripe_customer_id', 'license_number', 'partner_status', 'user_id', 'referralId']) {
    assert.ok(!(k in card), k);
  }
  assert.equal(card.years_in_business, 8);
});

test('requestor card: contact, profile link, founder and IronClad flags — never subscription', () => {
  const card = requestorCard({
    id: 'c1', company_name: 'A Co', owner_name: 'A', email: 'a@x.com', phone: '615', website: 'old.com',
    business_website: 'https://a.co', profile_slug: 'a-co', founder_status: false, founding_partner: true,
    ironclad_certified: true, subscription_tier: 'elite', subscription_status: 'active', founder_tier: 'elite',
    stripe_subscription_id: 'sub_1', purchased_addons: ['x'],
  }, 'Plumbing');
  for (const k of ['email', 'phone', 'website', 'profile_slug', 'founding_partner', 'ironclad_certified']) assert.ok(k in card, k);
  assert.equal(card.website, 'https://a.co');
  assert.equal(card.trade, 'Plumbing');
  for (const k of ['subscription_tier', 'subscription_status', 'founder_tier', 'stripe_subscription_id', 'purchased_addons', 'tier']) {
    assert.ok(!(k in card), k);
  }
});

test('job-request builds requestor cards from profile rows, not the matching result (which carries the tier)', () => {
  const src = readFileSync(new URL('../app/api/job-request/route.ts', import.meta.url), 'utf8');
  assert.match(src, /select\(REQUESTOR_CARD_FIELDS\.join\(', '\)\)/);
  assert.match(src, /cardProfileById\[c\.id\]/);
});
