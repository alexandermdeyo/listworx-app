import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('[Markets API] Supabase error:', error);
      console.error('[Markets API] Error details:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch markets',
          message: error.message,
          hint: 'Check Supabase RLS policies allow anon read access to markets table'
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.warn('[Markets API] No markets found in database');
    } else {
      console.log(`[Markets API] Successfully fetched ${data.length} markets`);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[Markets API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        hint: 'Check environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      },
      { status: 500 }
    );
  }
}
