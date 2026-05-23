import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  try {
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
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the user's role so the dashboard can render role-specific sections.
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const userRole: string | null = userData?.role ?? null;

    // If the user is a REALTOR, fetch their Listing Studio profile.
    let realtorProfile: Record<string, any> | null = null;
    if (userRole === 'REALTOR') {
      const { data: rp } = await supabase
        .from('realtor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      realtorProfile = rp ?? null;
    }

    const { data: requestorProfile, error: requestorProfileError } = await supabase
      .from('requestor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (requestorProfileError) {
      return NextResponse.json(
        { error: requestorProfileError.message || 'Failed to load requestor profile.' },
        { status: 500 }
      );
    }

    if (!requestorProfile?.id) {
      return NextResponse.json({
        success: true,
        userRole,
        realtorProfile,
        requests: [],
        referrals: [],
      });
    }

    const { data: requestsData, error: requestsError } = await supabase
      .from('job_requests')
      .select('*')
      .eq('requestor_profile_id', requestorProfile.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      return NextResponse.json(
        { error: requestsError.message || 'Failed to load requests.' },
        { status: 500 }
      );
    }

    const requests = requestsData || [];
    const requestIds = requests.map((r: any) => r.id);

    if (requestIds.length === 0) {
      return NextResponse.json({
        success: true,
        userRole,
        realtorProfile,
        requests,
        referrals: [],
      });
    }

    const { data: referralsData, error: referralsError } = await supabase
      .from('referrals')
      .select('id, job_request_id, contractor_id, status, notes, created_at')
      .in('job_request_id', requestIds)
      .order('created_at', { ascending: true });

    if (referralsError) {
      return NextResponse.json(
        { error: referralsError.message || 'Failed to load referrals.' },
        { status: 500 }
      );
    }

    const referrals = referralsData || [];
    const contractorIds = Array.from(
      new Set(referrals.map((r: any) => r.contractor_id).filter(Boolean))
    );

    let contractorMap: Record<string, any> = {};

    if (contractorIds.length > 0) {
      const { data: contractorProfiles, error: contractorProfilesError } = await supabase
        .from('contractor_profiles')
        .select(
          'id, company_name, owner_name, email, phone, website, bio, service_area_state, service_area_counties, ironclad_accepted'
        )
        .in('id', contractorIds);

      if (contractorProfilesError) {
        return NextResponse.json(
          { error: contractorProfilesError.message || 'Failed to load contractor profiles.' },
          { status: 500 }
        );
      }

      contractorMap = Object.fromEntries(
        (contractorProfiles || []).map((profile: any) => [profile.id, profile])
      );
    }

    const hydratedReferrals = referrals.map((referral: any) => ({
      ...referral,
      contractor: contractorMap[referral.contractor_id] || null,
    }));

    return NextResponse.json({
      success: true,
      userRole,
      realtorProfile,
      requests,
      referrals: hydratedReferrals,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
