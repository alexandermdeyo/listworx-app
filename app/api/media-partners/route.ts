import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * Public directory of media partners — contractors an admin has flagged
 * `is_media_partner` who are active in the network. No contact details are
 * returned; bookings go through /api/media-bookings.
 */
export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: partners, error } = await supabase
      .from('contractor_profiles')
      .select(
        'id, company_name, profile_slug, logo_url, tagline, bio, business_description, years_in_business, service_area_counties',
      )
      .eq('is_media_partner', true)
      .eq('partner_status', 'active')
      .eq('archived', false)
      .order('company_name', { ascending: true });

    if (error) throw error;

    const ids = (partners || []).map((p) => p.id);
    const tradesById: Record<string, string[]> = {};
    if (ids.length > 0) {
      const { data: cats } = await supabase
        .from('contractor_categories')
        .select('contractor_id, categories(name)')
        .in('contractor_id', ids);
      (cats || []).forEach((row: any) => {
        const name = row.categories?.name;
        if (!name) return;
        (tradesById[row.contractor_id] ||= []).push(name);
      });
    }

    return NextResponse.json({
      partners: (partners || []).map((p) => ({
        id: p.id,
        company_name: p.company_name,
        profile_slug: p.profile_slug,
        logo_url: p.logo_url,
        blurb: p.tagline || p.business_description || p.bio || '',
        years_in_business: p.years_in_business,
        counties: p.service_area_counties || [],
        trades: tradesById[p.id] || [],
      })),
    });
  } catch (err: any) {
    console.error('[media-partners] error:', err);
    return NextResponse.json({ partners: [] }, { status: 200 });
  }
}
