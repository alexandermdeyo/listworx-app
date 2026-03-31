import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get markets that have at least one active contractor
    const { data, error } = await supabase.rpc('get_markets_with_active_contractors');

    if (error) {
      console.error('[Active Markets API] Supabase error:', error);

      // Fallback: If the RPC doesn't exist, use a simpler query
      const { data: marketsData, error: marketsError } = await supabase
        .from('markets')
        .select(`
          id,
          name,
          state,
          is_active,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('name');

      if (marketsError) {
        console.error('[Active Markets API] Fallback query error:', marketsError);
        return NextResponse.json(
          {
            error: 'Failed to fetch active markets',
            message: marketsError.message
          },
          { status: 500 }
        );
      }

      // Filter markets by checking for active contractors (in-memory filter)
      const { data: activeContractors } = await supabase
        .from('active_contractors_view')
        .select('contractor_id');

      if (!activeContractors || activeContractors.length === 0) {
        console.warn('[Active Markets API] No active contractors found - returning all active markets');
        // Return all active markets when there are no contractors yet (bootstrap scenario)
        return NextResponse.json(marketsData || []);
      }

      const contractorIds = activeContractors.map(c => c.contractor_id);

      const { data: contractorMarkets } = await supabase
        .from('contractor_markets')
        .select('market_id')
        .in('contractor_id', contractorIds);

      if (!contractorMarkets) {
        return NextResponse.json([]);
      }

      const marketIdsWithContractors = new Set(contractorMarkets.map(cm => cm.market_id));
      const filteredMarkets = marketsData?.filter(m => marketIdsWithContractors.has(m.id)) || [];

      console.log(`[Active Markets API] Returning ${filteredMarkets.length} markets with active contractors`);
      return NextResponse.json(filteredMarkets);
    }

    console.log(`[Active Markets API] Successfully fetched ${data?.length || 0} active markets`);
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[Active Markets API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        hint: 'Check Supabase configuration and active_contractors_view'
      },
      { status: 500 }
    );
  }
}
