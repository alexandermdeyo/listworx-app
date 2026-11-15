import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { isContentAction } from '@/lib/content/workflow';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/content/:id/action { action, note?, scheduledFor? }
 * Submit, approve, reject, schedule, unschedule or return an article to draft.
 * The database function enforces which moves are allowed and records who did it.
 * Nothing here publishes an article.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const adminId = await requireAdminRequest(request);
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action = body?.action;
  if (!isContentAction(action)) return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  let scheduledFor: string | null = null;
  if (action === 'schedule') {
    const when = new Date(String(body?.scheduledFor || ''));
    if (Number.isNaN(when.getTime())) return NextResponse.json({ error: 'Choose a publishing date and time' }, { status: 400 });
    scheduledFor = when.toISOString();
  }

  const { data, error } = await createSupabaseAdminClient().rpc('content_apply_action', {
    p_post_id: params.id,
    p_action: action,
    p_actor_id: adminId,
    p_note: typeof body?.note === 'string' ? body.note.slice(0, 2000) : null,
    p_scheduled_for: scheduledFor,
  });
  if (error) {
    const status = error.code === 'P0002' ? 404 : error.code === '22023' ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ article: data });
}
