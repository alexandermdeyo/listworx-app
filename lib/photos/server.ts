/**
 * Server-only helpers for the photo library (Stage 2). Uses the service-role client;
 * never import from a 'use client' file.
 *
 * Storage layout:
 *   photo-library (PRIVATE)  originals/YYYY/MM/<uuid>-<name>   the original, never modified or deleted
 *   site-media    (public)   library/YYYY/MM/<uuid>-<name>     public copy, only while approved
 * Admin screens show private originals through short-lived signed links.
 */
import { createHash } from 'crypto';
import { articleImageUrls, findDuplicates, photoWarnings, type DuplicateInfo } from '@/lib/photos/library';

type Supa = { from: (t: string) => any; storage: any; rpc: (fn: string, args: Record<string, unknown>) => any };

export const PRIVATE_BUCKET = 'photo-library';
export const PUBLIC_BUCKET = 'site-media';
const SIGNED_PREVIEW_SECONDS = 60 * 60;
/**
 * Browsers and the storage CDN may keep a public copy this long. Short, so a withdrawn
 * photo doesn't linger in caches (removal itself clears Supabase's CDN within about a minute).
 */
const PUBLIC_COPY_CACHE_SECONDS = '3600';

export const PHOTO_COLUMNS =
  'id, storage_bucket, storage_path, public_url, public_path, public_copy_live, original_filename, mime_type, file_size, width, height, sha256, dhash, ' +
  'title, description, alt_text, category, tags, intended_uses, source, usage_rights, rights_notes, is_ai_generated, quality_flags, focus_x, focus_y, ' +
  'status, review_note, review_checklist, reviewed_by, reviewed_at, archived, import_batch, external_ref, uploaded_by, created_at, updated_at';

export function sha256Hex(buf: Buffer | Uint8Array) {
  return createHash('sha256').update(buf).digest('hex');
}

export type ArticleRef = { id: string; title: string; slug: string; status: string; published: boolean };

/** Which articles use which image address (featured photo or <img> in the body). */
export async function articleUsage(supabase: Supa) {
  const { data, error } = await supabase.from('blog_posts').select('id, title, slug, status, is_draft, featured_image_url, body');
  if (error) throw new Error(error.message);
  const byUrl = new Map<string, ArticleRef[]>();
  for (const p of (data || []) as any[]) {
    const ref: ArticleRef = { id: p.id, title: p.title, slug: p.slug, status: p.status || (p.is_draft ? 'draft' : 'published'), published: p.is_draft === false };
    for (const url of articleImageUrls(p.featured_image_url, p.body)) {
      const list = byUrl.get(url) || [];
      list.push(ref);
      byUrl.set(url, list);
    }
  }
  return byUrl;
}

/** Signed (private) or public preview address for each photo. */
async function previewUrls(supabase: Supa, assets: any[]) {
  const out: Record<string, string> = {};
  const privatePaths: string[] = [];
  for (const a of assets) {
    if (a.public_copy_live && a.public_url) out[a.id] = a.public_url;
    else if (a.storage_bucket === PUBLIC_BUCKET) out[a.id] = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(a.storage_path).data.publicUrl;
    else privatePaths.push(a.storage_path);
  }
  if (privatePaths.length) {
    const { data } = await supabase.storage.from(PRIVATE_BUCKET).createSignedUrls(privatePaths, SIGNED_PREVIEW_SECONDS);
    const byPath = new Map<string, string>();
    for (const s of (data || []) as any[]) if (s.signedUrl) byPath.set(s.path, s.signedUrl);
    for (const a of assets) if (!out[a.id] && byPath.has(a.storage_path)) out[a.id] = byPath.get(a.storage_path)!;
  }
  return out;
}

/** True when a photo is used in articles but is not (or no longer) approved. */
export function needsAttention(a: { status: string; archived: boolean }, usedIn: ArticleRef[]) {
  return (a.status !== 'approved' || a.archived) && usedIn.length > 0;
}

