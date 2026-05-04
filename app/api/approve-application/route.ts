import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PARTNER_STATUS } from '@/lib/partner-status';

export async function POST(request: NextRequest) {
  try {
    const { contractorProfileId } = await request.json();

    if (!contractorProfileId) {
      return NextResponse.json(
        { error: 'contractorProfileId is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: profile, error: fetchError } = await supabaseAdmin
      .from('contractor_profiles')
      .select('id, user_id, email, company_name, owner_name, partner_status')
      .eq('id', contractorProfileId)
      .maybeSingle();

    if (fetchError || !profile) {
      return NextResponse.json(
        { error: 'Contractor profile not found' },
        { status: 404 }
      );
    }

    if (profile.partner_status === PARTNER_STATUS.ACTIVE) {
      return NextResponse.json(
        { error: 'Contractor is already active' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('contractor_profiles')
      .update({ partner_status: PARTNER_STATUS.APPROVED })
      .eq('id', contractorProfileId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to approve contractor: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Resolve best available email — check auth users table as fallback
    let toEmail = profile.email || '';
    if (!toEmail && profile.user_id) {
      const { data: authUser } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', profile.user_id)
        .maybeSingle();
      toEmail = authUser?.email || '';
    }

    let emailError: string | null = null;

    if (toEmail) {
      try {
        const emailResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contractor-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              type: 'application_approved',
              to: toEmail,
              contractorName: profile.owner_name,
              companyName: profile.company_name,
            }),
          }
        );

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          emailError = errorData.error || 'Email send failed';
        }
      } catch (err: any) {
        emailError = err.message || 'Email send failed';
      }
    } else {
      emailError = 'No email address found for contractor — approval saved but email not sent';
      console.warn('[approve-application] no email found for contractor:', contractorProfileId);
    }

    return NextResponse.json({
      success: true,
      emailError,
      message: 'Contractor approved successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to approve contractor' },
      { status: 500 }
    );
  }
}
