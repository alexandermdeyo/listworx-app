import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('[Categories API] Supabase error:', error);
      console.error('[Categories API] Error details:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch categories',
          message: error.message,
          hint: 'Check Supabase RLS policies allow anon read access to categories table'
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.warn('[Categories API] No categories found in database');
    } else {
      console.log(`[Categories API] Successfully fetched ${data.length} categories`);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[Categories API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        hint: 'Check environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      },
      { status: 500 }
    );
  }
}
