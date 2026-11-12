/**
 * Admin-only writes to media_items (the site's press/video list).
 * Reads stay public (GET in app/api/media/route.ts returns active items only).
 * Kept free of framework imports so tests can run it directly.
 */

export const MEDIA_ITEM_FIELDS = [
  'title',
  'platform',
  'url',
  'thumbnail_url',
  'description',
  'is_featured',
  'display_order',
  'is_active',
] as const;

type Result = { status: number; body: unknown };

export type MediaItemDeps = {
  /** Admin user id for this request, or null when the caller is not a signed-in admin. */
  adminId: () => Promise<string | null>;
  insert: (row: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  update: (id: string, patch: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  remove: (id: string) => Promise<{ error: { message: string } | null }>;
};

const UNAUTHORIZED: Result = { status: 401, body: { error: 'Unauthorized' } };

/** Keeps only editable media_items columns; drops id, created_at and anything unknown. */
export function pickMediaItemFields(body: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!body || typeof body !== 'object') return out;
  for (const key of MEDIA_ITEM_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) out[key] = body[key];
  }
  if (out.platform === 'other') out.platform = 'link';
  return out;
}

export async function createMediaItem(body: Record<string, unknown>, deps: MediaItemDeps): Promise<Result> {
  if (!(await deps.adminId())) return UNAUTHORIZED;
  const fields = pickMediaItemFields(body);
  if (!fields.title || !fields.url) return { status: 400, body: { error: 'title and url are required' } };
  const { data, error } = await deps.insert({
    title: fields.title,
    platform: fields.platform || 'link',
    url: fields.url,
    thumbnail_url: fields.thumbnail_url || null,
    description: fields.description || null,
    is_featured: fields.is_featured ?? false,
    display_order: fields.display_order ?? 0,
    is_active: true,
  });
  if (error) return { status: 500, body: { error: error.message } };
  return { status: 201, body: data };
}

export async function updateMediaItem(body: Record<string, unknown>, deps: MediaItemDeps): Promise<Result> {
  if (!(await deps.adminId())) return UNAUTHORIZED;
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) return { status: 400, body: { error: 'id is required' } };
  const patch = pickMediaItemFields(body);
  const { data, error } = await deps.update(id, { ...patch, updated_at: new Date().toISOString() });
  if (error) return { status: 500, body: { error: error.message } };
  return { status: 200, body: data };
}

export async function deleteMediaItem(id: string | null, deps: MediaItemDeps): Promise<Result> {
  if (!(await deps.adminId())) return UNAUTHORIZED;
  if (!id) return { status: 400, body: { error: 'id is required' } };
  const { error } = await deps.remove(id);
  if (error) return { status: 500, body: { error: error.message } };
  return { status: 200, body: { success: true } };
}
