import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { loadLibrary } from '@/lib/photos/server';
import { matchesSearch } from '@/lib/photos/library';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/photos?q=&status=&category=&use=&flag=&archived=1  (admin only)
 * flag: duplicates | low_res | ai | needs_alt | flagged
 */
export async function GET(request: NextRequest) {
  if (!(await requireAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const p = new URL(request.url).searchParams;
  let photos;
  try {
    photos = await loadLibrary(createSupabaseAdminClient());
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
  const categories = Array.from(new Set(photos.map((a) => a.category).filter(Boolean))).sort();
  const q = p.get('q') || '';
  const status = p.get('status');
  const category = p.get('category');
  const use = p.get('use');
  const flag = p.get('flag');
  const showArchived = p.get('archived') === '1';
  const filtered = photos.filter((a) => {
    if (a.archived !== showArchived) return false;
    if (status && a.status !== status) return false;
    if (category && a.category !== category) return false;
    if (use && !a.intended_uses.includes(use)) return false;
    if (flag === 'duplicates' && !(a.duplicates.exact.length || a.duplicates.similar.length)) return false;
    if (flag === 'low_res' && !a.warnings.some((w: any) => ['very_low_res', 'low_res', 'not_featured_size'].includes(w.code))) return false;
    if (flag === 'ai' && !a.is_ai_generated) return false;
    if (flag === 'needs_alt' && a.alt_text) return false;
    if (flag === 'flagged' && !a.quality_flags.length) return false;
    return matchesSearch(a, q);
  });
  const counts = { pending: 0, approved: 0, rejected: 0 } as Record<string, number>;
  for (const a of photos) if (!a.archived) counts[a.status] = (counts[a.status] || 0) + 1;
  return NextResponse.json({ photos: filtered, categories, counts, total: photos.filter((a) => !a.archived).length });
}
