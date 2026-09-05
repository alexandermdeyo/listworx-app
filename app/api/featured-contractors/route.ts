import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('contractor_profiles')
      .select('id, company_name, logo_url, owner_name, business_description, years_in_business, ironclad_certified, founding_partner, service_area_counties, business_website, website')
      .eq('partner_status', 'active')
      .eq('featured_on_homepage', true)
      .not('logo_url', 'is', null)
      .order('company_name', { ascending: true });

    if (error) throw error;

    const contractors = (data || []).map((c: any) => {
      const site = (c.business_website || c.website || '').trim();
      return {
        ...c,
        // Where the logo should link. Prefer the contractor's own site; fall
        // back to their ListWorx profile page.
        link_url: site
          ? /^https?:\/\//i.test(site)
            ? site
            : `https://${site}`
          : `/contractors/${c.id}`,
      };
    });

    return NextResponse.json({ contractors });
  } catch (err: any) {
    return NextResponse.json({ contractors: [] }, { status: 200 });
  }
}