/** All library photos with duplicates, warnings, preview links and where they are used. */
export async function loadLibrary(supabase: Supa) {
  const { data, error } = await supabase.from('photo_assets').select(PHOTO_COLUMNS).order('created_at', { ascending: false }).limit(2000);
  if (error) throw new Error(error.message);
  const assets = (data || []) as any[];
  const dups = findDuplicates(assets);
  const [usage, previews] = await Promise.all([articleUsage(supabase), previewUrls(supabase, assets)]);
  return assets.map((a) => {
    const dup: DuplicateInfo = dups[a.id] || { exact: [], similar: [] };
    const usedIn = a.public_url ? usage.get(a.public_url) || [] : [];
    const warnings = photoWarnings(a, dup);
    if (needsAttention(a, usedIn)) {
      const published = usedIn.filter((u) => u.published);
      warnings.unshift({
        level: 'block',
        code: 'used_while_unapproved',
        text: published.length
          ? `No longer approved but still shown in ${published.length} published article(s): ${published.map((u) => u.title).join(', ')}. Replace it there, or approve it again.`
          : `No longer approved but still used in ${usedIn.length} unpublished article(s): ${usedIn.map((u) => u.title).join(', ')}. Those articles can't be approved until it's replaced.`,
      });
    }
    return { ...a, duplicates: dup, warnings, preview_url: previews[a.id] || null, used_in: usedIn };
  });
}

/**
 * Library photos used by this article that are not approved (or archived). Photos
 * that are not in the library (e.g. older uploads) are not affected, so existing
 * articles keep working.
 */
export async function unapprovedLibraryPhotos(supabase: Supa, featured: string | null | undefined, body: string | null | undefined) {
  const urls = articleImageUrls(featured, body);
  if (!urls.length) return [];
  const { data, error } = await supabase
    .from('photo_assets')
    .select('id, original_filename, status, archived, public_url, is_ai_generated')
    .in('public_url', urls);
  if (error) {
    // Before the photo library migration exists, there is nothing to guard.
    if (/photo_assets/.test(error.message)) return [];
    throw new Error(error.message);
  }
  return ((data || []) as any[]).filter((p) => p.status !== 'approved' || p.archived) as {
    id: string; original_filename: string; status: string; archived: boolean; public_url: string; is_ai_generated: boolean;
  }[];
}

export function unapprovedMessage(list: { original_filename: string; status: string; archived?: boolean; is_ai_generated: boolean }[]) {
  const names = list.slice(0, 3).map((p) => `${p.original_filename} (${p.archived ? 'archived' : p.status}${p.is_ai_generated ? ', AI-generated' : ''})`).join(', ');
  return `This article uses library photos that are not approved: ${names}. Approve or replace them in the Photo Library first.`;
}

