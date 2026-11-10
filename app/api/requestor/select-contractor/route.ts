import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { selectContractor, SELECTABLE_REFERRAL_STATUSES, type SelectionDeps } from '@/lib/server/contractor-selection';

/**
 * A requester (homeowner, property manager, or realtor) marks which of their
 * matched contractors they chose. Authorization rules live in
 * lib/server/contractor-selection.ts.
 *
 * Identity comes from supabase.auth.getUser(), which verifies the session with
 * Supabase Auth (getSession() only reads the cookie). Reads and writes then use
 * the service-role client, because RLS on referrals only lets contractors and
 * admins update rows; every write happens only after the ownership check passes.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const admin = createSupabaseAdminClient();

    const deps: SelectionDeps = {
      async getUser() {
        const { data, error } = await createClient().auth.getUser();
        if (error || !data.user) return null;
        return {
          id: data.user.id,
          email: data.user.email?.toLowerCase() || null,
          emailVerified: Boolean(data.user.email_confirmed_at),
        };
      },
      async getUserRole(userId) {
        const { data } = await admin.from('users').select('role').eq('id', userId).maybeSingle();
        return (data?.role as string) ?? null;
      },
      async getReferral(referralId) {
        const { data } = await admin
          .from('referrals')
          .select('id, job_request_id, contractor_id, status')
          .eq('id', referralId)
          .maybeSingle();
        return data ?? null;
      },
      async getJobRequest(jobRequestId) {
        const { data } = await admin
          .from('job_requests')
          .select('id, requestor_profile_id, requester_email, status')
          .eq('id', jobRequestId)
          .maybeSingle();
        return data ?? null;
      },
      async getRequestorProfileUserId(profileId) {
        const { data } = await admin.from('requestor_profiles').select('user_id').eq('id', profileId).maybeSingle();
        return (data?.user_id as string) ?? null;
      },
      async listReferrals(jobRequestId) {
        const { data } = await admin
          .from('referrals')
          .select('id, job_request_id, contractor_id, status')
          .eq('job_request_id', jobRequestId);
        return data || [];
      },
      async markSelected({ jobRequestId, referralId, now }) {
        // Conditional update: only moves a referral that is still selectable.
        const { data: moved, error } = await admin
          .from('referrals')
          .update({ status: 'CONTACTED', contacted_at: now, updated_at: now })
          .eq('id', referralId)
          .eq('job_request_id', jobRequestId)
          .in('status', SELECTABLE_REFERRAL_STATUSES)
          .select('id');
        if (error) throw error;
        if (!moved || moved.length === 0) return false;

        const { error: jobError } = await admin
          .from('job_requests')
          .update({ status: 'ASSIGNED', updated_at: now })
          .eq('id', jobRequestId)
          .in('status', ['PENDING', 'ASSIGNED']);
        if (jobError) throw jobError;
        return true;
      },
    };

    const result = await selectContractor(body, deps);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('[requestor/select-contractor] failed:', error);
    return NextResponse.json({ error: 'Failed to select contractor.' }, { status: 500 });
  }
}
