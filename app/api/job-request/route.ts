import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import {
  findMatchedContractors,
  buildReferralRows,
  buildJobAssignmentRows,
  incrementReferralCounts,
} from '@/lib/contractor-matching';

export const dynamic = 'force-dynamic';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizeUrgency(value: string | null | undefined) {
  const normalized = String(value || '').trim().toUpperCase();

  if (normalized === 'ASAP' || normalized === 'IMMEDIATE') return 'IMMEDIATE';
  if (normalized === 'URGENT' || normalized === 'WITHIN_WEEK') return 'WITHIN_WEEK';
  if (normalized === 'STANDARD' || normalized === 'WITHIN_MONTH') return 'WITHIN_MONTH';
  if (normalized === 'FLEXIBLE') return 'FLEXIBLE';

  return 'WITHIN_MONTH';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientName,
      clientEmail,
      clientPhone,
      clientType,
      propertyAddressLine1,
      propertyCity,
      propertyStateCode,
      propertyCountyId,
      propertyZip,
      urgencyLevel,
      description,
      categoryIds,
    } = body;

    if (
      !clientName ||
      !clientEmail ||
      !clientType ||
      !propertyAddressLine1 ||
      !propertyCity ||
      !propertyStateCode ||
      !propertyCountyId ||
      !description ||
      !Array.isArray(categoryIds) ||
      categoryIds.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to submit a request.' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    const { data: requestorProfile, error: requestorProfileError } = await supabase
      .from('requestor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (requestorProfileError) {
      console.error('[job-request] requestor profile lookup failed:', requestorProfileError);
      return NextResponse.json(
        { error: requestorProfileError.message || 'Failed to load requestor profile.' },
        { status: 500 }
      );
    }

    if (!requestorProfile?.id) {
      return NextResponse.json(
        { error: 'No requestor profile found for this account.' },
        { status: 400 }
      );
    }

    const requestorProfileId = requestorProfile.id;

    const { data: countyRow, error: countyError } = await supabase
      .from('counties')
      .select('id, name, state_code')
      .eq('id', propertyCountyId)
      .maybeSingle();

    if (countyError) {
      console.error('[job-request] county lookup failed:', countyError);
      return NextResponse.json(
        { error: countyError.message || 'Failed to load county information.' },
        { status: 500 }
      );
    }

    const propertyCounty = countyRow?.name || '';
    const stateCode = countyRow?.state_code || propertyStateCode;
    const normalizedUrgency = normalizeUrgency(urgencyLevel);

    const { data: jobRequest, error: jobRequestError } = await supabase
      .from('job_requests')
      .insert({
        requestor_profile_id: requestorProfileId,
        requester_name: clientName.trim(),
        requester_email: clientEmail.trim().toLowerCase(),
        requester_phone: clientPhone?.trim() || '',
        requester_type: clientType,
        property_address: propertyAddressLine1.trim(),
        property_city: propertyCity.trim(),
        property_state: stateCode,
        property_county: propertyCounty,
        property_zip: propertyZip?.trim() || '',
        state_code: stateCode,
        county_id: propertyCountyId,
        job_description: description.trim(),
        urgency: normalizedUrgency,
        status: 'PENDING',
      })
      .select()
      .single();

    if (jobRequestError || !jobRequest) {
      console.error('[job-request] insert failed:', jobRequestError);
      return NextResponse.json(
        { error: jobRequestError?.message || 'Failed to create request.' },
        { status: 500 }
      );
    }

    const categoryRows = categoryIds.map((categoryId: string) => ({
      job_request_id: jobRequest.id,
      category_id: categoryId,
    }));

    const { error: categoryLinkError } = await supabase
      .from('job_request_categories')
      .insert(categoryRows);

    if (categoryLinkError) {
      console.error('[job-request] category link failed:', categoryLinkError);
    }

    const matchedContractors = await findMatchedContractors(supabase, {
      countyId: propertyCountyId,
      categoryIds,
      jobRequestId: jobRequest.id,
    });

    let insertedReferrals: { id: string; contractor_id: string }[] = [];

    if (matchedContractors.length > 0) {
      const referralRows = buildReferralRows(jobRequest.id, matchedContractors);

      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .insert(referralRows)
        .select('id, contractor_id');

      if (referralError) {
        console.error('[job-request] referral insert failed:', referralError);
      } else {
        insertedReferrals = referralData || [];
      }

      const assignmentRows = buildJobAssignmentRows(
        jobRequest.id,
        matchedContractors,
        insertedReferrals
      );

      const { error: assignmentError } = await supabase
        .from('job_assignments')
        .insert(assignmentRows);

      if (assignmentError) {
        console.error('[job-request] job assignment insert failed:', assignmentError);
      }

      await incrementReferralCounts(
        supabase,
        matchedContractors.map((c) => c.id)
      );
    }

    return NextResponse.json({
      success: true,
      jobRequestId: jobRequest.id,
      contractors: matchedContractors,
      noMatches: matchedContractors.length === 0,
    });
  } catch (error: any) {
    console.error('[job-request] unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}