import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/send-email';

// ── POST — send a vendor invitation email ─────────────────────────────────────
//
// Called immediately after POST /api/realtor/vendors returns a token.
// Accepts: { vendorId, token, inviteeName, inviteeEmail, realtorName }
// Returns: { success: true }
//
// Kept separate from vendor creation so each serverless call is fast
// and neither times out on Netlify.

export async function POST(request: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const { data: userRecord } = await admin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (userRecord?.role !== 'REALTOR') {
      return NextResponse.json(
        { error: 'Only available for realtors' },
        { status: 403 }
      );
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await request.json();
    const { vendorId, token, inviteeName, inviteeEmail, realtorName } = body as {
      vendorId: string;
      token: string;
      inviteeName: string;
      inviteeEmail: string;
      realtorName: string;
    };

    if (!token || !inviteeEmail || !inviteeName || !realtorName) {
      return NextResponse.json(
        { error: 'token, inviteeEmail, inviteeName, and realtorName are required.' },
        { status: 400 }
      );
    }

    const inviteUrl = `https://listworx.co/invite/${token}`;

    // ── Send branded email ────────────────────────────────────────────────────
    const emailResult = await sendEmail({
      to: inviteeEmail,
      subject: `${realtorName} wants you in their contractor network`,
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F5F4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
          <img src="https://listworx.co/LW_LOGO.png" alt="ListWorx" width="120" style="display:inline-block;max-width:120px;height:auto;" />
        </td></tr>
        <!-- Orange accent bar -->
        <tr><td style="height:4px;background:#E85000;line-height:4px;font-size:0;">&nbsp;</td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 32px 16px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#E85000;">ListWorx Contractor Network</p>
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#111111;line-height:1.2;">${realtorName} wants you in their contractor network</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#333333;">
            <strong>${inviteeName}</strong>, you've been added to the trusted contractor network of <strong>${realtorName}</strong> on ListWorx.
          </p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:#333333;">
            Your work speaks for itself. ListWorx helps realtors find and refer reliable local pros like you — and being in their network means you're the first call when their clients need help.
          </p>
          <!-- CTA button -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
            <tr><td align="center">
              <a href="${inviteUrl}" target="_blank" style="display:inline-block;background:#E85000;color:#ffffff;font-family:-apple-system,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.3px;text-decoration:none;padding:14px 34px;border-radius:7px;line-height:1.4;">See Your Invitation →</a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#888888;">This invitation expires in 30 days. If you weren't expecting this, you can safely ignore it.</p>
          <p style="margin:0;font-size:12px;color:#888888;text-align:center;">Questions? <a href="mailto:support@listworx.co" style="color:#E85000;text-decoration:none;">support@listworx.co</a></p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
          <img src="https://listworx.co/Ironclad_Standards_Logo.png" alt="IronClad Standards" width="56" style="display:inline-block;max-width:56px;height:auto;opacity:0.9;" />
          <p style="margin:12px 0 0;font-size:11px;color:#999999;letter-spacing:0.5px;">ListWorx — Built in Gallatin, TN</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      text: `${realtorName} wants you in their contractor network on ListWorx.\n\nSee your invitation: ${inviteUrl}\n\nThis invitation expires in 30 days.\n\nQuestions? support@listworx.co\nListWorx — Built in Gallatin, TN`,
    });

    console.log(
      `[vendor/send-invite] Email sent to ${inviteeEmail} vendor=${vendorId}`,
      emailResult
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[vendor/send-invite] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
