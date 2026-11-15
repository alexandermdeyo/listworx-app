import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/photos/check { sha256 } — is this exact file already in the library?
 * Called by the uploader BEFORE sending the file, so duplicates are never stored twice.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const sha = typeof body?.sha256 === 'string' ? body.sha256.toLowerCase() : '';
  if (!/^[0-9a-f]{64}$/.test(sha)) return NextResponse.json({ error: 'sha256 is required' }, { status: 400 });
  const { data, error } = await createSupabaseAdminClient()
    .from('photo_assets')
    .select('id, original_filename, status, archived, public_url')
    .eq('sha256', sha)
    .limit(5);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ duplicates: data || [] });
}
