import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { AI_CHECKLIST } from '@/lib/photos/library';

export const dynamic = 'force-dynamic';

const DECISIONS = new Set(['approve', 'reject', 'reset']);

/**
 * POST /api/admin/photos/:id/review { decision: approve|reject|reset, note?, checklist? }
 * Runs the database review function, which enforces alt text, known rights, the AI
 * checklist and a rejection reason, and records the reviewer and history.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const adminId = await requireAdminRequest(request);
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const decision = body?.decision;
  if (!DECISIONS.has(decision)) return NextResponse.json({ error: 'Unknown decision' }, { status: 400 });
  const checklist: Record<string, boolean> = {};
  for (const c of AI_CHECKLIST) checklist[c.key] = body?.checklist?.[c.key] === true;
  const { data, error } = await createSupabaseAdminClient().rpc('photo_review', {
    p_asset_id: params.id,
    p_decision: decision,
    p_actor_id: adminId,
    p_note: typeof body?.note === 'string' ? body.note.slice(0, 1000) : null,
    p_checklist: checklist,
  });
  if (error) {
    const status = error.code === 'P0002' ? 404 : error.code === '22023' ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ photo: data });
}
