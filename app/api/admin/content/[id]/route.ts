import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { CONTENT_COLUMNS } from '@/lib/content/workflow';

export const dynamic = 'force-dynamic';

/** GET /api/admin/content/:id — one article plus its history (admin only). */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createSupabaseAdminClient();
  const [{ data: article }, { data: history }] = await Promise.all([
    supabase.from('blog_posts').select(CONTENT_COLUMNS).eq('id', params.id).maybeSingle(),
    supabase
      .from('content_publish_log')
      .select('id, action, from_status, to_status, actor_id, note, created_at')
      .eq('post_id', params.id)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);
  if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

  const actorIds = Array.from(new Set((history || []).map((h) => h.actor_id).filter(Boolean))) as string[];
  const { data: actors } = actorIds.length
    ? await supabase.from('users').select('id, name').in('id', actorIds)
    : { data: [] as { id: string; name: string }[] };
  const names = Object.fromEntries((actors || []).map((a) => [a.id, a.name]));

  return NextResponse.json({
    article,
    history: (history || []).map((h) => ({ ...h, actor_name: h.actor_id ? names[h.actor_id] || 'Admin' : null })),
  });
}
