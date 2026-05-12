import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/send-email';

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
      trade: body.trade || null,
      years_in_business: body.years_in_business ?? null,
      primary_county: body.primary_county || null,
      business_description: body.business_description || null,
      ironclad_acknowledged: Boolean(body.ironclad_acknowledged),
      volume_acknowledged: Boolean(body.volume_acknowledged),
      status: 'pending',
    };

    const { error } = await supabase.from('contractor_applications').insert(payload);
    if (error) throw error;

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.RESEND_FROM_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: 'New ListWorx contractor application',
        html: `<p>A contractor application was submitted.</p><p><strong>${payload.business_name || 'Business name pending'}</strong></p><p>${payload.first_name || ''} ${payload.last_name || ''}</p><p>${payload.email || ''}</p><p>${payload.trade || ''} — ${payload.primary_county || ''}</p>`,
        text: `A contractor application was submitted. ${payload.business_name || 'Business name pending'} ${payload.email || ''}`,
      }).catch((emailError) => console.error('[contractor-applications] admin email failed', emailError));
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[contractor-applications] submit failed', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit application.' },
      { status: 500 }
    );
  }
}
