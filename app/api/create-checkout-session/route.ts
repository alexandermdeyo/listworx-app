import { NextRequest, NextResponse } from 'next/server';
import { createStripeServerClient } from '@/lib/stripe-server';
import {
  STRIPE_PRICES,
  getTierPriceId,
  getFounderRenewalPriceId,
  getAddonPriceId,
  getAddonMode,
  type TierId,
  type FounderTierId,
  type BillingPeriod,
} from '@/lib/stripe-prices';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { getAddonById, isAddonPurchaseDisabled } from '@/lib/tiers-config';
import { hasActivePaidSubscription } from '@/lib/billing/subscription-record';

/** The only memberships a new checkout may start (ListWorx 2.0). */
const NEW_MEMBERSHIP_TIER_IDS = ['growth', 'business_pro'];

export async function POST(request: NextRequest) {
  const stripe = createStripeServerClient();

  try {
    const body = await request.json();

    const {
      contractorId,
      tierId,
      tierName,
      billingPeriod,
      isAddOn = false,
      addOnId,
      isFounderActivation = false,
      bundledAddonIds = [] as string[],
    } = body;

    if (!contractorId) {
      return NextResponse.json({ error: 'Missing contractorId' }, { status: 400 });
    }

    // Only approved or active contractors can pay. This keeps anyone from
    // skipping review by opening checkout directly, and a paused/suspended
    // contractor can't pay for a plan while an admin hold is in place (a
    // past-due member fixes payment through Manage Billing instead).
    const { data: statusRow } = await createSupabaseAdminClient()
      .from('contractor_profiles')
      .select('partner_status, archived')
      .eq('id', contractorId)
      .maybeSingle();
    const status = String(statusRow?.partner_status || '');
    if (!['approved', 'active'].includes(status)) {
      return NextResponse.json(
        {
          error: !status
            ? 'Contractor profile not found.'
            : status === 'paused' || status === 'suspended'
              ? 'Your membership is on hold. Contact adeyo@listworx.co.'
              : 'Your application must be approved before checkout.',
        },
        { status: status ? 403 : 404 }
      );
    }

    // Archived profiles are inactive; they can't buy their way back in.
    if (statusRow?.archived === true) {
      return NextResponse.json(
        { error: 'Your profile is inactive. Contact adeyo@listworx.co to reactivate it.' },
        { status: 403 }
      );
    }

    if (!isAddOn && !isFounderActivation && !tierId) {
      return NextResponse.json({ error: 'Missing tierId' }, { status: 400 });
    }

    if (isAddOn && !addOnId) {
      return NextResponse.json({ error: 'Missing addOnId' }, { status: 400 });
    }

    // ListWorx 2.0: founding-member enrollment is retired and the legacy
    // Member/Partner/Elite ($125/$215/$365) tiers are no longer sold. New
    // membership checkout is limited to Growth and Business Pro, monthly only
    // (no annual price exists in Stripe yet). Network is free and never
    // reaches Stripe -- see /api/activate-free-membership. Add-on checkout is
    // unaffected.
    if (isFounderActivation) {
      return NextResponse.json(
        { error: 'Founding Partner enrollment is closed. Choose Network, Growth, or Business Pro.' },
        { status: 400 }
      );
    }
    if (!isAddOn) {
      const requestedTier = String(tierId || '').trim().toLowerCase();
      if (!NEW_MEMBERSHIP_TIER_IDS.includes(requestedTier)) {
        return NextResponse.json(
          { error: 'That membership is no longer offered. Choose Network, Growth, or Business Pro.' },
          { status: 400 }
        );
      }
      if (String(billingPeriod || 'monthly').trim().toLowerCase() !== 'monthly') {
        return NextResponse.json(
          { error: 'Growth and Business Pro are billed monthly.' },
          { status: 400 }
        );
      }
      // One paid plan at a time: a second checkout would bill both plans.
      const { data: currentMembership } = await createSupabaseAdminClient()
        .from('subscriptions')
        .select('status, stripe_subscription_id')
        .eq('contractor_id', contractorId)
        .maybeSingle();
      if (hasActivePaidSubscription(currentMembership)) {
        return NextResponse.json(
          { error: 'You already have an active paid membership. Use Manage Billing to change or cancel it.' },
          { status: 409 }
        );
      }
    }
    if (isAddOn && isAddonPurchaseDisabled(String(addOnId || ''))) {
      return NextResponse.json(
        { error: 'This add-on is temporarily unavailable.' },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.APP_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'https://listworx.co';

    let resolvedPriceId = '';
    let sessionMode: 'payment' | 'subscription' = 'subscription';
    let addonLineItems: any[] = [];
    const chargedBundledAddonIds: string[] = [];

    if (isFounderActivation) {
      // Founding members no longer pay a separate one-time activation fee.
      // This checkout IS their first subscription payment, at their locked
      // founder rate — Stripe creates the recurring subscription directly as
      // part of this session (see stripe-webhook's handleFounderActivationCheckout,
      // which reads session.subscription rather than creating a second one).
      // Founder activation is only ever for the three legacy founding tiers
      // -- growth/business_pro are new, non-founding tiers and never reach
      // this branch.
      const normalizedFounderTierId = (tierId || '').trim().toLowerCase() as FounderTierId;
      const normalizedFounderBilling: BillingPeriod =
        (billingPeriod || '').trim().toLowerCase() === 'annual' ? 'annual' : 'monthly';
      resolvedPriceId = getFounderRenewalPriceId(normalizedFounderTierId, normalizedFounderBilling);
      sessionMode = 'subscription';
      if (!resolvedPriceId) {
        return NextResponse.json({ error: 'Missing founder renewal price ID' }, { status: 500 });
      }

      // Look up bundled add-on prices (hidden or unpriced add-ons are dropped and never recorded)
      const { ADDON_LIST: ADDON_LIST_LIB } = await import('@/lib/tiers-config');
      for (const addonId of bundledAddonIds) {
        const addon = ADDON_LIST_LIB.find((a) => a.id === addonId);
        if (!addon || addon.type !== 'onetime') continue;
        const addonPriceId = getAddonPriceId(addonId, tierId === 'elite' ? 'elite' : undefined);
        if (addonPriceId) {
          addonLineItems.push({
            price: addonPriceId,
            quantity: 1,
          });
          chargedBundledAddonIds.push(addonId);
        }
      }
    } else if (isAddOn) {
      if (!getAddonById(String(addOnId || ''))) {
        return NextResponse.json({ error: 'Unknown add-on' }, { status: 400 });
      }
      const addonPriceId = getAddonPriceId(addOnId, tierId as TierId | undefined);
      if (!addonPriceId) {
        return NextResponse.json({ error: 'Unknown add-on' }, { status: 400 });
      }
      resolvedPriceId = addonPriceId;
      sessionMode = getAddonMode(addOnId);
    } else {
      const normalizedTierId = (tierId || '').trim().toLowerCase() as TierId;
      const normalizedBilling: BillingPeriod =
        (billingPeriod || '').trim().toLowerCase() === 'annual' ? 'annual' : 'monthly';
      resolvedPriceId = getTierPriceId(normalizedTierId, normalizedBilling);
      if (!resolvedPriceId) {
        throw new Error(
          `Missing Stripe price ID for tierId "${tierId}" with billing period "${billingPeriod}"`
        );
      }
      sessionMode = 'subscription';
    }

    console.log('CHECKOUT DEBUG →', {
      contractorId,
      tierId,
      tierName,
      billingPeriod,
      isAddOn,
      addOnId,
      resolvedPriceId,
      sessionMode,
      usingSecretKey:
        process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')
          ? 'LIVE'
          : process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
          ? 'TEST'
          : 'UNKNOWN',
      envSnapshot: {
        basicMonthly: STRIPE_PRICES.tiers.basic.monthly,
        basicAnnual: STRIPE_PRICES.tiers.basic.annual,
        preferredMonthly: STRIPE_PRICES.tiers.preferred.monthly,
        preferredAnnual: STRIPE_PRICES.tiers.preferred.annual,
        eliteMonthly: STRIPE_PRICES.tiers.elite.monthly,
        eliteAnnual: STRIPE_PRICES.tiers.elite.annual,
        spotlightMonthly: STRIPE_PRICES.addons.monthly.featured_spotlight,
        spotlightAnnual: null,
        badgeKitOneTime: STRIPE_PRICES.addons.onetime.ironclad_badge_kit,
      },
    });

    const price = await stripe.prices.retrieve(resolvedPriceId);

    console.log('STRIPE PRICE DEBUG →', {
      id: price.id,
      active: price.active,
      livemode: price.livemode,
      unit_amount: price.unit_amount,
      recurring_interval: price.recurring?.interval || null,
      product: price.product,
    });

    if (!price.active) {
      return NextResponse.json(
        { error: `Stripe price is inactive: ${resolvedPriceId}` },
        { status: 400 }
      );
    }

    const usingLiveSecret = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
    if (typeof usingLiveSecret === 'boolean' && usingLiveSecret !== price.livemode) {
      return NextResponse.json(
        {
          error: `Stripe mode mismatch. Secret key is ${
            usingLiveSecret ? 'LIVE' : 'TEST'
          } but price ${resolvedPriceId} is ${price.livemode ? 'LIVE' : 'TEST'}.`,
        },
        { status: 400 }
      );
    }

    const metadata = {
      contractorId,
      tierId: tierId || '',
      tierName: tierName || '',
      billingPeriod: billingPeriod || '',
      isAddOn: String(isAddOn),
      isFounderActivation: String(isFounderActivation),
      addOnId: addOnId || '',
      bundledAddonIds: chargedBundledAddonIds.join(','),
    };

    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: resolvedPriceId,
          quantity: 1,
        },
        ...addonLineItems,
      ],
      mode: sessionMode,
      success_url: `${baseUrl}/contractor-dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/contractor-dashboard?canceled=true`,
      client_reference_id: contractorId,
      metadata,
      ...(isFounderActivation && { allow_promotion_codes: true }),
    };

    if (sessionMode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
