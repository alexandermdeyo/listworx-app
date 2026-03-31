import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { jobRequestId } = await request.json();

    if (!jobRequestId) {
      return NextResponse.json(
        { error: 'Job request ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: jobRequest } = await supabase
      .from('job_requests')
      .select(`
        id,
        requester_name,
        requester_email,
        property_address,
        property_city,
        property_state,
        property_zip,
        feedback_token,
        feedback_requested_at,
        referrals!inner(
          contractor_id,
          contractor_profiles(
            company_name,
            owner_name
          )
        )
      `)
      .eq('id', jobRequestId)
      .maybeSingle();

    if (!jobRequest) {
      return NextResponse.json(
        { error: 'Job request not found' },
        { status: 404 }
      );
    }

    if (jobRequest.feedback_requested_at) {
      return NextResponse.json(
        { error: 'Feedback already requested for this job' },
        { status: 400 }
      );
    }

    if (!jobRequest.feedback_token) {
      return NextResponse.json(
        { error: 'No feedback token found for this job' },
        { status: 400 }
      );
    }

    const contractor = (jobRequest.referrals as any)[0]?.contractor_profiles;

    if (!contractor) {
      return NextResponse.json(
        { error: 'No contractor found for this job' },
        { status: 404 }
      );
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-realtor-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'quality_assurance',
          to: jobRequest.requester_email,
          realtorName: jobRequest.requester_name,
          propertyAddress: `${jobRequest.property_address}, ${jobRequest.property_city}, ${jobRequest.property_state} ${jobRequest.property_zip}`,
          companyName: contractor.company_name,
          contractorName: contractor.owner_name,
          feedbackToken: jobRequest.feedback_token,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Email send failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to send feedback request email' },
        { status: 500 }
      );
    }

    await supabase
      .from('job_requests')
      .update({
        feedback_requested_at: new Date().toISOString(),
      })
      .eq('id', jobRequestId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
