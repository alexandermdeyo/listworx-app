import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function PATCH(request: NextRequest) {
  const authResult = await checkAdminAuth();
  if (!authResult.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { contractorId, action } = await request.json();

    if (!contractorId || !action) {
      return NextResponse.json({ error: 'contractorId and action are required' }, { status: 400 });
    }

    const validActions = ['pause', 'activate', 'remove', 'toggle_emails'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };

    if (action === 'pause') {
      updatePayload.partner_status = 'paused';
    } else if (action === 'activate') {
      updatePayload.partner_status = 'active';
    } else if (action === 'remove') {
      updatePayload.partner_status = 'removed';
      updatePayload.archived = true;
    } else if (action === 'toggle_emails') {
      const { data: current } = await supabase
        .from('contractor_profiles')
        .select('email_notifications_enabled')
        .eq('id', contractorId)
        .single();
      updatePayload.email_notifications_enabled = !current?.email_notifications_enabled;
    }

    const { error } = await supabase
      .from('contractor_profiles')
      .update(updatePayload)
      .eq('id', contractorId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contractor status update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
