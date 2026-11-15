/**
 * Server-only helpers for the photo library (Stage 2). Uses the service-role client;
 * never import from a 'use client' file.
 */
import { createHash } from 'crypto';
import { articleImageUrls, findDuplicates, photoWarnings, type DuplicateInfo } from '@/lib/photos/library';

type Supa = { from: (t: string) => any; storage: any };

export const PHOTO_COLUMNS =
  'id, storage_path, public_url, original_filename, mime_type, file_size, width, height, sha256, dhash, title, description, alt_text, ' +
  'category, tags, intended_uses, source, usage_rights, rights_notes, is_ai_generated, quality_flags, focus_x, focus_y, status, review_note, ' +
  'review_checklist, reviewed_by, reviewed_at, archived, import_batch, external_ref, uploaded_by, created_at, updated_at';

export function sha256Hex(buf: Buffer | Uint8Array) {
  return createHash('sha256').update(buf).digest('hex');
}

/** All library photos with computed duplicate info and warnings (small library: computed in memory). */
export async function loadLibrary(supabase: Supa) {
  const { data, error } = await supabase.from('photo_assets').select(PHOTO_COLUMNS).order('created_at', { ascending: false }).limit(2000);
  if (error) throw new Error(error.message);
  const assets = (data || []) as any[];
  const dups = findDuplicates(assets);
  return assets.map((a) => {
    const dup: DuplicateInfo = dups[a.id] || { exact: [], similar: [] };
    return { ...a, duplicates: dup, warnings: photoWarnings(a, dup) };
  });
}

/**
 * Library photos used by this article that are not approved. Photos that are not in
 * the library (e.g. older uploads) are not affected, so existing articles keep working.
 */
export async function unapprovedLibraryPhotos(supabase: Supa, featured: string | null | undefined, body: string | null | undefined) {
  const urls = articleImageUrls(featured, body);
  if (!urls.length) return [];
  const { data, error } = await supabase
    .from('photo_assets')
    .select('id, original_filename, status, public_url, is_ai_generated')
    .in('public_url', urls)
    .neq('status', 'approved');
  if (error) {
    // Before the photo library migration exists, there is nothing to guard.
    if (/photo_assets/.test(error.message)) return [];
    throw new Error(error.message);
  }
  return (data || []) as { id: string; original_filename: string; status: string; public_url: string; is_ai_generated: boolean }[];
}

export function unapprovedMessage(list: { original_filename: string; status: string; is_ai_generated: boolean }[]) {
  const names = list.slice(0, 3).map((p) => `${p.original_filename} (${p.status}${p.is_ai_generated ? ', AI-generated' : ''})`).join(', ');
  return `This article uses library photos that are not approved yet: ${names}. Approve or replace them in the Photo Library first.`;
}
