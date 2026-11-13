import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { findMatchedContractors } from '@/lib/contractor-matching';
import {
  recordReferrals,
  sendContractorReferralEmails,
  sendRequestorMatchEmail,
} from '@/lib/server/referral-delivery';

export const dynamic = 'force-dynamic';

/**
 * Admin releases a request that was held as suspected spam (owner rule
 * 2026-11-12). Only now are contractors matched, recorded as referrals and
 * delivered (requestor email), using the same matching and referral rules as
 * the public form. Releasing twice does nothing the second time.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let jobRequestId = '';
  try {
    jobRequestId = String((await request.json())?.jobRequestId || '');
  } catch {
    /* fall through */
  }
  if (!jobRequestId) return NextResponse.json({ error: 'jobRequestId is required' }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  // Claim the release atomically: only a held request flips to released, once.
  const { data: claimed, error: claimError } = await supabase
    .from('job_requests')
    .update({ flagged_spam: false, updated_at: new Date().toISOString() })
    .eq('id', jobRequestId)
    .eq('flagged_spam', true)
    .select('id, county_id, requester_name, requester_email, property_address, property_city, state_code')
    .maybeSingle();

  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 });
  if (!claimed) {
    return NextResponse.json({ error: 'This request is not held for review (already released or never held).' }, { status: 409 });
  }

  const { data: categoryRows } = await supabase
    .from('job_request_categories')
    .select('category_id, categories(name)')
    .eq('job_request_id', jobRequestId);
  const categoryIds = (categoryRows || []).map((r: any) => r.category_id).filter(Boolean);
  const categoryNames = (categoryRows || []).map((r: any) => r.categories?.name).filter(Boolean);

  const matched = claimed.county_id && categoryIds.length
    ? await findMatchedContractors(supabase as any, { countyId: claimed.county_id, categoryIds, jobRequestId })
    : [];

  // Requests held under the old rules may already have referrals; never refer
  // (or count) the same contractor twice for one request.
  const { data: existing } = await supabase.from('referrals').select('contractor_id').eq('job_request_id', jobRequestId);
  const alreadyReferred = new Set((existing || []).map((r: any) => r.contractor_id));
  const toRefer = matched.filter((c) => !alreadyReferred.has(c.id));

  const { delivered, failed } = await recordReferrals(supabase, jobRequestId, toRefer);

  let requestorEmailSent = false;
  if (delivered.length > 0) {
    const [, sent] = await Promise.all([
      sendContractorReferralEmails(supabase, delivered).catch((err) => {
        console.error('[release] contractor email batch error:', err);
        return [];
      }),
      sendRequestorMatchEmail(supabase, delivered, {
        requesterName: claimed.requester_name || '',
        requesterEmail: String(claimed.requester_email || '').toLowerCase(),
        propertyAddress: [claimed.property_address, claimed.property_city, claimed.state_code].filter(Boolean).join(', '),
        categoryNames,
        jobRequestId,
      }).catch(() => false),
    ]);
    requestorEmailSent = Boolean(sent);
  }

  return NextResponse.json({
    success: true,
    referred: delivered.length,
    alreadyReferred: alreadyReferred.size,
    referralRecordingFailed: failed,
    requestorEmailSent,
  });
}
