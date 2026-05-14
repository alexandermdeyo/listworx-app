import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');

  if (!page) {
    return NextResponse.json({ error: 'page is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('site_content')
    .select('section_key, value, is_visible')
    .eq('page', page)
    .order('display_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const content = (data || []).reduce((acc: Record<string, { value: string | null; is_visible: boolean | null }>, row) => {
    acc[row.section_key] = { value: row.value, is_visible: row.is_visible };
    return acc;
  }, {});

  return NextResponse.json(content);
}
