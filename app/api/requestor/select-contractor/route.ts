import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referralId } = await request.json();

    if (!referralId) {
      return NextResponse.json({ error: 'referralId is required.' }, { status: 400 });
    }

    const { data: referral } = await supabase
      .from('referrals')
      .select('id, job_request_id')
      .eq('id', referralId)
      .maybeSingle();

    if (!referral?.job_request_id) {
      return NextResponse.json({ error: 'Referral not found.' }, { status: 404 });
    }

    const { data: jobRequest } = await supabase
      .from('job_requests')
      .select('id, realtor_id')
      .eq('id', referral.job_request_id)
      .maybeSingle();

    if (!jobRequest || jobRequest.realtor_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await supabase
      .from('referrals')
      .update({ status: 'PENDING', updated_at: new Date().toISOString() })
      .eq('job_request_id', referral.job_request_id);

    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'CONTACTED',
        requester_contacted: true,
        requester_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', referralId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase
      .from('job_requests')
      .update({
        status: 'ASSIGNED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', referral.job_request_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to select contractor.' },
      { status: 500 }
    );
  }
}
