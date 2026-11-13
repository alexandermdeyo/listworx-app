import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requestorCard } from '@/lib/server/referral-notify';

export const dynamic = 'force-dynamic';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const contractorId = context.params.id;

    if (!contractorId) {
      return NextResponse.json(
        { error: 'Missing contractor id.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: contractor, error } = await supabase
      .from('contractor_profiles')
      .select('*')
      .eq('id', contractorId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to load contractor profile.' },
        { status: 500 }
      );
    }

    if (!contractor) {
      return NextResponse.json(
        { error: 'Contractor not found.' },
        { status: 404 }
      );
    }

    // Public endpoint: public card fields only (never documents, billing or subscription).
    return NextResponse.json({
      success: true,
      contractor: requestorCard(contractor as Record<string, unknown>),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}