async function readFile(supabase: Supa, bucket: string, path: string) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Could not read ${bucket}/${path}`);
  return Buffer.from(await data.arrayBuffer());
}

/** Copies an older photo's original from the public bucket into private storage (the public file is not touched here). */
export async function secureOriginal(supabase: Supa, asset: any, actorId: string) {
  if (asset.storage_bucket !== PUBLIC_BUCKET) return asset;
  const buf = await readFile(supabase, PUBLIC_BUCKET, asset.storage_path);
  if (sha256Hex(buf) !== asset.sha256) throw new Error('The stored file does not match its fingerprint; not moved');
  const newPath = 'originals/' + asset.storage_path.replace(/^library\//, '');
  const { error } = await supabase.storage.from(PRIVATE_BUCKET).upload(newPath, buf, { upsert: false, contentType: asset.mime_type });
  if (error && !/exists/i.test(error.message)) throw new Error(error.message);
  const { data, error: rpcError } = await supabase.rpc('photo_secure_original', { p_asset_id: asset.id, p_actor_id: actorId, p_new_path: newPath });
  if (rpcError) throw new Error(rpcError.message);
  return data;
}

export type CopyOutcome = 'unchanged' | 'created' | 'removed' | 'retained';

/**
 * Makes the public copy match the photo's state:
 *   approved & active      -> public copy present (created from the private original)
 *   anything else          -> public copy removed, unless a published article still
 *                             uses it (then retained and reported, never auto-removed)
 * The private original is never modified or deleted.
 */
export async function reconcilePublicCopy(supabase: Supa, assetId: string, actorId: string): Promise<{ outcome: CopyOutcome; publishedUses: ArticleRef[] }> {
  const { data: fresh, error } = await supabase.from('photo_assets').select(PHOTO_COLUMNS).eq('id', assetId).maybeSingle();
  if (error || !fresh) throw new Error(error?.message || 'Photo not found');
  let asset = fresh as any;
  const wantLive = asset.status === 'approved' && !asset.archived;

  if (wantLive && !asset.public_copy_live) {
    const publicPath = asset.public_path || 'library/' + asset.storage_path.replace(/^(originals|library)\//, '');
    const buf = await readFile(supabase, asset.storage_bucket, asset.storage_path);
    const { error: upError } = await supabase.storage.from(PUBLIC_BUCKET).upload(publicPath, buf, { upsert: false, contentType: asset.mime_type, cacheControl: PUBLIC_COPY_CACHE_SECONDS });
    if (upError && !/exists/i.test(upError.message)) throw new Error(upError.message);
    const url = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(publicPath).data.publicUrl;
    const { error: rpcError } = await supabase.rpc('photo_public_copy', { p_asset_id: asset.id, p_action: 'created', p_actor_id: actorId, p_path: publicPath, p_url: url, p_note: null });
    if (rpcError) throw new Error(rpcError.message);
    return { outcome: 'created', publishedUses: [] };
  }

  if (!wantLive && asset.public_copy_live) {
    const usage = await articleUsage(supabase);
    const uses = usage.get(asset.public_url) || [];
    const published = uses.filter((u) => u.published);
    if (published.length) {
      const note = `Kept online because published articles use it: ${published.map((u) => u.title).join(', ')}. Replace it there to remove it.`;
      const { error: rpcError } = await supabase.rpc('photo_public_copy', { p_asset_id: asset.id, p_action: 'retained', p_actor_id: actorId, p_note: note });
      if (rpcError) throw new Error(rpcError.message);
      return { outcome: 'retained', publishedUses: published };
    }
    // Older photos whose original IS the public file: secure the original first.
    if (asset.storage_bucket === PUBLIC_BUCKET) asset = await secureOriginal(supabase, asset, actorId);
    if (!String(asset.public_path || '').startsWith('library/')) throw new Error('Refusing to remove a file outside library/');
    const { error: rmError } = await supabase.storage.from(PUBLIC_BUCKET).remove([asset.public_path]);
    if (rmError) throw new Error(rmError.message);
    const note = uses.length ? `Removed from public storage; unpublished articles still reference it: ${uses.map((u) => u.title).join(', ')}` : 'Removed from public storage (not used by any article)';
    const { error: rpcError } = await supabase.rpc('photo_public_copy', { p_asset_id: asset.id, p_action: 'removed', p_actor_id: actorId, p_note: note });
    if (rpcError) throw new Error(rpcError.message);
    return { outcome: 'removed', publishedUses: [] };
  }
  return { outcome: 'unchanged', publishedUses: [] };
}

/** Photos that need attention because articles use them while they are not approved. */
export async function photoIssues(supabase: Supa) {
  const library = await loadLibrary(supabase);
  return library
    .filter((a) => needsAttention(a, a.used_in))
    .map((a) => ({
      id: a.id, title: a.title, original_filename: a.original_filename, status: a.status, archived: a.archived,
      public_copy_live: a.public_copy_live, preview_url: a.preview_url,
      published: a.used_in.filter((u: ArticleRef) => u.published),
      unpublished: a.used_in.filter((u: ArticleRef) => !u.published),
    }));
}
