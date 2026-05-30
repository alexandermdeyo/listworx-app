import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

// Accepted field names and their storage sub-paths
const FIELD_PATHS: Record<string, string> = {
  headshot:       'brand',
  cover:          'brand',
  personal_logo:  'brand',
  brokerage_logo: 'brand',
  showcase:       'showcase',
};

export async function POST(request: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const admin = createSupabaseAdminClient();

    // ── Role check ────────────────────────────────────────────────────────────
    const { data: userRecord } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (userRecord?.role !== 'REALTOR') {
      return NextResponse.json({ error: 'Only available for realtors' }, { status: 403 });
    }

    // ── Parse form data ───────────────────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const field = formData.get('field') as string | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!field || !(field in FIELD_PATHS)) {
      return NextResponse.json({ error: 'Invalid field name' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not supported. Use JPG, PNG, WebP, or HEIC.` },
        { status: 400 }
      );
    }

    // ── Upload to logos bucket ────────────────────────────────────────────────
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const storagePath = `${user.id}/${FIELD_PATHS[field]}/${uniqueName}`;

    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await admin.storage
      .from('logos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[brand-kit/upload] Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Return public URL (logos bucket must be public in Supabase dashboard)
    const { data: { publicUrl } } = admin.storage
      .from('logos')
      .getPublicUrl(storagePath);

    console.log(`[brand-kit/upload] Uploaded ${field} for user=${user.id} → ${storagePath}`);

    return NextResponse.json({ url: publicUrl, path: storagePath });
  } catch (err: any) {
    console.error('[brand-kit/upload] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
