import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

// ── PATCH — toggle show_on_profile for a listing ─────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const { data: userRecord } = await admin
      .from('users').select('role').eq('id', session.user.id).maybeSingle();

    if (userRecord?.role !== 'REALTOR') {
      return NextResponse.json({ error: 'Only available for realtors' }, { status: 403 });
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const { listingId, show_on_profile } = await request.json() as {
      listingId: string;
      show_on_profile: boolean;
    };

    if (!listingId || typeof show_on_profile !== 'boolean') {
      return NextResponse.json(
        { error: 'listingId and show_on_profile (boolean) are required' },
        { status: 400 }
      );
    }

    // ── Update (ownership enforced by user_id check) ──────────────────────────
    const { error } = await admin
      .from('listings')
      .update({ show_on_profile })
      .eq('id', listingId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('[listings/show-on-profile] PATCH error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[listings/show-on-profile] PATCH exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
