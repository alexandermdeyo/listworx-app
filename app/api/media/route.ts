import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';


export async function GET(request: NextRequest) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const featuredOnly = searchParams.get('featured') === 'true';
  const platform = searchParams.get('platform');

  let query = supabaseAdmin
    .from('media_items')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (featuredOnly) {
    query = query.eq('is_featured', true);
  }

  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createSupabaseAdminClient();
  const body = await request.json();
  const { title, platform, url, thumbnail_url, description, is_featured, display_order } = body;

  if (!title || !url) {
    return NextResponse.json({ error: 'title and url are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('media_items')
    .insert({
      title,
      platform: platform === 'other' ? 'link' : (platform || 'link'),
      url,
      thumbnail_url: thumbnail_url || null,
      description: description || null,
      is_featured: is_featured ?? false,
      display_order: display_order ?? 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabaseAdmin = createSupabaseAdminClient();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('media_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('media_items')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
