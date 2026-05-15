import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function PATCH(request: NextRequest) {
  const authResult = await checkAdminAuth();
  if (!authResult.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { referralId, status } = await request.json();

    if (!referralId || !status) {
      return NextResponse.json({ error: 'referralId and status are required' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'ACCEPTED', 'DECLINED', 'CONTACTED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'CONTACTED') {
      updatePayload.requester_contacted = true;
      updatePayload.requester_contacted_at = new Date().toISOString();
    }

    if (status === 'COMPLETED') {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data: referral, error } = await supabase
      .from('referrals')
      .update(updatePayload)
      .eq('id', referralId)
      .select('contractor_id, job_request_id')
      .single();

    if (error) throw error;

    if (status === 'COMPLETED' && referral?.contractor_id) {
      const { data: current } = await supabase
        .from('contractor_profiles')
        .select('jobs_completed')
        .eq('id', referral.contractor_id)
        .single();
      await supabase
        .from('contractor_profiles')
        .update({ jobs_completed: (current?.jobs_completed || 0) + 1 })
        .eq('id', referral.contractor_id);

      try {
        const jobRequestId = (referral as any).job_request_id;
        if (jobRequestId) {
          const { data: jr } = await supabase
            .from('job_requests')
            .select('id, feedback_token, feedback_requested_at')
            .eq('id', jobRequestId)
            .single();

          if (jr && jr.feedback_token && !jr.feedback_requested_at) {
            const baseUrl =
              process.env.APP_BASE_URL ||
              process.env.NEXT_PUBLIC_BASE_URL ||
              'https://listworx.co';

            await fetch(`${baseUrl}/api/send-feedback-request`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobRequestId: jr.id }),
            }).catch((err) => {
              console.error('Auto-trigger feedback request failed:', err);
            });
          }
        }
      } catch (err) {
        console.error('Auto-trigger feedback error:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update referral error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
