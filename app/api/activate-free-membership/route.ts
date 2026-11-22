import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { PARTNER_STATUS } from '@/lib/partner-status';
import { canActivateFree, buildSubscriptionRow } from '@/lib/billing/subscription-record';

const NETWORK_TIER_NAME = 'Network';

/**
 * Activates the free "Network" membership for the SIGNED-IN contractor --
 * no Stripe checkout, no card. Mirrors the Stripe webhook's
 * checkout.session.completed handling (same subscriptions-row shape, same
 * approved -> active rule via canActivateFree()/activationAfterPayment()),
 * but with every Stripe field left genuinely null rather than a synthetic
 * placeholder, since no payment processor is actually involved.
 *
 * The contractor to activate is always resolved from the caller's own
 * session (contractor_profiles.user_id = auth.uid()) -- never from a
 * client-supplied id -- so this can only ever activate the caller's own
 * membership, never someone else's.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await admin
      .from('contractor_profiles')
      .select('id, partner_status, archived')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[activate-free-membership] profile lookup failed:', profileError);
      return NextResponse.json({ error: 'Could not load your contractor profile.' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'No contractor profile found for your account.' }, { status: 404 });
    }

    if (profile.archived === true) {
      return NextResponse.json(
        { error: 'Your profile is inactive. Contact adeyo@listworx.co to reactivate it.' },
        { status: 403 }
      );
    }

    const { outcome } = canActivateFree(profile.partner_status);

    if (outcome === 'already_active') {
      return NextResponse.json({ ok: true, status: 'already_active' });
    }

    if (outcome === 'blocked') {
      return NextResponse.json(
        { error: 'Your application must be approved before you can activate your Network membership.' },
        { status: 403 }
      );
    }

    const { data: networkTier, error: tierError } = await admin
      .from('tiers')
      .select('id')
      .eq('name', NETWORK_TIER_NAME)
      .maybeSingle();

    if (tierError) {
      console.error('[activate-free-membership] tier lookup failed:', tierError);
      return NextResponse.json({ error: 'Could not load the Network tier.' }, { status: 500 });
    }

    if (!networkTier) {
      // The 20261118000000_network_free_tier.sql migration has not been
      // applied yet -- fail safely and loudly rather than guessing a tier.
      console.error('[activate-free-membership] "Network" tier row not found, has the migration been applied?');
      return NextResponse.json(
        { error: 'Free membership is not available yet. Please try again shortly or contact support.' },
        { status: 500 }
      );
    }

    const subscriptionRow = buildSubscriptionRow({
      contractorId: profile.id,
      tierId: networkTier.id,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      stripeStatus: 'active',
      billingPeriod: 'monthly',
    });

    const { error: subscriptionError } = await admin
      .from('subscriptions')
      .upsert(subscriptionRow, { onConflict: 'contractor_id' });

    if (subscriptionError) {
      console.error('[activate-free-membership] subscription upsert failed:', subscriptionError);
      return NextResponse.json({ error: 'Could not create your Network membership record.' }, { status: 500 });
    }

    const { error: statusError } = await admin
      .from('contractor_profiles')
      .update({ partner_status: PARTNER_STATUS.ACTIVE })
      .eq('id', profile.id);

    if (statusError) {
      console.error('[activate-free-membership] partner_status update failed:', statusError);
      return NextResponse.json({ error: 'Could not activate your account.' }, { status: 500 });
    }

    console.log(`[activate-free-membership] contractor ${profile.id} activated on Network (free)`);

    return NextResponse.json({ ok: true, status: 'activated' });
  } catch (error: any) {
    console.error('[activate-free-membership] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
