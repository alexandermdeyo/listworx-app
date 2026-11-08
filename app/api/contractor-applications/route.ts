import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { notifyAdmin, brandedEmail, detailRows, sendContractorTemplate, BASE_URL } from '@/lib/server/notify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createSupabaseAdminClient();

    const payload = {
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      email: body.email || null,
      phone: body.phone || null,
      business_name: body.business_name || null,
      company_name: body.business_name || null,
      owner_name: [body.first_name, body.last_name].filter(Boolean).join(' ') || null,
      trade: body.trade || null,
      years_in_business: body.years_in_business ?? null,
      primary_county: body.primary_county || null,
      primary_state: body.primary_state || null,
      business_description: body.business_description || null,
      bio: body.business_description || null,
      website: body.website || null,
      license_number: body.license_number || null,
      license_expiration_date: body.license_expiration_date || null,
      insurance_expiration_date: body.insurance_expiration_date || null,
      license_document_url: body.license_document_url || null,
      insurance_document_url: body.insurance_document_url || null,
      google_review_url: body.google_review_url || null,
      yelp_url: body.yelp_url || null,
      bbb_url: body.bbb_url || null,
      facebook_url: body.facebook_url || null,
      instagram_url: body.instagram_url || null,
      ironclad_acknowledged: Boolean(body.ironclad_acknowledged),
      agreed_to_standards: Boolean(body.ironclad_acknowledged),
      volume_acknowledged: Boolean(body.volume_acknowledged),
      founder_tier: body.founder_tier || null,
      founder_addons: Array.isArray(body.founder_addons) && body.founder_addons.length > 0
        ? body.founder_addons
        : null,
      status: 'pending',
    };

    const { error } = await supabase.from('contractor_applications').insert(payload);
    if (error) throw error;

    const contactName = [payload.first_name, payload.last_name].filter(Boolean).join(' ') || payload.business_name || 'there';

    // Both emails are awaited so the serverless function doesn't stop before they send.
    await Promise.allSettled([
      payload.email
        ? sendContractorTemplate({
            type: 'application_received',
            to: payload.email,
            contractorName: contactName,
            companyName: payload.business_name || 'your business',
          })
        : Promise.resolve(),
      notifyAdmin(
        `🧰 New contractor application: ${payload.business_name || contactName} · ${payload.trade || 'trade not set'}`,
        brandedEmail({
          kicker: 'Admin alert',
          title: 'New contractor application',
          body: detailRows([
            ['Business', payload.business_name],
            ['Contact', contactName],
            ['Email', payload.email],
            ['Phone', payload.phone],
            ['Main trade', payload.trade],
            ['Primary county', [payload.primary_county, payload.primary_state].filter(Boolean).join(', ')],
            ['Years in business', payload.years_in_business],
            ['License #', payload.license_number],
            ['License expires', payload.license_expiration_date],
            ['Insurance expires', payload.insurance_expiration_date],
            ['Founding plan picked', payload.founder_tier],
            ['Website', payload.website],
          ]) + `<p style="margin-top:14px;">Review their documents, then approve or decline. Approval emails them a link to pick a plan and pay.</p>`,
          ctaLabel: 'Review application',
          ctaHref: `${BASE_URL}/admin/crm/applications`,
        }),
        payload.email || undefined,
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[contractor-applications] submit failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit application.' },
      { status: 500 }
    );
  }
}
