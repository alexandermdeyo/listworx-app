import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { AI_CHECKLIST } from '@/lib/photos/library';
import { reconcilePublicCopy } from '@/lib/photos/server';

export const dynamic = 'force-dynamic';

const DECISIONS = new Set(['approve', 'reject', 'reset']);

/**
 * POST /api/admin/photos/:id/review { decision: approve|reject|reset, note?, checklist? }
 * Runs the database review function, which enforces alt text, known rights, the AI
 * checklist and a rejection reason, and records the reviewer and history. Then the
 * public copy is brought in line: created on approval; on rejection/reset removed,
 * unless a published article still uses it (kept and reported, never auto-removed).
 */
/** A rejection needs no typed reason; the history then records that none was given. */
const NO_REASON_NOTE = 'Rejected (no reason given)';
function reviewNote(decision: string, note: unknown) {
  const text = typeof note === 'string' ? note.trim().slice(0, 1000) : '';
  if (text) return text;
  return decision === 'reject' ? NO_REASON_NOTE : null;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const adminId = await requireAdminRequest(request);
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const decision = body?.decision;
  if (!DECISIONS.has(decision)) return NextResponse.json({ error: 'Unknown decision' }, { status: 400 });
  const checklist: Record<string, boolean> = {};
  for (const c of AI_CHECKLIST) checklist[c.key] = body?.checklist?.[c.key] === true;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('photo_review', {
    p_asset_id: params.id,
    p_decision: decision,
    p_actor_id: adminId,
    p_note: reviewNote(decision, body?.note),
    p_checklist: checklist,
  });
  if (error) {
    const status = error.code === 'P0002' ? 404 : error.code === '22023' ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  try {
    const copy = await reconcilePublicCopy(supabase, params.id, adminId);
    return NextResponse.json({ photo: data, publicCopy: copy.outcome, publishedUses: copy.publishedUses });
  } catch (e: any) {
    // The decision is saved; only the public copy step failed (it is retried on the next review or edit).
    return NextResponse.json({ photo: data, publicCopy: 'error', error: `Decision saved, but the public copy could not be updated: ${e.message}` }, { status: 502 });
  }
}
