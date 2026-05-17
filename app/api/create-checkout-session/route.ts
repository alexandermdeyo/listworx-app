import { NextRequest, NextResponse } from 'next/server';
import { createStripeServerClient } from '@/lib/stripe-server';
import { getFounderActivationPriceId, getAddonPriceId, getAddonMode, type TierId } from '@/lib/stripe-prices';

function getTierPriceId(tierId: string, billingPeriod: string) {
  const normalizedTierId = (tierId || '').trim().toLowerCase();
  const normalizedBilling = (billingPeriod || '').trim().toLowerCase();

  const tierPriceMap: Record<string, { monthly?: string; annual?: string }> = {
    basic: {
      monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
      annual: process.env.STRIPE_PRICE_BASIC_ANNUAL,
    },
    preferred: {
      monthly: process.env.STRIPE_PRICE_PREFERRED_MONTHLY,
      annual: process.env.STRIPE_PRICE_PREFERRED_ANNUAL,
    },
    elite: {
      monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY,
      annual: process.env.STRIPE_PRICE_ELITE_ANNUAL,
    },
  };

  const tierConfig = tierPriceMap[normalizedTierId];

  if (!tierConfig) {
    throw new Error(`Unknown tierId: ${tierId}`);
  }

  const priceId = normalizedBilling === 'annual' ? tierConfig.annual : tierConfig.monthly;

  if (!priceId) {
    throw new Error(
      `Missing Stripe price ID for tierId "${tierId}" with billing period "${billingPeriod}"`
    );
  }

  return priceId;
}

function getAddOnPriceId(addOnId: string, billingPeriod: string) {
  const normalizedAddOn = (addOnId || '').trim().toLowerCase();
  const normalizedBilling = (billingPeriod || '').trim().toLowerCase();

  const addOnPriceMap: Record<
    string,
    { one_time?: string; monthly?: string; annual?: string; mode: 'payment' | 'subscription' }
  > = {
    ironclad_badge_kit: {
      one_time: process.env.STRIPE_ADDON_IRONCLAD_BADGE_KIT_ONETIME,
      mode: 'payment',
    },
    featured_spotlight: {
      monthly: process.env.STRIPE_ADDON_FEATURED_SPOTLIGHT_MONTHLY,
      annual: process.env.STRIPE_ADDON_FEATURED_SPOTLIGHT_ANNUAL,
      mode: 'subscription',
    },
  };

  const addOnConfig = addOnPriceMap[normalizedAddOn];

  if (!addOnConfig) {
    throw new Error(`Unknown add-on ID: ${addOnId}`);
  }

  if (addOnConfig.mode === 'payment') {
    if (!addOnConfig.one_time) {
      throw new Error(`Missing Stripe one-time price ID for add-on "${addOnId}"`);
    }

    return {
      priceId: addOnConfig.one_time,
      mode: 'payment' as const,
    };
  }

  const priceId = normalizedBilling === 'annual' ? addOnConfig.annual : addOnConfig.monthly;

  if (!priceId) {
    throw new Error(
      `Missing Stripe subscription price ID for add-on "${addOnId}" with billing period "${billingPeriod}"`
    );
  }

  return {
    priceId,
    mode: 'subscription' as const,
  };
}

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
      resolvedPriceId = getTierPriceId(tierId, billingPeriod);
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
        basicMonthly: process.env.STRIPE_PRICE_BASIC_MONTHLY,
        basicAnnual: process.env.STRIPE_PRICE_BASIC_ANNUAL,
        preferredMonthly: process.env.STRIPE_PRICE_PREFERRED_MONTHLY,
        preferredAnnual: process.env.STRIPE_PRICE_PREFERRED_ANNUAL,
        eliteMonthly: process.env.STRIPE_PRICE_ELITE_MONTHLY,
        eliteAnnual: process.env.STRIPE_PRICE_ELITE_ANNUAL,
        spotlightMonthly: process.env.STRIPE_ADDON_FEATURED_SPOTLIGHT_MONTHLY,
        spotlightAnnual: process.env.STRIPE_ADDON_FEATURED_SPOTLIGHT_ANNUAL,
        badgeKitOneTime: process.env.STRIPE_ADDON_IRONCLAD_BADGE_KIT_ONETIME,
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