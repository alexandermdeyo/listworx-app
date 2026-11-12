// Tests the real compliance rules (lib/compliance/rules.ts) and the daily job
// (lib/compliance/job.ts) with in-memory dependencies. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  centralToday, daysUntil, planReminder, warningTone, applyComplianceGate, buildReviewUpdate,
} from '../lib/compliance/rules.ts';
import { runComplianceJob } from '../lib/compliance/job.ts';

// ---------- dates ----------
test('centralToday uses Central time, not UTC', () => {
  // 02:00 UTC on Mar 2 is still Mar 1 in Chicago
  assert.equal(centralToday(new Date('2026-03-02T02:00:00Z')), '2026-03-01');
});

test('daysUntil counts calendar days; valid through the expiration date', () => {
  assert.equal(daysUntil('2026-12-31', '2026-12-01'), 30);
  assert.equal(daysUntil('2026-12-01', '2026-12-01'), 0);
  assert.equal(daysUntil('2026-11-30', '2026-12-01'), -1);
});

// ---------- reminders: 60 / 30 / 14 / 7, no duplicates ----------
test('reminders fire at 60, 30, 14 and 7 days, once each', () => {
  const sent = new Set();
  const emailed = [];
  for (let d = 70; d >= 0; d--) {
    const plan = planReminder(d, sent);
    plan.record.forEach((k) => sent.add(k));
    if (plan.email) emailed.push([d, plan.email]);
  }
  assert.deepEqual(emailed, [[60, 'expiry_60'], [30, 'expiry_30'], [14, 'expiry_14'], [7, 'expiry_7']]);
});

test('a document first seen 10 days out gets only the 14-day notice, never the 60/30 backlog', () => {
  const plan = planReminder(10, []);
  assert.equal(plan.email, 'expiry_14');
  assert.deepEqual(plan.record.sort(), ['expiry_14', 'expiry_30', 'expiry_60']);
  assert.deepEqual(planReminder(10, plan.record), { record: [], email: null });
});

test('expired documents notify contractor and admin once', () => {
  const first = planReminder(-1, ['expiry_60', 'expiry_30', 'expiry_14', 'expiry_7']);
  assert.equal(first.email, 'expired');
  assert.deepEqual(first.record, ['expired', 'admin_expired']);
  assert.deepEqual(planReminder(-5, [...first.record]), { record: [], email: null });
});

test('dashboard tone escalates 60 → 14 → 7 → expired', () => {
  assert.equal(warningTone(61), 'ok');
  assert.equal(warningTone(60), 'notice');
  assert.equal(warningTone(30), 'notice');
  assert.equal(warningTone(14), 'warning');
  assert.equal(warningTone(7), 'urgent');
  assert.equal(warningTone(0), 'urgent');
  assert.equal(warningTone(-1), 'expired');
  assert.equal(warningTone(null), 'ok');
});

// ---------- matching gate ----------
const rows = [
  { contractor_id: 'a', referral_eligible: true, hold_reasons: [] },
  { contractor_id: 'b', referral_eligible: false, hold_reasons: ['insurance_missing_or_expired'] },
];

test('enforced: held contractors are removed; order of the rest is preserved', () => {
  const r = applyComplianceGate(['a', 'b', 'c'], [...rows, { contractor_id: 'c', referral_eligible: true, hold_reasons: [] }], true);
  assert.deepEqual(r.allowedIds, ['a', 'c']);
  assert.deepEqual(r.held, [{ id: 'b', reasons: ['insurance_missing_or_expired'] }]);
});

test('not enforced (shadow): nobody removed, would-be holds reported', () => {
  const r = applyComplianceGate(['a', 'b'], rows, false);
  assert.deepEqual(r.allowedIds, ['a', 'b']);
  assert.equal(r.held.length, 1);
});

test('enforced and compliance data unavailable: fail closed', () => {
  assert.deepEqual(applyComplianceGate(['a', 'b'], null, true).allowedIds, []);
  assert.deepEqual(applyComplianceGate(['a'], [], true).held, [{ id: 'a', reasons: ['compliance_status_unavailable'] }]);
});

// ---------- admin review ----------
const now = new Date('2026-11-10T18:00:00Z');

