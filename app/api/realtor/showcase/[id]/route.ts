import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

async function getAuthedRealtor() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { user: null, admin: null, error: 'Unauthorized', status: 401 } as const;

  const admin = createSupabaseAdminClient();
  const { data: userRecord } = await admin
    .from('users').select('role').eq('id', session.user.id).maybeSingle();

  if (userRecord?.role !== 'REALTOR') {
    return { user: null, admin: null, error: 'Only available for realtors', status: 403 } as const;
  }

  return { user: session.user, admin, error: null, status: 200 } as const;
}

// ── PATCH — update caption or display_order ───────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthedRealtor();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { user, admin } = auth;

    const body = await request.json() as { caption?: string; display_order?: number };

    const updates: Record<string, any> = {};
    if (body.caption      !== undefined) updates.caption       = body.caption;
    if (body.display_order !== undefined) updates.display_order = body.display_order;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await admin
      .from('realtor_showcase_posts')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id); // ownership check

    if (error) {
      console.error('[showcase/:id] PATCH error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[showcase/:id] PATCH exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE — remove a showcase post ──────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthedRealtor();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { user, admin } = auth;

    const { error } = await admin
      .from('realtor_showcase_posts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id); // ownership check

    if (error) {
      console.error('[showcase/:id] DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[showcase/:id] DELETE exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
