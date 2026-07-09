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

/* ─────────────────────────────────────────────────────────────
   EMAIL HELPERS — called only AFTER all DB writes complete.
   These do NOT modify any referral/matching logic.
   ───────────────────────────────────────────────────────────── */

async function sendContractorReferralEmails(
  supabase: ReturnType<typeof createAdminClient>,
  matchedContractors: Array<{
    id: string;
    company_name: string;
    owner_name: string;
    email: string;
  }>,
  jobData: {
    jobCategory: string;
    jobCounty: string;
    jobState: string;
    jobDescription: string;
    requesterType: string;
  }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const results = await Promise.allSettled(
    matchedContractors.map((contractor) =>
      fetch(`${supabaseUrl}/functions/v1/send-contractor-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          type: 'referral_notification',
          to: contractor.email,
          contractorName: contractor.owner_name,
          companyName: contractor.company_name,
          jobCategory: jobData.jobCategory,
          jobCounty: jobData.jobCounty,
          jobState: jobData.jobState,
          jobDescription: jobData.jobDescription,
          requesterType: jobData.requesterType,
        }),
      })
    )
  );

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[job-request] contractor referral email failed for ${matchedContractors[i]?.id}:`, result.reason);
    }
  });
}

async function sendRequestorMatchEmail(
  supabase: ReturnType<typeof createAdminClient>,
  matchedContractors: Array<{
    id: string;
    company_name: string;
    owner_name: string;
    email: string;
    phone: string;
    website: string | null;
    bio: string | null;
  }>,
  jobData: {
    requesterName: string;
    requesterEmail: string;
    propertyAddress: string;
    categoryNames: string[];
    jobRequestId: string;
  }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://listworx.co';

  // Fetch extra profile data (logo_url, profile_slug, specialties) for contractor cards
  const contractorIds = matchedContractors.map((c) => c.id);

  const [{ data: profileExtras }, { data: categoryRows }] = await Promise.all([
    supabase
      .from('contractor_profiles')
      .select('id, logo_url, profile_slug')
      .in('id', contractorIds),
    supabase
      .from('contractor_categories')
      .select('contractor_id, categories(name)')
      .in('contractor_id', contractorIds),
  ]);

  const logoMap: Record<string, string | null> = {};
  const slugMap: Record<string, string | null> = {};
  (profileExtras || []).forEach((p: any) => {
    logoMap[p.id] = p.logo_url || null;
    slugMap[p.id] = p.profile_slug || null;
  });

  const specialtyMap: Record<string, string[]> = {};
  (categoryRows || []).forEach((row: any) => {
    const cId = row.contractor_id;
    const name = row.categories?.name;
    if (cId && name) {
      if (!specialtyMap[cId]) specialtyMap[cId] = [];
      specialtyMap[cId].push(name);
    }
  });

  const contractorCards = matchedContractors.map((c) => ({
    name: c.owner_name,
    company: c.company_name,
    phone: c.phone,
    email: c.email,
    website: c.website || undefined,
    bio: c.bio || undefined,
    logoUrl: logoMap[c.id] || null,
    profileUrl: slugMap[c.id]
      ? `${BASE_URL}/contractors/${slugMap[c.id]}`
      : `${BASE_URL}/contractors/${c.id}`,
    specialties: specialtyMap[c.id] || [],
  }));

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-realtor-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        type: 'contractor_match',
        to: jobData.requesterEmail,
        realtorName: jobData.requesterName,
        propertyAddress: jobData.propertyAddress,
        services: jobData.categoryNames,
        contractors: contractorCards,
        jobRequestId: jobData.jobRequestId,
        matchedContractors: contractorCards.length,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[job-request] requestor match email failed:', text);
    }
  } catch (err) {
    console.error('[job-request] requestor match email error:', err);
  }
}

/* ─────────────────────────────────────────────────────────────
   MAIN HANDLER
   ───────────────────────────────────────────────────────────── */

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

    const supabase = createAdminClient();

    // The public request form allows anonymous submission — no account required.
    // For logged-in users, the profile table to check depends on role: REALTORs
    // are stored in realtor_profiles, HOMEOWNER/PROPERTY_MANAGER in requestor_profiles.
    // requestor_profiles is the only one with a matching FK column on job_requests
    // (requestor_profile_id), so that's the only lookup result we store. A missing
    // profile never blocks submission — the form fields are used directly either way.
    let requestorProfileId: string | null = null;

    if (user) {
      const { data: appUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = String(appUser?.role || '').toUpperCase();

      if (role === 'HOMEOWNER' || role === 'PROPERTY_MANAGER') {
        const { data: requestorProfile, error: requestorProfileError } = await supabase
          .from('requestor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (requestorProfileError) {
          console.error('[job-request] requestor profile lookup failed:', requestorProfileError);
        }

        requestorProfileId = requestorProfile?.id ?? null;
      } else if (role === 'REALTOR') {
        const { error: realtorProfileError } = await supabase
          .from('realtor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (realtorProfileError) {
          console.error('[job-request] realtor profile lookup failed:', realtorProfileError);
        }
      }
    }

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

    // ── MATCHING LOGIC — untouched ──────────────────────────
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
    // ── END MATCHING LOGIC ──────────────────────────────────

    // ── EMAIL NOTIFICATIONS — fired after all DB writes ────
    // Fetch category names for email display
    const { data: categoryNameRows } = await supabase
      .from('categories')
      .select('name')
      .in('id', categoryIds);

    const categoryNames = (categoryNameRows || []).map((r: any) => r.name).filter(Boolean);

    if (matchedContractors.length > 0) {
      // 1. Notify each contractor they've been referred (no requestor info)
      sendContractorReferralEmails(supabase, matchedContractors, {
        jobCategory: categoryNames[0] || 'General Services',
        jobCounty: propertyCounty,
        jobState: stateCode,
        jobDescription: description.trim(),
        requesterType: clientType,
      }).catch((err) => console.error('[job-request] contractor email batch error:', err));

      // 2. Send requestor their matched contractor cards
      sendRequestorMatchEmail(supabase, matchedContractors, {
        requesterName: clientName.trim(),
        requesterEmail: clientEmail.trim().toLowerCase(),
        propertyAddress: `${propertyAddressLine1.trim()}, ${propertyCity.trim()}, ${stateCode}`,
        categoryNames,
        jobRequestId: jobRequest.id,
      }).catch((err) => console.error('[job-request] requestor email error:', err));
    }
    // ── END EMAIL NOTIFICATIONS ─────────────────────────────

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
