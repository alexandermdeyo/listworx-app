import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findMatchedContractors, buildReferralRows, incrementReferralCounts } from '@/lib/contractor-matching';

export async function POST(request: NextRequest) {
  try {
    const { jobRequestId } = await request.json();

    if (!jobRequestId) {
      return NextResponse.json(
        { error: 'jobRequestId is required.' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: jobRequest, error: jobRequestError } = await supabase
      .from('job_requests')
      .select('id, county_id')
      .eq('id', jobRequestId)
      .maybeSingle();

    if (jobRequestError || !jobRequest) {
      return NextResponse.json(
        { error: 'Job request not found.' },
        { status: 404 }
      );
    }

    const { data: jobRequestCategories, error: categoriesError } = await supabase
      .from('job_request_categories')
      .select('category_id')
      .eq('job_request_id', jobRequestId);

    if (categoriesError) {
      return NextResponse.json(
        { error: categoriesError.message },
        { status: 500 }
      );
    }

    const categoryIds = (jobRequestCategories || [])
      .map((row: any) => row.category_id)
      .filter(Boolean);

    if (categoryIds.length === 0 || !jobRequest.county_id) {
      return NextResponse.json({
        success: true,
        contractors: [],
      });
    }

    const { data: existingContacted } = await supabase
      .from('referrals')
      .select('id')
      .eq('job_request_id', jobRequestId)
      .eq('status', 'CONTACTED')
      .limit(1);

    if (existingContacted && existingContacted.length > 0) {
      return NextResponse.json(
        { error: 'A contractor has already been selected for this request.' },
        { status: 409 }
      );
    }

    const matchedContractors = await findMatchedContractors(supabase, {
      countyId: jobRequest.county_id,
      categoryIds,
      jobRequestId,
    });

    const { error: deleteOldReferralsError } = await supabase
      .from('referrals')
      .delete()
      .eq('job_request_id', jobRequestId);

    if (deleteOldReferralsError) {
      return NextResponse.json(
        { error: deleteOldReferralsError.message },
        { status: 500 }
      );
    }

    if (matchedContractors.length > 0) {
      const referralRows = buildReferralRows(jobRequestId, matchedContractors);

      const { error: insertReferralsError } = await supabase
        .from('referrals')
        .insert(referralRows);

      if (insertReferralsError) {
        return NextResponse.json(
          { error: insertReferralsError.message },
          { status: 500 }
        );
      }

      const { error: updateJobStatusError } = await supabase
        .from('job_requests')
        .update({
          status: 'ASSIGNED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobRequestId);

      if (updateJobStatusError) {
        return NextResponse.json(
          { error: updateJobStatusError.message },
          { status: 500 }
        );
      }

      await incrementReferralCounts(
        supabase,
        matchedContractors.map((c) => c.id)
      );
    }

    return NextResponse.json({
      success: true,
      contractors: matchedContractors,
    });
  } catch (error: any) {
    console.error('SELECT CONTRACTORS ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to match contractors.' },
      { status: 500 }
    );
  }
}
