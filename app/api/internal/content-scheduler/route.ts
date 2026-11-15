import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { runContentScheduler, secretMatches } from '@/lib/server/content-scheduler';

export const dynamic = 'force-dynamic';

/**
 * POST /api/internal/content-scheduler  (header: x-scheduler-secret)
 * Foundation only: refuses unless CONTENT_SCHEDULER_SECRET is configured and matches,
 * and even then only reports due articles (the scheduler switch is off, and
 * publishing is not implemented in this stage). Nothing calls this automatically.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.CONTENT_SCHEDULER_SECRET;
  if (!expected) return NextResponse.json({ error: 'Scheduler is not configured' }, { status: 503 });
  if (!secretMatches(request.headers.get('x-scheduler-secret'), expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runContentScheduler(createSupabaseAdminClient());
  return NextResponse.json(result);
}
