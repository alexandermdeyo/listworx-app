import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countyId = searchParams.get('countyId');
    const stateCode = searchParams.get('stateCode');

    console.log(
      `[available-trades] Request — countyId: ${countyId}, stateCode: ${stateCode}`
    );

    if (!countyId) {
      return NextResponse.json(
        { error: 'countyId is required' },
        { status: 400 }
      );
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseKey =
      serviceKey && serviceKey !== 'your_service_role_key_here'
        ? serviceKey
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey
    );

    // Resolve county and state
    const { data: countyRow, error: countyLookupError } = await supabase
      .from('counties')
      .select('id, name, state_code')
      .eq('id', countyId)
      .maybeSingle();

    if (countyLookupError) {
      console.error(
        '[available-trades] Error resolving county:',
        countyLookupError.message
      );
      return NextResponse.json(
        { error: 'Failed to resolve county' },
        { status: 500 }
      );
    }

    const countyName = countyRow?.name ?? null;
    const resolvedStateCode = stateCode || countyRow?.state_code || null;

    console.log(
      `[available-trades] Resolved county: "${countyName}", state: "${resolvedStateCode}"`
    );

    // Helper: return all active categories as fallback
    async function returnFallbackCategories() {
      const { data: allCategories, error: allCategoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (allCategoriesError) {
        console.error(
          '[available-trades] Error fetching fallback categories:',
          allCategoriesError.message
        );
        return NextResponse.json(
          { error: 'Failed to fetch fallback categories' },
          { status: 500 }
        );
      }

      console.log(
        `[available-trades] Returning fallback categories: ${
          allCategories?.length || 0
        }`
      );

      return NextResponse.json({
        categories: allCategories || [],
        fallback: true,
        covered: false,
      });
    }

    // Step 1: Find contractors serving this county
    const { data: countyContractorRows, error: contractorCountyError } =
      await supabase
        .from('contractor_counties')
        .select('contractor_id')
        .eq('county_id', countyId);

    if (contractorCountyError) {
      console.error(
        '[available-trades] Error fetching contractor_counties:',
        contractorCountyError.message
      );
      return NextResponse.json(
        { error: 'Failed to fetch contractor counties' },
        { status: 500 }
      );
    }

    const allCountyContractorIds: string[] = (countyContractorRows || [])
      .map((row: any) => row.contractor_id)
      .filter(Boolean);

    console.log(
      `[available-trades] Contractors in county junction: ${allCountyContractorIds.length}`
    );

    // If nobody serves this county yet, still show all categories
    if (allCountyContractorIds.length === 0) {
      return await returnFallbackCategories();
    }

    // Step 2: Only use ACTIVE contractors for live availability
    const { data: activeContractors, error: contractorError } = await supabase
      .from('contractor_profiles')
      .select('id')
      .in('id', allCountyContractorIds)
      .eq('partner_status', 'active')
      .eq('archived', false);

    if (contractorError) {
      console.error(
        '[available-trades] Error fetching active contractors:',
        contractorError.message
      );
      return NextResponse.json(
        { error: 'Failed to fetch contractors' },
        { status: 500 }
      );
    }

    const matchingContractorIds: string[] = (activeContractors || [])
      .map((contractor: any) => contractor.id)
      .filter(Boolean);

    console.log(
      `[available-trades] Active contractors in county: ${matchingContractorIds.length}`
    );

    // If no active contractors in county, fallback to all categories
    if (matchingContractorIds.length === 0) {
      return await returnFallbackCategories();
    }

    // Step 3: Get category IDs tied to those active contractors
    const { data: contractorCategoryRows, error: contractorCategoryError } =
      await supabase
        .from('contractor_categories')
        .select('category_id')
        .in('contractor_id', matchingContractorIds);

    if (contractorCategoryError) {
      console.error(
        '[available-trades] Error fetching contractor_categories:',
        contractorCategoryError.message
      );
      return NextResponse.json(
        { error: 'Failed to fetch contractor categories' },
        { status: 500 }
      );
    }

    const categoryIdSet = new Set<string>();
    (contractorCategoryRows || []).forEach((row: any) => {
      if (row.category_id) categoryIdSet.add(row.category_id);
    });

    const categoryIds = Array.from(categoryIdSet);

    console.log(
      `[available-trades] Matched category IDs: ${categoryIds.length}`
    );

    // If active contractors exist but no categories are attached, fallback
    if (categoryIds.length === 0) {
      return await returnFallbackCategories();
    }

    // Step 4: Get active category details
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds)
      .eq('is_active', true)
      .order('name');

    if (categoryError) {
      console.error(
        '[available-trades] Error fetching categories:',
        categoryError.message
      );
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      );
    }

    const categories = categoryData || [];

    console.log(
      `[available-trades] Final categories returned: ${categories.length}`
    );

    // Final guard: if somehow nothing came back, fallback
    if (categories.length === 0) {
      return await returnFallbackCategories();
    }

    return NextResponse.json({
      categories,
      fallback: false,
      covered: true,
    });
  } catch (err: any) {
    console.error('[available-trades] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}