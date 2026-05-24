import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { createStripeServerClient } from '@/lib/stripe-server';
import { STRIPE_PRICES } from '@/lib/stripe-prices';

export async function POST(request: NextRequest) {
  try {
    // ── Step 1: Auth ──────────────────────────────────────────────────────────
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;

    // ── Step 2: Role check ────────────────────────────────────────────────────
    const admin = createSupabaseAdminClient();

    const { data: userRecord } = await admin
      .from('users')
      .select('role, name')
      .eq('id', user.id)
      .maybeSingle();

    if (userRecord?.role !== 'REALTOR') {
      return NextResponse.json(
        { error: 'Listing Studio is only available for realtors' },
        { status: 403 }
      );
    }

    // ── Step 3: Parse body ────────────────────────────────────────────────────
    const { priceId, interval } = await request.json();

    if (!priceId || !interval) {
      return NextResponse.json(
        { error: 'priceId and interval are required.' },
        { status: 400 }
      );
    }

    // ── Step 4: Validate priceId against known realtor prices ─────────────────
    const knownRealtorPriceIds = new Set(
      [
        STRIPE_PRICES.realtor.starter.monthly,
        STRIPE_PRICES.realtor.starter.annual,
        STRIPE_PRICES.realtor.agent.monthly,
        STRIPE_PRICES.realtor.agent.annual,
        STRIPE_PRICES.realtor.pro_agent.monthly,
        STRIPE_PRICES.realtor.pro_agent.annual,
        STRIPE_PRICES.realtor.founding_agent.annual,
        STRIPE_PRICES.realtor.founding_pro_agent.annual,
      ].filter(Boolean)
    );

    if (!knownRealtorPriceIds.has(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    // ── Step 5: Get or create Stripe customer ─────────────────────────────────
    const stripe = createStripeServerClient();

    const { data: realtorProfile } = await admin
      .from('realtor_profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = realtorProfile?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: userRecord?.name || user.email || '',
        metadata: {
          user_id: user.id,
          user_type: 'realtor',
        },
      });

      customerId = customer.id;

      await admin
        .from('realtor_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // ── Step 6: Create Stripe checkout session ────────────────────────────────
    const baseUrl = process.env.APP_BASE_URL || 'https://listworx.co';

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/realtor-dashboard?checkout=success`,
      cancel_url: `${baseUrl}/listing-studio#pricing`,
      metadata: {
        user_id: user.id,
        user_type: 'realtor',
        product: 'listing_studio',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_type: 'realtor',
          product: 'listing_studio',
        },
      },
    });

    // ── Step 7: Return checkout URL ───────────────────────────────────────────
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Listing Studio checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
