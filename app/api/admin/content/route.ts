import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { CONTENT_COLUMNS, cleanArticleInput, isContentStatus, isEditable, slugify, type ContentStatus } from '@/lib/content/workflow';

export const dynamic = 'force-dynamic';

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

function dbError(message: string) {
  if (/duplicate key|unique/i.test(message)) {
    return NextResponse.json({ error: 'Another article already uses that web address (slug). Choose a different one.' }, { status: 409 });
  }
  return NextResponse.json({ error: message }, { status: 500 });
}

/** GET /api/admin/content?status=draft — all articles in the workflow, newest first (admin only). */
export async function GET(request: NextRequest) {
  if (!(await requireAdminRequest(request))) return unauthorized();
  const supabase = createSupabaseAdminClient();
  const status = new URL(request.url).searchParams.get('status');

  let query = supabase.from('blog_posts').select(CONTENT_COLUMNS).order('updated_at', { ascending: false }).limit(500);
  if (status) {
    if (!isContentStatus(status)) return NextResponse.json({ error: 'Unknown status' }, { status: 400 });
    query = query.eq('status', status);
  }
  const [{ data, error }, { data: settings }] = await Promise.all([
    query,
    supabase.from('automation_settings').select('scheduler_enabled').maybeSingle(),
  ]);
  if (error) return dbError(error.message);
  return NextResponse.json({ articles: data || [], schedulerEnabled: settings?.scheduler_enabled === true });
}

/** POST /api/admin/content — create an idea or draft. Never published from here. */
export async function POST(request: NextRequest) {
  const adminId = await requireAdminRequest(request);
  if (!adminId) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const { values, errors } = cleanArticleInput(body || {});
  if (!values.title) errors.push('A title is required');
  if (errors.length) return NextResponse.json({ error: Array.from(new Set(errors)).join('. ') }, { status: 400 });

  const status: ContentStatus = body?.status === 'idea' ? 'idea' : 'draft';
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      ...values,
      slug: (values.slug as string) || slugify(values.title as string),
      author_name: (values.author_name as string) || 'ListWorx Team',
      status,
      is_draft: true,
      published_at: null,
    })
    .select(CONTENT_COLUMNS)
    .single();
  if (error) return dbError(error.message);
  return NextResponse.json({ article: data }, { status: 201 });
}

/** PATCH /api/admin/content { id, ...fields } — edit an idea, draft or rejected article. */
export async function PATCH(request: NextRequest) {
  if (!(await requireAdminRequest(request))) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data: current } = await supabase.from('blog_posts').select('status').eq('id', id).maybeSingle();
  if (!current) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  if (!isEditable(current.status as ContentStatus)) {
    return NextResponse.json(
      { error: 'This article can no longer be edited here. Move it back to draft first (published articles are edited in the Blog section).' },
      { status: 409 }
    );
  }

  const { values, errors } = cleanArticleInput(body);
  if (errors.length) return NextResponse.json({ error: Array.from(new Set(errors)).join('. ') }, { status: 400 });
  if (Object.keys(values).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  const { data, error } = await supabase
    .from('blog_posts')
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', current.status) // fails safely if the status changed meanwhile
    .select(CONTENT_COLUMNS)
    .maybeSingle();
  if (error) return dbError(error.message);
  if (!data) return NextResponse.json({ error: 'The article changed while you were editing. Reload and try again.' }, { status: 409 });
  return NextResponse.json({ article: data });
}
