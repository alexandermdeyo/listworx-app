import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { photoIssues } from '@/lib/photos/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/photos/issues — library photos that are used in articles but are not
 * (or no longer) approved, with the published and unpublished articles using each.
 * Shown as warnings in the Photo Library and the Content dashboard. Nothing is
 * changed automatically: the admin replaces the photo or approves it again.
 */
export async function GET(request: NextRequest) {
  if (!(await requireAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json({ issues: await photoIssues(createSupabaseAdminClient()) });
  } catch (e: any) {
    if (/photo_assets/.test(e.message)) return NextResponse.json({ issues: [] });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
