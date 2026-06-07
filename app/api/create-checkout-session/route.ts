import { NextRequest, NextResponse } from 'next/server';
import { createStripeServerClient } from '@/lib/stripe-server';
import {
  STRIPE_PRICES,
  getTierPriceId,
  getFounderActivationPriceId,
  getAddonPriceId,
  getAddonMode,
  type TierId,
  type BillingPeriod,
} from '@/lib/stripe-prices';

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

    if (!isAddOn && !isFounderActivation && !tierId) {
      return NextResponse.json({ error: 'Missing tierId' }, { status: 400 });
    }

    if (isAddOn && !addOnId) {
      return NextResponse.json({ error: 'Missing addOnId' }, { status: 400 });
    }

    const baseUrl =
      process.env.APP_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'https://listworx.co';

    let resolvedPriceId = '';
    let sessionMode: 'payment' | 'subscription' = 'subscription';
    let addonLineItems: any[] = [];

    if (isFounderActivation) {
      resolvedPriceId = getFounderActivationPriceId() || '';
      sessionMode = 'payment';
      if (!resolvedPriceId) {
        return NextResponse.json({ error: 'Missing founder activation price ID' }, { status: 500 });
      }

      // Look up bundled add-on prices
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
        }
      }
    } else if (isAddOn) {
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
      bundledAddonIds: bundledAddonIds.join(','),
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