test('review records the server-side reviewer and time, ignoring client values', () => {
  const r = buildReviewUpdate({ document_type: 'INSURANCE', expiration_date: '2027-06-01' }, { status: 'approved', reviewedBy: 'hacker' }, 'admin-1', now);
  assert.equal(r.ok, true);
  assert.equal(r.update.status, 'APPROVED');
  assert.equal(r.update.reviewed_by, 'admin-1');
  assert.equal(r.update.reviewed_at, now.toISOString());
});

test('license/insurance cannot be approved without a date or when already expired', () => {
  assert.equal(buildReviewUpdate({ document_type: 'LICENSE', expiration_date: null }, { status: 'APPROVED' }, 'a', now).ok, false);
  assert.equal(buildReviewUpdate({ document_type: 'INSURANCE', expiration_date: '2026-11-09' }, { status: 'APPROVED' }, 'a', now).ok, false);
  const fixed = buildReviewUpdate({ document_type: 'LICENSE', expiration_date: null }, { status: 'APPROVED', expirationDate: '2027-01-31', licensingAuthority: ' TN Board ' }, 'a', now);
  assert.equal(fixed.ok, true);
  assert.equal(fixed.update.expiration_date, '2027-01-31');
  assert.equal(fixed.update.licensing_authority, 'TN Board');
});

test('invalid statuses and malformed dates are rejected', () => {
  assert.equal(buildReviewUpdate({ document_type: 'OTHER', expiration_date: null }, { status: 'VERIFIED' }, 'a', now).ok, false);
  assert.equal(buildReviewUpdate({ document_type: 'OTHER', expiration_date: null }, { status: 'APPROVED', expirationDate: '12/31/2026' }, 'a', now).ok, false);
});

// ---------- daily job ----------
function fakeJobDeps(docs, { failContractorEmail = false, failAdmin = false } = {}) {
  const log = new Map(); // docId -> Set(kind)
  const out = { contractorEmails: [], adminDigests: [], expired: [] };
  return {
    out, log,
    deps: {
      async loadDocs() { return docs.map((d) => ({ ...d })); },
      async loadSent(ids) { const m = new Map(); for (const id of ids) if (log.has(id)) m.set(id, new Set(log.get(id))); return m; },
      async claim(id, kind) { if (!log.has(id)) log.set(id, new Set()); if (log.get(id).has(kind)) return false; log.get(id).add(kind); return true; },
      async release(id, kind) { log.get(id)?.delete(kind); },
      async markExpired(ids) { out.expired.push(...ids); for (const d of docs) if (ids.includes(d.id) && d.status === 'APPROVED') d.status = 'EXPIRED'; },
      async emailContractor(doc, kind) { if (failContractorEmail) throw new Error('smtp down'); out.contractorEmails.push([doc.id, kind]); },
      async emailAdmin(d) { if (failAdmin) throw new Error('smtp down'); out.adminDigests.push({ expired: d.expired.map((x) => x.id), pending: d.pending.map((x) => x.id) }); },
    },
  };
}
const base = { contractor_id: 'c1', created_at: '2026-01-01', company_name: 'A Co', contact_email: 'a@example.com' };
const at = (iso) => new Date(`${iso}T18:00:00Z`);

test('job: sends the due reminder once even when run twice the same day', async () => {
  const docs = [{ ...base, id: 'ins1', document_type: 'INSURANCE', status: 'APPROVED', expiration_date: '2026-12-10' }];
  const f = fakeJobDeps(docs);
  await runComplianceJob(f.deps, at('2026-11-10')); // 30 days out
  await runComplianceJob(f.deps, at('2026-11-10'));
  assert.deepEqual(f.out.contractorEmails, [['ins1', 'expiry_30']]);
});

test('job: on expiry marks EXPIRED, emails contractor once and includes it in one admin digest', async () => {
  const docs = [{ ...base, id: 'ins1', document_type: 'INSURANCE', status: 'APPROVED', expiration_date: '2026-11-09' }];
  const f = fakeJobDeps(docs);
  await runComplianceJob(f.deps, at('2026-11-10'));
  await runComplianceJob(f.deps, at('2026-11-11'));
  assert.deepEqual(f.out.expired, ['ins1']);
  assert.deepEqual(f.out.contractorEmails, [['ins1', 'expired']]);
  assert.deepEqual(f.out.adminDigests, [{ expired: ['ins1'], pending: [] }]);
});

