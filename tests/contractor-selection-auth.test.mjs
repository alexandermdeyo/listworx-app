// Tests the real authorization and state rules in lib/server/contractor-selection.ts
// with an in-memory stand-in for the database.
// Run: node --test tests/   (Node 22.18+ runs the .ts module directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectContractor } from '../lib/server/contractor-selection.ts';

const ids = {
  homeowner: '11111111-1111-4111-8111-111111111111',
  otherHomeowner: '22222222-2222-4222-8222-222222222222',
  realtor: '33333333-3333-4333-8333-333333333333',
  admin: '44444444-4444-4444-8444-444444444444',
  contractorUser: '55555555-5555-4555-8555-555555555555',
  profile: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  otherProfile: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  job: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  realtorJob: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  ref1: 'e0000000-0000-4000-8000-000000000001',
  ref2: 'e0000000-0000-4000-8000-000000000002',
  ref3: 'e0000000-0000-4000-8000-000000000003',
  otherJobRef: 'e0000000-0000-4000-8000-000000000009',
  realtorRef: 'e0000000-0000-4000-8000-000000000010',
  unknownRef: 'e0000000-0000-4000-8000-0000000000ff',
};

function makeDb() {
  return {
    users: {
      [ids.homeowner]: { role: 'HOMEOWNER', email: 'home@example.com', verified: true },
      [ids.otherHomeowner]: { role: 'HOMEOWNER', email: 'other@example.com', verified: true },
      [ids.realtor]: { role: 'REALTOR', email: 'agent@example.com', verified: true },
      [ids.admin]: { role: 'ADMIN', email: 'admin@example.com', verified: true },
      [ids.contractorUser]: { role: 'CONTRACTOR', email: 'pro@example.com', verified: true },
    },
    profiles: { [ids.profile]: ids.homeowner, [ids.otherProfile]: ids.otherHomeowner },
    jobs: {
      [ids.job]: { id: ids.job, requestor_profile_id: ids.profile, requester_email: 'home@example.com', status: 'PENDING' },
      [ids.realtorJob]: { id: ids.realtorJob, requestor_profile_id: null, requester_email: 'Agent@Example.com', status: 'PENDING' },
      other: { id: 'other', requestor_profile_id: ids.otherProfile, requester_email: 'other@example.com', status: 'PENDING' },
    },
    referrals: {
      [ids.ref1]: { id: ids.ref1, job_request_id: ids.job, contractor_id: 'c1', status: 'PENDING' },
      [ids.ref2]: { id: ids.ref2, job_request_id: ids.job, contractor_id: 'c2', status: 'PENDING' },
      [ids.ref3]: { id: ids.ref3, job_request_id: ids.job, contractor_id: 'c3', status: 'DECLINED' },
      [ids.otherJobRef]: { id: ids.otherJobRef, job_request_id: 'other', contractor_id: 'c1', status: 'PENDING' },
      [ids.realtorRef]: { id: ids.realtorRef, job_request_id: ids.realtorJob, contractor_id: 'c2', status: 'PENDING' },
    },
    writes: 0,
  };
}

function depsFor(db, userId) {
  return {
    async getUser() {
      if (!userId) return null;
      const u = db.users[userId];
      return { id: userId, email: u.email, emailVerified: u.verified };
    },
    async getUserRole(id) { return db.users[id]?.role ?? null; },
    async getReferral(id) { return db.referrals[id] ? { ...db.referrals[id] } : null; },
    async getJobRequest(id) { return db.jobs[id] ? { ...db.jobs[id] } : null; },
    async getRequestorProfileUserId(id) { return db.profiles[id] ?? null; },
    async listReferrals(jobId) { return Object.values(db.referrals).filter((r) => r.job_request_id === jobId).map((r) => ({ ...r })); },
    async markSelected({ jobRequestId, referralId }) {
      const r = db.referrals[referralId];
      if (!r || r.job_request_id !== jobRequestId || !['PENDING', 'ACCEPTED'].includes(r.status)) return false;
      r.status = 'CONTACTED';
      db.jobs[jobRequestId].status = 'ASSIGNED';
      db.writes += 1;
      return true;
    },
  };
}

test('unauthenticated requests are rejected with no writes', async () => {
  const db = makeDb();
  const res = await selectContractor({ referralId: ids.ref1 }, depsFor(db, null));
  assert.equal(res.status, 401);
  assert.equal(db.writes, 0);
});

test('malformed body is rejected', async () => {
  const db = makeDb();
  for (const body of [null, {}, { referralId: 'not-a-uuid' }, { referralId: 42 }]) {
    const res = await selectContractor(body, depsFor(db, ids.homeowner));
    assert.equal(res.status, 400);
  }
  assert.equal(db.writes, 0);
});

test('homeowner can select a contractor matched to their own request', async () => {
  const db = makeDb();
  const res = await selectContractor({ referralId: ids.ref1 }, depsFor(db, ids.homeowner));
  assert.equal(res.status, 200);
  assert.equal(db.referrals[ids.ref1].status, 'CONTACTED');
  assert.equal(db.referrals[ids.ref2].status, 'PENDING', 'other matches are left alone');
  assert.equal(db.jobs[ids.job].status, 'ASSIGNED');
});

