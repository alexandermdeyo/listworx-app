import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { PUBLIC_BUCKET, reconcilePublicCopy, secureOriginal } from '@/lib/photos/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/photos/secure-older
 * For library photos uploaded before private storage existed (original in the public
 * bucket): copy each original into private storage (fingerprint checked), then apply
 * the normal rule — only approved photos stay public, unless a published article uses
 * them. Originals are never deleted; it is safe to run more than once.
 */
export async function POST(request: NextRequest) {
  const adminId = await requireAdminRequest(request);
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from('photo_assets').select('*').eq('storage_bucket', PUBLIC_BUCKET);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results: { id: string; file: string; result: string }[] = [];
  for (const a of (data || []) as any[]) {
    try {
      await secureOriginal(supabase, a, adminId);
      const copy = await reconcilePublicCopy(supabase, a.id, adminId);
      results.push({ id: a.id, file: a.original_filename, result: `original secured; public copy ${copy.outcome}` });
    } catch (e: any) {
      results.push({ id: a.id, file: a.original_filename, result: `error: ${e.message}` });
    }
  }
  return NextResponse.json({ results });
}