test('job: an approved renewal stops reminders for the old document', async () => {
  const docs = [
    { ...base, id: 'old', document_type: 'INSURANCE', status: 'APPROVED', expiration_date: '2026-11-20' },
    { ...base, id: 'new', document_type: 'INSURANCE', status: 'APPROVED', expiration_date: '2027-11-20' },
  ];
  const f = fakeJobDeps(docs);
  await runComplianceJob(f.deps, at('2026-11-10'));
  assert.deepEqual(f.out.contractorEmails, []);
});

test('job: pending uploads reach the admin once', async () => {
  const docs = [{ ...base, id: 'p1', document_type: 'LICENSE', status: 'PENDING', expiration_date: '2027-05-01' }];
  const f = fakeJobDeps(docs);
  await runComplianceJob(f.deps, at('2026-11-10'));
  await runComplianceJob(f.deps, at('2026-11-11'));
  assert.deepEqual(f.out.adminDigests, [{ expired: [], pending: ['p1'] }]);
});

test('job: failed sends are released and retried next run, then not repeated', async () => {
  const docs = [{ ...base, id: 'ins1', document_type: 'INSURANCE', status: 'APPROVED', expiration_date: '2026-11-17' }];
  const failing = fakeJobDeps(docs, { failContractorEmail: true });
  const s1 = await runComplianceJob(failing.deps, at('2026-11-10'));
  assert.equal(s1.failures, 1);
  assert.equal(failing.log.get('ins1').has('expiry_7'), false, 'claim released for retry');
  // next day, email works
  failing.deps.emailContractor = async (doc, kind) => { failing.out.contractorEmails.push([doc.id, kind]); };
  await runComplianceJob(failing.deps, at('2026-11-11'));
  await runComplianceJob(failing.deps, at('2026-11-11'));
  assert.deepEqual(failing.out.contractorEmails, [['ins1', 'expiry_7']]);
});

test('job: certifications and other optional documents are ignored', async () => {
  const docs = [{ ...base, id: 'cert', document_type: 'CERTIFICATION', status: 'APPROVED', expiration_date: '2026-11-01' }];
  const f = fakeJobDeps(docs);
  await runComplianceJob(f.deps, at('2026-11-10'));
  assert.deepEqual([f.out.expired, f.out.contractorEmails, f.out.adminDigests], [[], [], []]);
});

// ---------- delivery safeguards ----------
test('job: at most one compliance email per contractor per day, most urgent first', async () => {
  const docs = [
    { ...base, id: 'lic', document_type: 'LICENSE', status: 'APPROVED', expiration_date: '2026-11-24' },   // 14 days
    { ...base, id: 'ins', document_type: 'INSURANCE', status: 'APPROVED', expiration_date: '2026-11-17' }, // 7 days
  ];
  const f = fakeJobDeps(docs);
  const s1 = await runComplianceJob(f.deps, at('2026-11-10'));
  assert.deepEqual(f.out.contractorEmails, [['ins', 'expiry_7']]);
  assert.equal(s1.deferred, 1);
  await runComplianceJob(f.deps, at('2026-11-11'));
  assert.deepEqual(f.out.contractorEmails, [['ins', 'expiry_7'], ['lic', 'expiry_14']]);
  await runComplianceJob(f.deps, at('2026-11-12'));
  assert.equal(f.out.contractorEmails.length, 2, 'nothing repeated');
});

test('job: different contractors are not limited by each other', async () => {
  const docs = [
    { ...base, id: 'a', document_type: 'INSURANCE', status: 'APPROVED', expiration_date: '2026-11-17' },
    { ...base, contractor_id: 'c2', id: 'b', document_type: 'INSURANCE', status: 'APPROVED', expiration_date: '2026-11-17' },
  ];
  const f = fakeJobDeps(docs);
  await runComplianceJob(f.deps, at('2026-11-10'));
  assert.equal(f.out.contractorEmails.length, 2);
});
