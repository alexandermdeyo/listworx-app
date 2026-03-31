import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existingFeedback } = await supabase
      .from('job_feedback')
      .select('id')
      .eq('feedback_token', token)
      .maybeSingle();

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Feedback already submitted for this job' },
        { status: 400 }
      );
    }

    const { data: jobRequest } = await supabase
      .from('job_requests')
      .select(`
        id,
        requester_name,
        property_address,
        property_city,
        property_state,
        property_zip,
        created_at,
        referrals!inner(
          contractor_id,
          contractor_profiles(
            id,
            company_name,
            owner_name
          )
        )
      `)
      .eq('feedback_token', token)
      .maybeSingle();

    if (!jobRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired feedback link' },
        { status: 404 }
      );
    }

    const contractor = (jobRequest.referrals as any)[0]?.contractor_profiles;

    return NextResponse.json({
      jobRequest: {
        id: jobRequest.id,
        requesterName: jobRequest.requester_name,
        propertyAddress: `${jobRequest.property_address}, ${jobRequest.property_city}, ${jobRequest.property_state} ${jobRequest.property_zip}`,
        createdAt: jobRequest.created_at,
      },
      contractor: contractor ? {
        id: contractor.id,
        company_name: contractor.company_name,
        owner_name: contractor.owner_name,
      } : null,
    });
  } catch (error) {
    console.error('Feedback validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
