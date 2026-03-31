import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get categories that have at least one active contractor
    const { data, error } = await supabase.rpc('get_categories_with_active_contractors');

    if (error) {
      console.error('[Active Categories API] Supabase error:', error);

      // Fallback: If the RPC doesn't exist, use a simpler query
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          description,
          icon,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('name');

      if (categoriesError) {
        console.error('[Active Categories API] Fallback query error:', categoriesError);
        return NextResponse.json(
          {
            error: 'Failed to fetch active categories',
            message: categoriesError.message
          },
          { status: 500 }
        );
      }

      // Filter categories by checking for active contractors (in-memory filter)
      const { data: activeContractors } = await supabase
        .from('active_contractors_view')
        .select('contractor_id');

      if (!activeContractors || activeContractors.length === 0) {
        console.warn('[Active Categories API] No active contractors found - returning all active categories');
        // Return all active categories when there are no contractors yet (bootstrap scenario)
        return NextResponse.json(categoriesData || []);
      }

      const contractorIds = activeContractors.map(c => c.contractor_id);

      const { data: contractorCategories } = await supabase
        .from('contractor_categories')
        .select('category_id')
        .in('contractor_id', contractorIds);

      if (!contractorCategories) {
        return NextResponse.json([]);
      }

      const categoryIdsWithContractors = new Set(contractorCategories.map(cc => cc.category_id));
      const filteredCategories = categoriesData?.filter(c => categoryIdsWithContractors.has(c.id)) || [];

      console.log(`[Active Categories API] Returning ${filteredCategories.length} categories with active contractors`);
      return NextResponse.json(filteredCategories);
    }

    console.log(`[Active Categories API] Successfully fetched ${data?.length || 0} active categories`);
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[Active Categories API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        hint: 'Check Supabase configuration and active_contractors_view'
      },
      { status: 500 }
    );
  }
}
