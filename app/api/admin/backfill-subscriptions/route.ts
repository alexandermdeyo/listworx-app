import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdminFromRequest(request: NextRequest): Promise<boolean> {
  try {
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user }, error } = await serviceClient.auth.getUser(token);
      if (error || !user) return false;

      const { data: profile } = await serviceClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      return profile?.role === 'ADMIN';
    }

    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;

    const { data: profile } = await serviceClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return profile?.role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminFromRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: basicTier, error: tierError } = await serviceClient
      .from('tiers')
      .select('id, name')
      .ilike('name', 'Basic Partner')
      .maybeSingle();

    if (tierError || !basicTier) {
      console.error('[backfill-subscriptions] Could not find Basic Partner tier:', tierError);
      return NextResponse.json(
        { error: 'Basic Partner tier not found in tiers table' },
        { status: 500 }
      );
    }

    console.log(`[backfill-subscriptions] Using tier: ${basicTier.name} (${basicTier.id})`);

    const { data: activeContractors, error: contractorsError } = await serviceClient
      .from('contractor_profiles')
      .select('id, company_name, owner_name, email')
      .eq('partner_status', 'active');

    if (contractorsError) {
      console.error('[backfill-subscriptions] Error fetching active contractors:', contractorsError);
      return NextResponse.json(
        { error: 'Failed to fetch active contractors' },
        { status: 500 }
      );
    }

    const activeCount = (activeContractors || []).length;

    if (!activeContractors || activeContractors.length === 0) {
      console.log('[backfill-subscriptions] No active contractors found — nothing to backfill');
      return NextResponse.json({
        message: 'No active contractors found — nothing to backfill',
        active_contractors_found: 0,
        already_had_subscriptions: 0,
        created_subscriptions: 0,
        errors: 0,
      });
    }

    console.log(`[backfill-subscriptions] Found ${activeCount} active contractor(s)`);

    const { data: existingSubs } = await serviceClient
      .from('subscriptions')
      .select('contractor_id')
      .in('contractor_id', activeContractors.map(c => c.id));

    const alreadyHasSub = new Set((existingSubs || []).map(s => s.contractor_id));
    const toBackfill = activeContractors.filter(c => !alreadyHasSub.has(c.id));

    console.log(
      `[backfill-subscriptions] ${alreadyHasSub.size} already have subscriptions, ` +
      `${toBackfill.length} need backfill`
    );

    if (toBackfill.length === 0) {
      return NextResponse.json({
        message: 'All active contractors already have subscription rows',
        active_contractors_found: activeCount,
        already_had_subscriptions: alreadyHasSub.size,
        created_subscriptions: 0,
        errors: 0,
      });
    }

    const now = new Date().toISOString();
    const rows = toBackfill.map(c => ({
      contractor_id: c.id,
      tier_id: basicTier.id,
      status: 'active',
      stripe_subscription_id: `manual_backfill_${c.id}`,
      billing_period: 'monthly',
      current_period_start: now,
      cancel_at_period_end: false,
      created_at: now,
      updated_at: now,
    }));

    const { data: inserted, error: insertError } = await serviceClient
      .from('subscriptions')
      .insert(rows)
      .select();

    if (insertError) {
      console.error('[backfill-subscriptions] Error inserting subscription rows:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert subscription rows', detail: insertError.message },
        { status: 500 }
      );
    }

    const createdCount = inserted?.length ?? 0;
    console.log(`[backfill-subscriptions] Created ${createdCount} subscription row(s)`);
    for (const row of (inserted || [])) {
      const contractor = toBackfill.find(c => c.id === row.contractor_id);
      console.log(
        `  - contractor_id=${row.contractor_id}` +
        ` company="${contractor?.company_name || ''}"` +
        ` tier=${basicTier.name}`
      );
    }

    return NextResponse.json({
      message: `Backfill complete. Created ${createdCount} subscription row(s).`,
      active_contractors_found: activeCount,
      already_had_subscriptions: alreadyHasSub.size,
      created_subscriptions: createdCount,
      errors: toBackfill.length - createdCount,
      rows: (inserted || []).map(r => ({
        contractor_id: r.contractor_id,
        tier_id: r.tier_id,
        status: r.status,
        stripe_subscription_id: r.stripe_subscription_id,
      })),
    });
  } catch (error: any) {
    console.error('[backfill-subscriptions] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', detail: error.message },
      { status: 500 }
    );
  }
}
