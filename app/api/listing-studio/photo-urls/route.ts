import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

// Signed URL expiry in seconds (1 hour)
const SIGNED_URL_EXPIRY = 3600;

export async function POST(request: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const admin = createSupabaseAdminClient();

    // ── Role check ──────────────────────────────────────────────────────────
    const { data: userRecord } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (userRecord?.role !== 'REALTOR') {
      return NextResponse.json(
        { error: 'Listing Studio is only available for realtors' },
        { status: 403 }
      );
    }

    // ── Parse body ──────────────────────────────────────────────────────────
    const { paths } = await request.json() as { paths: string[] };

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ urls: [] });
    }

    // Security: verify all paths belong to this user (paths are prefixed with user.id/)
    for (const path of paths) {
      if (!path.startsWith(`${user.id}/`)) {
        return NextResponse.json(
          { error: 'Unauthorized: path does not belong to this user' },
          { status: 403 }
        );
      }
    }

    // ── Generate signed URLs ────────────────────────────────────────────────
    const { data, error } = await admin.storage
      .from('listing-photos')
      .createSignedUrls(paths, SIGNED_URL_EXPIRY);

    if (error) {
      console.error('[photo-urls] createSignedUrls error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ urls: data });
  } catch (error: any) {
    console.error('[photo-urls] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
