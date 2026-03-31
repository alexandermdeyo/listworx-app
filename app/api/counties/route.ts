import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get('state_code');

    if (!stateCode) {
      return NextResponse.json(
        { error: 'state_code parameter is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const query = supabase
      .from('counties')
      .select('id, name, state_code')
      .eq('state_code', stateCode)
      .eq('is_active', true)
      .order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('[Counties API] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch counties' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[Counties API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
