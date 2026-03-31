import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const authResult = await checkAdminAuth();
  if (!authResult.ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, contractorId, referralId } = await request.json();

    const validTypes = ['referral', 'welcome', 'approval'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const { data: contractor } = await supabase
      .from('contractor_profiles')
      .select('id, owner_name, company_name, email, user_id, partner_status')
      .eq('id', contractorId)
      .single();

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const { data: authUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', contractor.user_id)
      .maybeSingle();

    const toEmail = authUser?.email || contractor.email;
    if (!toEmail) {
      return NextResponse.json({ error: 'No email address for contractor' }, { status: 400 });
    }

    if (type === 'referral' && referralId) {
      const { data: referral } = await supabase
        .from('referrals')
        .select(`
          id,
          tier_at_referral,
          job_requests (
            requester_type,
            property_county,
            property_state,
            job_description,
            job_request_categories (
              categories ( name )
            )
          )
        `)
        .eq('id', referralId)
        .single();

      if (!referral) {
        return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
      }

      const job = referral.job_requests as any;
      const categories = job?.job_request_categories
        ?.map((jrc: any) => jrc.categories?.name)
        .filter(Boolean) || [];

      const response = await fetch(`${supabaseUrl}/functions/v1/send-contractor-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          type: 'referral_notification',
          to: toEmail,
          contractorName: contractor.owner_name,
          companyName: contractor.company_name,
          jobCategory: categories[0] || 'General Services',
          jobCounty: job?.property_county || '',
          jobState: job?.property_state || '',
          jobDescription: job?.job_description || '',
          requesterType: job?.requester_type || 'Homeowner',
          referralId,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Email send failed: ${text}`);
      }

      await supabase
        .from('referrals')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        })
        .eq('id', referralId);

    } else if (type === 'approval') {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-contractor-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          type: 'application_approved',
          to: toEmail,
          contractorName: contractor.owner_name,
          companyName: contractor.company_name,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Email send failed: ${text}`);
      }

    } else if (type === 'welcome') {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-contractor-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          type: 'subscription_activated_welcome',
          to: toEmail,
          contractorName: contractor.owner_name,
          companyName: contractor.company_name,
          tierName: 'Partner',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Email send failed: ${text}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Resend email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
