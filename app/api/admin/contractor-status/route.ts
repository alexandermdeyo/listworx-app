import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getCallerRole(): Promise<{ userId: string; role: string } | null> {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return { userId: user.id, role: String(data?.role || '').toUpperCase() };
  } catch {
    return null;
  }
}

export async function PATCH(request: NextRequest) {
  const caller = await getCallerRole();
  if (!caller || caller.role !== 'ADMIN') {
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

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };

    if (action === 'pause') {
      updatePayload.partner_status = 'paused';
    } else if (action === 'activate') {
      updatePayload.partner_status = 'active';
    } else if (action === 'remove') {
      updatePayload.partner_status = 'removed';
      updatePayload.archived = true;
    } else if (action === 'toggle_emails') {
      const { data: current } = await supabaseAdmin
        .from('contractor_profiles')
        .select('email_notifications_enabled')
        .eq('id', contractorId)
        .single();
      updatePayload.email_notifications_enabled = !current?.email_notifications_enabled;
    }

    const { error } = await supabaseAdmin
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
