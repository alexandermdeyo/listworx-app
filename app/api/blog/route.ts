import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';


export async function GET(request: NextRequest) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const all = searchParams.get('all') === 'true';

  if (slug) {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_draft', false)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  }

  let query = supabaseAdmin
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image_url, author_name, is_draft, published_at, created_at, updated_at')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (!all) {
    query = query.eq('is_draft', false);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data || []).map((post: any) => ({
    ...post,
    is_published: !post.is_draft,
  })));
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createSupabaseAdminClient();
  const body = await request.json();
  const { title, slug, excerpt, body: postBody, featured_image_url, author_name, is_published } = body;

  if (!title?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'title and slug are required' }, { status: 400 });
  }

  const safeSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .insert({
      title: title.trim(),
      slug: safeSlug,
      excerpt: excerpt?.trim() || null,
      body: postBody?.trim() || null,
      featured_image_url: featured_image_url?.trim() || null,
      author_name: author_name?.trim() || 'ListWorx Team',
      is_draft: !(is_published ?? false),
      published_at: is_published ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, is_published: !data.is_draft }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabaseAdmin = createSupabaseAdminClient();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  if (updates.slug) {
    updates.slug = updates.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  }

  const { data: existing } = await supabaseAdmin
    .from('blog_posts')
    .select('is_draft, published_at')
    .eq('id', id)
    .maybeSingle();

  if (Object.prototype.hasOwnProperty.call(updates, 'is_published')) {
    updates.is_draft = !updates.is_published;
    delete updates.is_published;
  }

  if (updates.is_draft === false && existing && existing.is_draft && !existing.published_at) {
    updates.published_at = new Date().toISOString();
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, is_published: !data.is_draft });
}

export async function DELETE(request: NextRequest) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('blog_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
