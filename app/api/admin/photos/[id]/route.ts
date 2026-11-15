import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { cleanPhotoInput } from '@/lib/photos/library';
import { PHOTO_COLUMNS, loadLibrary, reconcilePublicCopy } from '@/lib/photos/server';

export const dynamic = 'force-dynamic';

/** GET /api/admin/photos/:id — one photo with warnings, duplicates, review history and where it is used. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createSupabaseAdminClient();
  let library;
  try {
    library = await loadLibrary(supabase);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
  const photo = library.find((a) => a.id === params.id);
  if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  const related = library
    .filter((a) => photo.duplicates.exact.includes(a.id) || photo.duplicates.similar.some((s: any) => s.id === a.id))
    .map((a) => ({ id: a.id, original_filename: a.original_filename, preview_url: a.preview_url, status: a.status, width: a.width, height: a.height }));
  const [{ data: log }, { data: users }] = await Promise.all([
    supabase.from('photo_review_log').select('id, action, from_status, to_status, actor_id, note, created_at').eq('asset_id', params.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('users').select('id, name'),
  ]);
  const names = Object.fromEntries((users || []).map((u: any) => [u.id, u.name]));
  return NextResponse.json({
    photo,
    related,
    usedIn: photo.used_in,
    reviewerName: photo.reviewed_by ? names[photo.reviewed_by] || 'Admin' : null,
    history: (log || []).map((h: any) => ({ ...h, actor_name: h.actor_id ? names[h.actor_id] || 'Admin' : null })),
  });
}

/** PATCH /api/admin/photos/:id — metadata, focus point, manual flags, archive. Never approval or the file. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const adminId = await requireAdminRequest(request);
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { values, errors } = cleanPhotoInput(body || {});
  if (errors.length) return NextResponse.json({ error: errors.join('. ') }, { status: 400 });
  if (!Object.keys(values).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  const supabase = createSupabaseAdminClient();
  const { data: before } = await supabase.from('photo_assets').select('status, archived').eq('id', params.id).maybeSingle();
  const { data, error } = await supabase
    .from('photo_assets')
    .update(values)
    .eq('id', params.id)
    .select(PHOTO_COLUMNS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  // Archiving, restoring, or a rights/AI change that sent it back to review: update the public copy.
  const row = data as any;
  if (before && (before.status !== row.status || before.archived !== row.archived)) {
    try {
      const copy = await reconcilePublicCopy(supabase, params.id, adminId);
      return NextResponse.json({ photo: data, publicCopy: copy.outcome, publishedUses: copy.publishedUses });
    } catch (e: any) {
      return NextResponse.json({ photo: data, publicCopy: 'error', error: `Saved, but the public copy could not be updated: ${e.message}` }, { status: 502 });
    }
  }
  return NextResponse.json({ photo: data });
}
