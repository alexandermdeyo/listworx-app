import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

// ── GET — public lookup of an invitation by token ─────────────────────────────
//
// No auth required. Used by the public /invite/[token] page.
// Returns invitation fields + realtor's brand_name from realtor_profiles.

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const admin = createSupabaseAdminClient();

    const { data: invitation } = await admin
      .from('vendor_invitations')
      .select('*')
      .eq('invite_token', params.token)
      .maybeSingle();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
    }

    // Fetch the realtor's display name from realtor_profiles
    const { data: profile } = await admin
      .from('realtor_profiles')
      .select('brand_name')
      .eq('user_id', invitation.invited_by)
      .maybeSingle();

    return NextResponse.json({
      invitation: {
        ...invitation,
        realtor_name: profile?.brand_name ?? null,
      },
    });
  } catch (error: any) {
    console.error('[invite/token] GET exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
