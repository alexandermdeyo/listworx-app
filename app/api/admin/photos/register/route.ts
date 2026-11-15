import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, cleanPhotoInput, isDhash, readImageInfo } from '@/lib/photos/library';
import { PHOTO_COLUMNS, sha256Hex } from '@/lib/photos/server';

export const dynamic = 'force-dynamic';

const BUCKET = 'site-media';

/**
 * POST /api/admin/photos/register
 * { storage_path, original_filename, dhash?, import_batch?, external_ref?, ...metadata }
 *
 * The admin's browser uploads the original file straight to storage (site-media,
 * library/…, overwrite disabled). This step then re-reads the stored file on the
 * server, checks its real type, size and fingerprint (nothing is trusted from the
 * browser except the optional similarity fingerprint), and adds it to the catalogue
 * as "pending". Approval is never set here.
 */
export async function POST(request: NextRequest) {
  const adminId = await requireAdminRequest(request);
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const path = typeof body?.storage_path === 'string' ? body.storage_path : '';
  const originalName = typeof body?.original_filename === 'string' ? body.original_filename.trim().slice(0, 200) : '';
  if (!/^library\/\d{4}\/\d{2}\/[0-9a-f-]{36}-[A-Za-z0-9._-]+\.(jpg|png|webp)$/.test(path) || !originalName) {
    return NextResponse.json({ error: 'A library storage path and the original file name are required' }, { status: 400 });
  }
  const { values, errors } = cleanPhotoInput(body);
  delete values.archived;
  if (errors.length) return NextResponse.json({ error: errors.join('. ') }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data: file, error: dlError } = await supabase.storage.from(BUCKET).download(path);
  if (dlError || !file) return NextResponse.json({ error: 'The uploaded file was not found in storage' }, { status: 404 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_PHOTO_BYTES) return NextResponse.json({ error: 'Photos must be 25 MB or smaller' }, { status: 400 });
  const info = readImageInfo(buf);
  if (!info || !(ALLOWED_PHOTO_TYPES as readonly string[]).includes(info.mime)) {
    return NextResponse.json({ error: 'Only JPEG, PNG and WebP photos are accepted' }, { status: 400 });
  }
  const sha256 = sha256Hex(buf);
  const { data: same } = await supabase.from('photo_assets').select('id, original_filename').eq('sha256', sha256).limit(1);
  if (same && same.length) {
    // The stored copy is left in place (files are never deleted automatically); it is simply not catalogued twice.
    return NextResponse.json({ error: `This exact photo is already in the library as ${same[0].original_filename}`, duplicateOf: same[0].id }, { status: 409 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const { data, error } = await supabase
    .from('photo_assets')
    .insert({
      ...values,
      storage_bucket: BUCKET,
      storage_path: path,
      public_url: pub.publicUrl,
      original_filename: originalName,
      mime_type: info.mime,
      file_size: buf.length,
      width: info.width,
      height: info.height,
      sha256,
      dhash: isDhash(body?.dhash) ? body.dhash : null,
      import_batch: typeof body?.import_batch === 'string' ? body.import_batch.slice(0, 80) : null,
      external_ref: typeof body?.external_ref === 'string' ? body.external_ref.slice(0, 80) : null,
      uploaded_by: adminId,
    })
    .select(PHOTO_COLUMNS)
    .single();
  if (error) {
    if (/duplicate key|unique/i.test(error.message)) return NextResponse.json({ error: 'That storage path is already catalogued' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ photo: data }, { status: 201 });
}