test("another homeowner cannot select on someone else's request", async () => {
  const db = makeDb();
  const res = await selectContractor({ referralId: ids.ref1 }, depsFor(db, ids.otherHomeowner));
  assert.equal(res.status, 403);
  assert.equal(db.writes, 0);
  assert.equal(db.referrals[ids.ref1].status, 'PENDING');
});

test('matching email alone does not grant a homeowner access to a request owned by another profile', async () => {
  const db = makeDb();
  db.users[ids.otherHomeowner].email = 'home@example.com'; // same email as the request, different profile
  const res = await selectContractor({ referralId: ids.ref1 }, depsFor(db, ids.otherHomeowner));
  assert.equal(res.status, 403);
});

test('a contractor account cannot select on a request', async () => {
  const db = makeDb();
  const res = await selectContractor({ referralId: ids.ref1 }, depsFor(db, ids.contractorUser));
  assert.equal(res.status, 403);
  assert.equal(db.writes, 0);
});

test('realtor can select on a request submitted with their verified email (case-insensitive)', async () => {
  const db = makeDb();
  const res = await selectContractor({ referralId: ids.realtorRef }, depsFor(db, ids.realtor));
  assert.equal(res.status, 200);
  assert.equal(db.referrals[ids.realtorRef].status, 'CONTACTED');
});

test('realtor with an unverified email is refused', async () => {
  const db = makeDb();
  db.users[ids.realtor].verified = false;
  const res = await selectContractor({ referralId: ids.realtorRef }, depsFor(db, ids.realtor));
  assert.equal(res.status, 403);
  assert.equal(db.writes, 0);
});

test('realtor cannot select on a request submitted under a different email', async () => {
  const db = makeDb();
  const res = await selectContractor({ referralId: ids.ref1 }, depsFor(db, ids.realtor));
  assert.equal(res.status, 403);
});

test('admin can select on any request', async () => {
  const db = makeDb();
  const res = await selectContractor({ referralId: ids.ref2 }, depsFor(db, ids.admin));
  assert.equal(res.status, 200);
  assert.equal(db.referrals[ids.ref2].status, 'CONTACTED');
});

test('unknown referral returns 404 with no writes', async () => {
  const db = makeDb();
  const res = await selectContractor({ referralId: ids.unknownRef }, depsFor(db, ids.homeowner));
  assert.equal(res.status, 404);
  assert.equal(db.writes, 0);
});

test('a declined referral cannot be selected', async () => {
  const db = makeDb();
  const res = await selectContractor({ referralId: ids.ref3 }, depsFor(db, ids.homeowner));
  assert.equal(res.status, 409);
  assert.equal(db.referrals[ids.ref3].status, 'DECLINED');
});

test('duplicate submission for the same contractor succeeds once and does not write twice', async () => {
  const db = makeDb();
  const deps = depsFor(db, ids.homeowner);
  const first = await selectContractor({ referralId: ids.ref1 }, deps);
  const second = await selectContractor({ referralId: ids.ref1 }, deps);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.body.alreadySelected, true);
  assert.equal(db.writes, 1);
});

test('choosing a second contractor after one is selected is refused', async () => {
  const db = makeDb();
  const deps = depsFor(db, ids.homeowner);
  await selectContractor({ referralId: ids.ref1 }, deps);
  const res = await selectContractor({ referralId: ids.ref2 }, deps);
  assert.equal(res.status, 409);
  assert.equal(db.referrals[ids.ref2].status, 'PENDING');
  assert.equal(db.writes, 1);
});

test('closed requests do not accept a selection', async () => {
  const db = makeDb();
  for (const status of ['COMPLETED', 'CANCELLED', 'IN_PROGRESS']) {
    db.jobs[ids.job].status = status;
    const res = await selectContractor({ referralId: ids.ref1 }, depsFor(db, ids.homeowner));
    assert.equal(res.status, 409, status);
  }
  assert.equal(db.writes, 0);
});

test('a request with more referrals than the matcher allows is refused rather than acted on', async () => {
  const db = makeDb();
  db.referrals.extra = { id: 'extra', job_request_id: ids.job, contractor_id: 'c4', status: 'PENDING' };
  const res = await selectContractor({ referralId: ids.ref1 }, depsFor(db, ids.homeowner));
  assert.equal(res.status, 409);
  assert.equal(db.writes, 0);
});

test('a referral that stops being selectable between check and write is refused', async () => {
  const db = makeDb();
  const deps = depsFor(db, ids.homeowner);
  const realList = deps.listReferrals;
  deps.listReferrals = async (jobId) => {
    const rows = await realList(jobId);
    db.referrals[ids.ref1].status = 'DECLINED'; // contractor declines at the same moment
    return rows;
  };
  const res = await selectContractor({ referralId: ids.ref1 }, deps);
  assert.equal(res.status, 409);
  assert.equal(db.writes, 0);
});
