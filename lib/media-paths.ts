/**
 * Storage paths for contractor-owned media (logos bucket, contractor-work-photos bucket).
 *
 * Every contractor file lives under a top-level folder named after the uploader's
 * auth user id: `<user id>/<kind>/<timestamp>-<file name>`. The storage policies in
 * supabase/proposed/20261111000200_media_storage_ownership.sql only let a signed-in
 * user write, overwrite or delete files whose first folder is their own user id
 * (admins excepted), so these paths must match that rule exactly.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type OwnedMediaKind = 'logo' | 'profile-photo' | 'work-photos' | 'flyers';
const KINDS: readonly OwnedMediaKind[] = ['logo', 'profile-photo', 'work-photos', 'flyers'];

function safeFileName(fileName: string): string {
  const base = (fileName || 'file').split(/[\\/]/).pop() || 'file';
  const cleaned = base.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[-.]+/, '');
  return (cleaned || 'file').slice(-80);
}

/** Path for a new file owned by `userId`. Throws if the user id is missing or malformed. */
export function ownedMediaPath(userId: string, kind: OwnedMediaKind, fileName: string, now: number = Date.now()): string {
  if (!UUID.test(userId || '')) throw new Error('A signed-in user id is required to upload media.');
  if (!KINDS.includes(kind)) throw new Error(`Unknown media kind: ${kind}`);
  return `${userId.toLowerCase()}/${kind}/${now}-${safeFileName(fileName)}`;
}

/** Mirrors the storage policy: true when the path's first folder is this user's id. */
export function isOwnedMediaPath(path: string | null | undefined, userId: string | null | undefined): boolean {
  if (!path || !userId || !UUID.test(userId)) return false;
  const parts = path.split('/');
  return parts.length > 1 && parts[0].toLowerCase() === userId.toLowerCase();
}
