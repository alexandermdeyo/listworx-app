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

// ── POST — create a showcase post ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthedRealtor();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { user, admin } = auth;

    const { image_url, caption, display_order, media_type } = await request.json() as {
      image_url: string;
      caption?: string;
      display_order?: number;
      media_type?: string;
    };

    if (!image_url) return NextResponse.json({ error: 'image_url is required' }, { status: 400 });

    const { data, error } = await admin
      .from('realtor_showcase_posts')
      .insert({
        user_id:       user.id,
        image_url,
        caption:       caption       ?? null,
        display_order: display_order ?? 0,
        media_type:    media_type    ?? 'image',
      })
      .select()
      .single();

    if (error) {
      console.error('[showcase] POST insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err: any) {
    console.error('[showcase] POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
