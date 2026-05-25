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

        try {
          await sendEmail({
            to: email,
            subject: `${realtorName} added you to their contractor network on ListWorx`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <div style="margin-bottom: 24px;">
                  <img src="https://listworx.co/logo.png" alt="ListWorx" height="36" style="height: 36px;" />
                </div>

                <h1 style="font-size: 22px; font-weight: 700; color: #111; margin-bottom: 12px;">
                  You've been added to a contractor network
                </h1>

                <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 16px;">
                  <strong>${realtorName}</strong> added you — <strong>${name}${business_name ? ` (${business_name})` : ''}</strong> — to their trusted contractor network on <a href="https://listworx.co" style="color: #E8621A; text-decoration: none;">ListWorx</a>.
                </p>

                <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 24px;">
                  ListWorx connects realtors with reliable local contractors. Joining their network means you'll be top of mind when ${realtorName} and their clients need work done.
                </p>

                <a href="${inviteUrl}" style="display: inline-block; background: #E8621A; color: white; font-weight: 700; font-size: 16px; padding: 14px 28px; border-radius: 8px; text-decoration: none; margin-bottom: 24px;">
                  Join My Network on ListWorx
                </a>

                <p style="font-size: 13px; color: #888; margin-bottom: 8px;">
                  This invite expires in 30 days. If you didn't expect this, you can safely ignore it.
                </p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />

                <p style="font-size: 12px; color: #aaa;">
                  ListWorx · <a href="https://listworx.co" style="color: #aaa;">listworx.co</a>
                </p>
              </div>
            `,
            text: `${realtorName} added you to their contractor network on ListWorx.\n\nJoin their network here: ${inviteUrl}\n\nThis invite expires in 30 days.`,
          });
        } catch (emailError: any) {
          console.error('[realtor/vendors] Failed to send invite email:', emailError);
          // Don't fail — vendor + invitation already saved
        }
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
