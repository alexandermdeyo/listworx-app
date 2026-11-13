import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cached, but refreshed at most every 5 minutes so admin changes appear
// without a redeploy (was frozen at build time).
export const revalidate = 300;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('states')
      .select('id, code, name, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch states' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}