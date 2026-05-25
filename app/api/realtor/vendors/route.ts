/**
 * Realtor Vendors API — GET + POST
 *
 * Required SQL (run once in Supabase SQL editor):
 *
 * CREATE TABLE realtor_vendors (
 *   id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
 *   realtor_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 *   name             TEXT        NOT NULL,
 *   business_name    TEXT,
 *   email            TEXT        NOT NULL,
 *   trade            TEXT        NOT NULL,
 *   phone            TEXT,
 *   notes            TEXT,
 *   created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * CREATE TABLE vendor_invitations (
 *   id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
 *   realtor_vendor_id UUID        NOT NULL REFERENCES realtor_vendors(id) ON DELETE CASCADE,
 *   token             TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
 *   status            TEXT        NOT NULL DEFAULT 'PENDING', -- PENDING | ACCEPTED | EXPIRED
 *   sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *   expires_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
 *   accepted_at       TIMESTAMPTZ,
 *   created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
 * );
 *
 * CREATE INDEX ON realtor_vendors (realtor_id);
 * CREATE INDEX ON vendor_invitations (realtor_vendor_id);
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/send-email';

// ── Auth + role helper ────────────────────────────────────────────────────────

async function getAuthedRealtor() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { user: null, admin: null, error: 'Unauthorized', status: 401 } as const;
  }

  const admin = createSupabaseAdminClient();
  const { data: userRecord } = await admin
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (userRecord?.role !== 'REALTOR') {
    return {
      user: null,
      admin: null,
      error: 'Vendors is only available for realtors',
      status: 403,
    } as const;
  }

  return { user: session.user, admin, error: null, status: 200 } as const;
}

// ── GET — list all vendors for this realtor ───────────────────────────────────

export async function GET() {
  try {
    const auth = await getAuthedRealtor();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user, admin } = auth;

    const { data: vendors, error } = await admin
      .from('realtor_vendors')
      .select('*')
      .eq('realtor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[realtor/vendors] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vendors: vendors ?? [] });
  } catch (error: any) {
    console.error('[realtor/vendors] GET exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── POST — add a vendor (and optionally send invite) ─────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthedRealtor();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user, admin } = auth;

    const body = await request.json();
    const {
      name,
      business_name,
      email,
      trade,
      phone,
      notes,
      send_invite,
    } = body as {
      name: string;
      business_name?: string;
      email: string;
      trade: string;
      phone?: string;
      notes?: string;
      send_invite?: boolean;
    };

    if (!name || !email || !trade) {
      return NextResponse.json(
        { error: 'name, email, and trade are required.' },
        { status: 400 }
      );
    }

    // ── Insert vendor ────────────────────────────────────────────────────────
    const { data: vendor, error: vendorError } = await admin
      .from('realtor_vendors')
      .insert({
        realtor_id: user.id,
        name,
        business_name: business_name || null,
        email,
        trade,
        phone: phone || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (vendorError || !vendor) {
      console.error('[realtor/vendors] POST insert error:', vendorError);
      return NextResponse.json(
        { error: vendorError?.message || 'Failed to save vendor.' },
        { status: 500 }
      );
    }

    // ── Optional: send invite ────────────────────────────────────────────────
    let invitation = null;
    if (send_invite) {
      // Generate a crypto-safe token
      const tokenBytes = crypto.getRandomValues(new Uint8Array(24));
      const token = Array.from(tokenBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data: inv, error: invError } = await admin
        .from('vendor_invitations')
        .insert({
          realtor_vendor_id: vendor.id,
          token,
          status: 'PENDING',
          sent_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (invError) {
        console.error('[realtor/vendors] POST invitation insert error:', invError);
        // Vendor was saved — don't fail the whole request
      } else {
        invitation = inv;

        // Fetch realtor name for email subject
        const { data: realtorProfile } = await admin
          .from('realtor_profiles')
          .select('brand_name')
          .eq('user_id', user.id)
          .maybeSingle();

        const realtorName =
          realtorProfile?.brand_name || user.email?.split('@')[0] || 'A realtor';

        const inviteUrl = `https://listworx.co/invite/${token}`;

        // Non-blocking: fire and forget — API returns immediately, email completes in background
        sendEmail({
          to: email,
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
            <strong>${name}${business_name ? ` — ${business_name}` : ''}</strong>, you've been added to the trusted contractor network of <strong>${realtorName}</strong> on ListWorx.
          </p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:#333333;">
            Your contractors already do great work. ListWorx helps realtors find and refer reliable local pros like you — and being in their network means you're the first call when their clients need help.
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
        })
          .then((emailResult) => {
            console.log('[vendor invite] email sent:', emailResult);
          })
          .catch((err) => {
            console.error('[vendor invite] email failed:', err);
          });
      }
    }

    console.log(
      `[realtor/vendors] Vendor saved vendor=${vendor.id} user=${user.id} send_invite=${!!send_invite}`
    );

    return NextResponse.json({ vendor, invitation }, { status: 201 });
  } catch (error: any) {
    console.error('[realtor/vendors] POST exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
