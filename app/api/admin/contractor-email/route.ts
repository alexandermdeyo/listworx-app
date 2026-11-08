import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { sendContractorTemplate } from '@/lib/server/notify';

/**
 * POST /api/admin/contractor-email  { contractorProfileId, type: 'application_approved' | 'application_declined', reason? }
 * Admin-only: sends a contractor status email using the server key.
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { contractorProfileId, type, reason } = await request.json();
  if (!['application_approved', 'application_declined'].includes(type) || typeof contractorProfileId !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { data: profile } = await createSupabaseAdminClient()
    .from('contractor_profiles')
    .select('email, owner_name, company_name')
    .eq('id', contractorProfileId)
    .maybeSingle();
  if (!profile?.email) return NextResponse.json({ error: 'Contractor email not found' }, { status: 404 });

  const result = await sendContractorTemplate({
    type,
    to: profile.email,
    contractorName: profile.owner_name || profile.company_name || 'there',
    companyName: profile.company_name || '',
    ...(type === 'application_declined' && reason ? { reason: String(reason).slice(0, 2000) } : {}),
  });
  return result.ok ? NextResponse.json({ success: true }) : NextResponse.json({ error: result.error || 'Email failed' }, { status: 502 });
}
