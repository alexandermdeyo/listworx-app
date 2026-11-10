/**
 * Authorization and state rules for a requester choosing one of their matched
 * contractors (POST /api/requestor/select-contractor).
 *
 * Kept free of framework and path-alias imports so the real rules can be unit
 * tested with in-memory dependencies (tests/contractor-selection-auth.test.mjs).
 * The route supplies database-backed dependencies.
 *
 * Ownership mirrors how /api/requestor-dashboard decides whose requests to show:
 * - HOMEOWNER / PROPERTY_MANAGER: job_requests.requestor_profile_id belongs to
 *   a requestor_profiles row whose user_id is the signed-in user.
 * - REALTOR: job_requests.requester_email equals the signed-in user's email,
 *   and that email has been verified by Supabase Auth.
 * - ADMIN: may act on any request.
 *
 * Matching, rankings, and the three-referral limit are not touched here: a
 * requester can only pick a referral row the matcher already created.
 */

export type SelectionUser = {
  id: string;
  email: string | null;
  emailVerified: boolean;
};

export type ReferralRow = {
  id: string;
  job_request_id: string | null;
  contractor_id: string | null;
  status: string | null;
};

export type JobRequestRow = {
  id: string;
  requestor_profile_id: string | null;
  requester_email: string | null;
  status: string | null;
};

export type SelectionDeps = {
  /** Server-verified signed-in user, or null. */
  getUser(): Promise<SelectionUser | null>;
  /** users.role for this user id (e.g. 'ADMIN', 'HOMEOWNER'), or null. */
  getUserRole(userId: string): Promise<string | null>;
  getReferral(referralId: string): Promise<ReferralRow | null>;
  getJobRequest(jobRequestId: string): Promise<JobRequestRow | null>;
  /** user_id of a requestor_profiles row, or null. */
  getRequestorProfileUserId(profileId: string): Promise<string | null>;
  /** Every referral row for the request (the matcher's picks). */
  listReferrals(jobRequestId: string): Promise<ReferralRow[]>;
  /**
   * Marks the referral CONTACTED and the request ASSIGNED. Must only move the
   * referral if it is still in a selectable status (guards against races).
   * Returns false if the referral was no longer selectable.
   */
  markSelected(args: { jobRequestId: string; referralId: string; now: string }): Promise<boolean>;
};

export type SelectionResult = { status: number; body: Record<string, unknown> };

/** Referral statuses a requester may choose from (referral_status enum). */
export const SELECTABLE_REFERRAL_STATUSES = ['PENDING', 'ACCEPTED'];
/** Statuses that mean a contractor has already been chosen for the request. */
export const CHOSEN_REFERRAL_STATUSES = ['CONTACTED', 'COMPLETED'];
/** Request statuses that still accept a selection (job_status enum). */
export const OPEN_JOB_STATUSES = ['PENDING', 'ASSIGNED'];
/** Matcher limit; mirrored here only to reject inconsistent data, never to change it. */
export const MAX_MATCHED_REFERRALS = 3;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const upper = (v: string | null | undefined) => (v || '').toString().trim().toUpperCase();

export async function canActOnJobRequest(
  user: SelectionUser,
  role: string | null,
  job: JobRequestRow,
  deps: Pick<SelectionDeps, 'getRequestorProfileUserId'>
): Promise<boolean> {
  const r = upper(role);
  if (r === 'ADMIN') return true;

  if ((r === 'HOMEOWNER' || r === 'PROPERTY_MANAGER') && job.requestor_profile_id) {
    const ownerId = await deps.getRequestorProfileUserId(job.requestor_profile_id);
    if (ownerId && ownerId === user.id) return true;
  }

  if (r === 'REALTOR' && user.emailVerified && user.email && job.requester_email) {
    if (user.email.trim().toLowerCase() === job.requester_email.trim().toLowerCase()) return true;
  }

  return false;
}

export async function selectContractor(input: unknown, deps: SelectionDeps): Promise<SelectionResult> {
  const user = await deps.getUser();
  if (!user) return { status: 401, body: { error: 'Unauthorized' } };

  const referralId = (input && typeof input === 'object' ? (input as any).referralId : null) as unknown;
  if (typeof referralId !== 'string' || !UUID_RE.test(referralId)) {
    return { status: 400, body: { error: 'A valid referralId is required.' } };
  }

  const referral = await deps.getReferral(referralId);
  if (!referral?.job_request_id) return { status: 404, body: { error: 'Referral not found.' } };

  const job = await deps.getJobRequest(referral.job_request_id);
  if (!job) return { status: 404, body: { error: 'Referral not found.' } };

  const role = await deps.getUserRole(user.id);
  if (!(await canActOnJobRequest(user, role, job, deps))) {
    // Same answer whether the request exists or not, so ids can't be probed.
    return { status: 403, body: { error: 'Forbidden' } };
  }

  if (!OPEN_JOB_STATUSES.includes(upper(job.status))) {
    return { status: 409, body: { error: 'This request is no longer open for selection.' } };
  }

  const referrals = await deps.listReferrals(job.id);
  const match = referrals.find((r) => r.id === referral.id);
  if (!match || referrals.length > MAX_MATCHED_REFERRALS) {
    return { status: 409, body: { error: 'That contractor is not one of the matches for this request.' } };
  }

  // Already chose this contractor: succeed without writing again (double-clicks, retries).
  if (CHOSEN_REFERRAL_STATUSES.includes(upper(match.status))) {
    const otherChosen = referrals.some((r) => r.id !== match.id && CHOSEN_REFERRAL_STATUSES.includes(upper(r.status)));
    if (!otherChosen) return { status: 200, body: { success: true, alreadySelected: true } };
  }

  if (referrals.some((r) => r.id !== match.id && CHOSEN_REFERRAL_STATUSES.includes(upper(r.status)))) {
    return { status: 409, body: { error: 'A contractor has already been selected for this request.' } };
  }

  if (!SELECTABLE_REFERRAL_STATUSES.includes(upper(match.status))) {
    return { status: 409, body: { error: 'That contractor can no longer be selected.' } };
  }

  const moved = await deps.markSelected({ jobRequestId: job.id, referralId: match.id, now: new Date().toISOString() });
  if (!moved) return { status: 409, body: { error: 'That contractor can no longer be selected.' } };

  return { status: 200, body: { success: true } };
}
