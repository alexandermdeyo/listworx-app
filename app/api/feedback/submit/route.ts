import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      token,
      rating,
      qualityRating,
      communicationRating,
      timelinessRating,
      professionalismRating,
      wouldRecommend,
      comments,
    } = body;

    if (!token || !rating) {
      return NextResponse.json(
        { error: 'Token and rating are required' },
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
        { error: 'Feedback already submitted' },
        { status: 400 }
      );
    }

    const { data: jobRequest } = await supabase
      .from('job_requests')
      .select(`
        id,
        referrals!inner(
          contractor_id
        )
      `)
      .eq('feedback_token', token)
      .maybeSingle();

    if (!jobRequest) {
      return NextResponse.json(
        { error: 'Invalid feedback token' },
        { status: 404 }
      );
    }

    const contractorId = (jobRequest.referrals as any)[0]?.contractor_id;

    if (!contractorId) {
      return NextResponse.json(
        { error: 'No contractor found for this job' },
        { status: 404 }
      );
    }

    const { error: insertError } = await supabase
      .from('job_feedback')
      .insert({
        job_request_id: jobRequest.id,
        contractor_id: contractorId,
        feedback_token: token,
        rating,
        quality_rating: qualityRating || null,
        communication_rating: communicationRating || null,
        timeliness_rating: timelinessRating || null,
        professionalism_rating: professionalismRating || null,
        would_recommend: wouldRecommend,
        comments: comments || null,
      });

    if (insertError) {
      console.error('Feedback insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
