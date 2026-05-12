import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) return null;

  const supabase = adminClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profile?.role !== 'ADMIN') return null;
  return { supabase, userId: userData.user.id };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await auth.supabase
    .from('site_content')
    .select('*')
    .order('page', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const grouped = (data || []).reduce((acc: Record<string, any[]>, row) => {
    if (!acc[row.page]) acc[row.page] = [];
    acc[row.page].push(row);
    return acc;
  }, {});

  return NextResponse.json(grouped);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { page, section_key, value, is_visible } = body;

  if (!page || !section_key) {
    return NextResponse.json({ error: 'page and section_key are required' }, { status: 400 });
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
    updated_by: auth.userId,
  };

  if (value !== undefined) updates.value = value;
  if (is_visible !== undefined) updates.is_visible = is_visible;

  const { data, error } = await auth.supabase
    .from('site_content')
    .update(updates)
    .eq('page', page)
    .eq('section_key', section_key)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
