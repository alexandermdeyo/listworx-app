import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { createMediaItem, updateMediaItem, deleteMediaItem, type MediaItemDeps } from '@/lib/server/media-items';


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

/** Writes are admin-only; the server key is used only after the admin check passes. */
function mediaDeps(request: NextRequest): MediaItemDeps {
  return {
    adminId: () => requireAdminRequest(request),
    insert: async (row) => {
      const { data, error } = await createSupabaseAdminClient().from('media_items').insert(row).select().single();
      return { data, error };
    },
    update: async (id, patch) => {
      const { data, error } = await createSupabaseAdminClient().from('media_items').update(patch).eq('id', id).select().single();
      return { data, error };
    },
    remove: async (id) => {
      const { error } = await createSupabaseAdminClient().from('media_items').delete().eq('id', id);
      return { error };
    },
  };
}

async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const result = await createMediaItem(await readJson(request), mediaDeps(request));
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(request: NextRequest) {
  const result = await updateMediaItem(await readJson(request), mediaDeps(request));
  return NextResponse.json(result.body, { status: result.status });
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  const result = await deleteMediaItem(id, mediaDeps(request));
  return NextResponse.json(result.body, { status: result.status });
}
