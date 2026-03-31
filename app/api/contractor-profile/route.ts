import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: profile, error } = await supabase
      .from('contractor_profiles')
      .select(`
        id,
        company_name,
        owner_name,
        email,
        phone,
        website,
        bio,
        business_description,
        business_website,
        google_business_url,
        logo_url,
        years_in_business,
        founding_partner,
        ironclad_certified,
        ironclad_accepted,
        partner_status,
        profile_published,
        profile_slug,
        tier,
        created_at
      `)
      .eq('profile_slug', slug)
      .eq('profile_published', true)
      .eq('partner_status', 'active')
      .eq('archived', false)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const [countiesRes, categoriesRes] = await Promise.all([
      supabase
        .from('contractor_counties')
        .select('county_id, counties(id, name, state_code)')
        .eq('contractor_id', profile.id),
      supabase
        .from('contractor_categories')
        .select('category_id, categories(id, name)')
        .eq('contractor_id', profile.id),
    ]);

    const counties = (countiesRes.data || []).map((r: any) => r.counties).filter(Boolean);
    const trades = (categoriesRes.data || []).map((r: any) => r.categories).filter(Boolean);

    return NextResponse.json({
      profile: {
        ...profile,
        counties,
        trades,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
