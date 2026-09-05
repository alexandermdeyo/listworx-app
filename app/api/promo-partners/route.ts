import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const PUBLIC_COLUMNS = 'id, name, logo_url, link_url, is_featured, display_order';
const ADMIN_COLUMNS =
  'id, name, logo_url, link_url, is_visible, is_featured, display_order, created_at, updated_at';

/**
 * Confirms the caller is an admin via the `Authorization: Bearer <access_token>`
 * header (same pattern as /api/admin/site-content). Returns the admin client on
 * success, or null.
 */
async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;

  const supabase = createSupabaseAdminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profile?.role !== 'ADMIN') return null;
  return supabase;
}

// GET /api/promo-partners            → visible partners, ordered for display
// GET /api/promo-partners?all=true   → every partner (admin manager); requires admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    if (all) {
      const supabase = await requireAdmin(request);
      if (!supabase) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const { data, error } = await supabase
        .from('promo_partners')
        .select(ADMIN_COLUMNS)
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return NextResponse.json({ partners: data || [] });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('promo_partners')
      .select(PUBLIC_COLUMNS)
      .eq('is_visible', true)
      .not('logo_url', 'is', null)
      .neq('logo_url', '')
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ partners: data || [] });
  } catch {
    // Fail closed — the homepage section renders nothing on an empty list.
    return NextResponse.json({ partners: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const name = (body.name || '').trim();
  const logo_url = (body.logo_url || '').trim();
  if (!name || !logo_url) {
    return NextResponse.json({ error: 'name and logo_url are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('promo_partners')
    .insert({
      name,
      logo_url,
      link_url: (body.link_url || '').trim() || null,
      is_visible: Boolean(body.is_visible),
      is_featured: Boolean(body.is_featured),
      display_order: Number.isFinite(body.display_order) ? Math.trunc(body.display_order) : 0,
    })
    .select(ADMIN_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, ...raw } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof raw.name === 'string') updates.name = raw.name.trim();
  if (typeof raw.logo_url === 'string') updates.logo_url = raw.logo_url.trim();
  if ('link_url' in raw) updates.link_url = (raw.link_url || '').trim() || null;
  if ('is_visible' in raw) updates.is_visible = Boolean(raw.is_visible);
  if ('is_featured' in raw) updates.is_featured = Boolean(raw.is_featured);
  if ('display_order' in raw && Number.isFinite(raw.display_order)) {
    updates.display_order = Math.trunc(raw.display_order);
  }

  const { data, error } = await supabase
    .from('promo_partners')
    .update(updates)
    .eq('id', id)
    .select(ADMIN_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase.from('promo_partners').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
