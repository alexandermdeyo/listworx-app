import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

// ── POST — mark an invitation as declined ─────────────────────────────────────
//
// No auth required. Called from the public /invite/[token] page.
// Accepts: no body required — token is in the URL.
// Returns: { success: true }

export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const admin = createSupabaseAdminClient();

    // Verify the invitation exists
    const { data: invitation } = await admin
      .from('vendor_invitations')
      .select('id, status')
      .eq('invite_token', params.token)
      .maybeSingle();

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
    }

    // Update status to DECLINED
    const { error } = await admin
      .from('vendor_invitations')
      .update({ status: 'DECLINED' })
      .eq('invite_token', params.token);

    if (error) {
      console.error('[invite/decline] update error:', JSON.stringify(error));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[invite/decline] token=${params.token} marked DECLINED`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[invite/decline] exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
