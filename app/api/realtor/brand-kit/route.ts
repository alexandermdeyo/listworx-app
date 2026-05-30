import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

// ── Auth + REALTOR role guard ─────────────────────────────────────────────────

async function getAuthedRealtor() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return { user: null, admin: null, error: 'Unauthorized', status: 401 } as const;

  const admin = createSupabaseAdminClient();
  const { data: userRecord } = await admin
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (userRecord?.role !== 'REALTOR') {
    return { user: null, admin: null, error: 'Only available for realtors', status: 403 } as const;
  }

  return { user: session.user, admin, error: null, status: 200 } as const;
}

// ── GET — fetch brand kit + listings + showcase posts ────────────────────────

export async function GET() {
  try {
    const auth = await getAuthedRealtor();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { user, admin } = auth;

    const [brandKitRes, listingsRes, showcaseRes] = await Promise.all([
      admin
        .from('realtor_brand_kits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      admin
        .from('listings')
        .select('id, address, city, state, zip, price, show_on_profile, listing_photos(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      admin
        .from('realtor_showcase_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true }),
    ]);

    return NextResponse.json({
      brandKit: brandKitRes.data ?? null,
      listings:  listingsRes.data  ?? [],
      showcase:  showcaseRes.data  ?? [],
    });
  } catch (err: any) {
    console.error('[brand-kit] GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// ── POST — upsert brand kit ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthedRealtor();
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { user, admin } = auth;

    const body = await request.json();

    const { error } = await admin
      .from('realtor_brand_kits')
      .upsert(
        {
          user_id:            user.id,
          display_name:       body.display_name       ?? null,
          job_title:          body.job_title          ?? null,
          brokerage_name:     body.brokerage_name     ?? null,
          license_number:     body.license_number     ?? null,
          phone:              body.phone              ?? null,
          email:              body.email              ?? null,
          website:            body.website            ?? null,
          headshot_url:       body.headshot_url       ?? null,
          cover_photo_url:    body.cover_photo_url    ?? null,
          personal_logo_url:  body.personal_logo_url  ?? null,
          brokerage_logo_url: body.brokerage_logo_url ?? null,
          primary_color:      body.primary_color      ?? '#E8621A',
          instagram_handle:   body.instagram_handle   ?? null,
          facebook_url:       body.facebook_url       ?? null,
          linkedin_url:       body.linkedin_url       ?? null,
          bio:                body.bio                ?? null,
          preferred_cta:      body.preferred_cta      ?? null,
          disclaimer_text:    body.disclaimer_text    ?? null,
          updated_at:         new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('[brand-kit] POST upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[brand-kit] POST error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
