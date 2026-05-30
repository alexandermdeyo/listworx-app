import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { PARTNER_STATUS } from '@/lib/partner-status';
import { createStripeServerClient } from '@/lib/stripe-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { getFounderRenewalPriceId, normalizeFounderTier } from '@/lib/stripe-prices';
import { sendEmail } from '@/lib/send-email';

function getStripe() {
  return createStripeServerClient();
}

function getSupabase() {
  return createSupabaseAdminClient();
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    let event;
    try {
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        if (sub.metadata?.user_type === 'realtor') {
          await handleRealtorSubscriptionUpdated(sub);
        } else {
          await handleSubscriptionUpdated(sub);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        if (sub.metadata?.user_type === 'realtor') {
          await handleRealtorSubscriptionUpdated(sub);
        } else {
          await handleSubscriptionDeleted(sub);
        }
        break;
      }

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function resolveTierId(tierSlugOrId: string): Promise<string | null> {
  if (!tierSlugOrId) return null;

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(tierSlugOrId)) {
    return tierSlugOrId;
  }

  const normalizedSlug = tierSlugOrId.trim().toLowerCase();

  const slugToNameMap: Record<string, string> = {
    basic: 'Basic Partner',
    preferred: 'Preferred Partner',
    elite: 'Elite Partner',
  };

  const tierName = slugToNameMap[normalizedSlug] || tierSlugOrId;

  const { data: tier } = await getSupabase().from('tiers')
    .select('id')
    .ilike('name', tierName)
    .maybeSingle();

  if (!tier) {
    console.error(`[stripe-webhook] Could not resolve tier for slug/name: "${tierSlugOrId}"`);
    return null;
  }

  console.log(`[stripe-webhook] Resolved tier "${tierSlugOrId}" → id=${tier.id}`);
  return tier.id;
}

async function handleCheckoutCompleted(session: any) {
  const contractorId = session.client_reference_id || session.metadata?.contractorId;
  const tierName = session.metadata?.tierName;
  const tierSlug = session.metadata?.tierId;
  const billingPeriod = session.metadata?.billingPeriod;
  const isAddOn = session.metadata?.isAddOn === 'true';
  const isFounderActivation = session.metadata?.isFounderActivation === 'true';

  console.log('[stripe-webhook] checkout.session.completed', {
    sessionId: session.id,
    contractorId,
    tierSlug,
    tierName,
    billingPeriod,
    isAddOn,
    stripeSubscriptionId: session.subscription,
    stripeCustomerId: session.customer,
  });

  if (session.metadata?.user_type === 'realtor' &&
      session.metadata?.product === 'listing_studio') {
    await handleRealtorListingStudioCheckout(session);
    return;
  }

  if (!contractorId) {
    console.error('[stripe-webhook] No contractor ID in checkout session');
    return;
  }

  if (isAddOn) {
    await sendAddOnConfirmationEmail(contractorId, tierName);
    return;
  }

  if (isFounderActivation) {
    await handleFounderActivationCheckout(session, contractorId, tierName || tierSlug || 'basic');
    return;
  }

  const { error: customerUpdateError } = await getSupabase().from('contractor_profiles')
    .update({ stripe_customer_id: session.customer })
    .eq('id', contractorId);

  if (customerUpdateError) {
    console.error('[stripe-webhook] Error updating contractor stripe_customer_id:', customerUpdateError);
  }

  const { data: profileData } = await getSupabase().from('contractor_profiles')
    .select('partner_status')
    .eq('id', contractorId)
    .maybeSingle();

  if (profileData && profileData.partner_status === PARTNER_STATUS.APPROVED) {
    const { error: statusError } = await getSupabase().from('contractor_profiles')
      .update({ partner_status: PARTNER_STATUS.ACTIVE })
      .eq('id', contractorId);

    if (statusError) {
      console.error('[stripe-webhook] Error updating contractor partner_status to active:', statusError);
    } else {
      console.log(`[stripe-webhook] contractor ${contractorId} partner_status → active`);
      await sendSubscriptionActivatedWelcomeEmail(contractorId, tierName);
    }
  }

  if (!tierSlug) {
    console.error('[stripe-webhook] No tier ID/slug in checkout session metadata — cannot create subscription row');
    return;
  }

  const resolvedTierId = await resolveTierId(tierSlug);
  if (!resolvedTierId) {
    console.error(`[stripe-webhook] Failed to resolve tier UUID for "${tierSlug}" — subscription row not created`);
    return;
  }

  const subscriptionPayload: Record<string, any> = {
    contractor_id: contractorId,
    tier_id: resolvedTierId,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    status: 'active',
    billing_period: billingPeriod || 'monthly',
    current_period_start: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  console.log('[stripe-webhook] Upserting subscription row:', subscriptionPayload);

  const { data: upsertedSub, error: subscriptionError } = await getSupabase().from('subscriptions')
    .upsert(subscriptionPayload, { onConflict: 'contractor_id' })
    .select();

  if (subscriptionError) {
    console.error('[stripe-webhook] Error creating/updating subscription row:', subscriptionError);
    return;
  }

  console.log('[stripe-webhook] Subscription row upserted successfully:', upsertedSub);

  await sendSubscriptionConfirmationEmail(contractorId, tierName, billingPeriod);
}


async function handleFounderActivationCheckout(session: any, contractorId: string, tierName: string) {
  const stripe = getStripe();
  const supabase = getSupabase();
  const founderTier = normalizeFounderTier(tierName);
  const renewalPriceId = getFounderRenewalPriceId(founderTier);

  if (!renewalPriceId) {
    console.error(`[stripe-webhook] Missing founder renewal price for tier ${founderTier}`);
    return;
  }

  const customerId = session.customer;

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: renewalPriceId }],
    metadata: {
      contractor_id: contractorId,
      contractorId,
      tier: founderTier,
      type: 'founder',
    },
  });

  const now = new Date().toISOString();
  const { data: contractor } = await supabase
    .from('contractor_profiles')
    .select('email, owner_name, company_name, service_area_counties, service_area_state')
    .eq('id', contractorId)
    .maybeSingle();

  const { error } = await supabase
    .from('contractor_profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: 'active',
      subscription_tier: founderTier,
      founder_status: true,
      founding_partner_badge: true,
      founder_tier: founderTier,
      founder_activation_paid_at: now,
      trial_ends_at: null,
      partner_status: PARTNER_STATUS.ACTIVE,
      updated_at: now,
    })
    .eq('id', contractorId);

  if (error) {
    console.error('[stripe-webhook] Failed to update founding partner profile', error);
    return;
  }

  // Persist bundled add-on purchases (for tracking what they bought)
  const bundledAddonIdsRaw = session.metadata?.bundledAddonIds || '';
  const bundledAddonIds = bundledAddonIdsRaw.split(',').filter(Boolean);
  if (bundledAddonIds.length > 0) {
    try {
      await supabase
        .from('contractor_profiles')
        .update({
          purchased_addons: bundledAddonIds,
        })
        .eq('id', contractorId);
    } catch (err) {
      console.error('Failed to persist bundled addons:', err);
    }
  }

  if (contractor?.email) {
    const renewalAmount = founderTier === 'elite' ? '$479' : founderTier === 'preferred' ? '$279' : '$159';
    const territory = [contractor.service_area_counties?.[0], contractor.service_area_state].filter(Boolean).join(', ') || 'your approved service area';
    await sendEmail({
      to: contractor.email,
      subject: "Welcome to ListWorx — You're a Founding Partner",
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F5F4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <!-- Header with logo and accent bar -->
        <tr><td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
          <img src="https://listworx.co/LW_LOGO.png" alt="ListWorx" width="120" style="display:inline-block;max-width:120px;height:auto;" />
        </td></tr>
        <tr><td style="height:4px;background:#E85000;line-height:4px;font-size:0;">&nbsp;</td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 32px 16px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#E85000;">ListWorx IronClad Partner Network</p>
          <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#111111;line-height:1.2;">Welcome, Founding Partner</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#333333;">Your activation is complete. You are officially a ListWorx Founding Partner.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;background:#FAFAF9;border:1px solid #E5E5E5;border-radius:8px;">
            <tr><td style="padding:18px 22px;">
              <p style="margin:0 0 6px;font-size:13px;color:#666666;">Locked Founder Tier</p>
              <p style="margin:0 0 14px;font-size:18px;font-weight:700;color:#111111;text-transform:capitalize;">${founderTier} Founder</p>
              <p style="margin:0 0 6px;font-size:13px;color:#666666;">Territory</p>
              <p style="margin:0 0 14px;font-size:16px;font-weight:600;color:#111111;">${territory}</p>
              <p style="margin:0 0 6px;font-size:13px;color:#666666;">Billing starts</p>
              <p style="margin:0 0 14px;font-size:16px;font-weight:600;color:#111111;">Immediately — your locked rate begins today</p>
              <p style="margin:0 0 6px;font-size:13px;color:#666666;">Locked renewal rate</p>
              <p style="margin:0;font-size:16px;font-weight:600;color:#111111;">${renewalAmount}/month — for life</p>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:16px;line-height:1.55;color:#333333;">IronClad Standards still apply: respond within 24 hours, keep insurance current, communicate like a pro. Violations may result in losing Founding Partner status.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
            <tr><td align="center">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_BASE_URL || 'https://listworx.co'}/contractor-dashboard" target="_blank" style="display:inline-block;background:#E85000;color:#ffffff;font-family:-apple-system,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.3px;text-decoration:none;padding:14px 34px;border-radius:7px;line-height:1.4;">Open Your Dashboard →</a>
            </td></tr>
          </table>
          <p style="margin:8px 0 0;font-size:12px;color:#888888;text-align:center;">Questions? Reply to this email or contact Alexander Deyo, Founder — adeyo@listworx.co | 615-362-4996</p>
        </td></tr>
        <!-- Footer with IronClad shield -->
        <tr><td style="background:#1a1a1a;padding:24px 32px;text-align:center;">
          <img src="https://listworx.co/Ironclad_Standards_Logo.png" alt="IronClad Standards" width="64" style="display:inline-block;max-width:64px;height:auto;opacity:0.95;" />
          <p style="margin:12px 0 0;font-size:11px;color:#999999;letter-spacing:0.5px;">ListWorx LLC — 2147 Springdale Ln F104, Gallatin, TN 37066</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      text: `Welcome to ListWorx. You are now a Founding Partner. Tier: ${founderTier}. Territory: ${territory}. Your locked rate of ${renewalAmount}/month begins immediately. IronClad Standards still apply.`,
    }).catch((emailError) => console.error('[stripe-webhook] Founding Partner email failed', emailError));
  }
}

async function handleRealtorListingStudioCheckout(session: any) {
  const stripe = getStripe();
  const supabase = getSupabase();
  const userId = session.metadata?.user_id;

  if (!userId) {
    console.error('[stripe-webhook] No user_id in realtor checkout session metadata');
    return;
  }

  const subscriptionId = session.subscription;
  if (!subscriptionId) {
    console.error('[stripe-webhook] No subscription ID in realtor checkout session');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;

  if (!priceId) {
    console.error('[stripe-webhook] No price ID found in realtor checkout');
    return;
  }

  const PRICE_TO_TIER: Record<string, string> = {
    // Legacy price IDs — keep so old subscriptions still resolve
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_STARTER_MONTHLY || '']: 'starter_agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_STARTER_ANNUAL  || '']: 'starter_agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_AGENT_MONTHLY   || '']: 'agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_AGENT_ANNUAL    || '']: 'agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_PRO_MONTHLY     || '']: 'elite',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_PRO_ANNUAL      || '']: 'elite',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_AGENT_ANNUAL   || '']: 'founding_agent_pro',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_PRO_ANNUAL     || '']: 'founding_elite',
    // Current price IDs
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_STARTER_AGENT_MONTHLY   || '']: 'starter_agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_STARTER_AGENT_ANNUAL    || '']: 'starter_agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_AGENT_PRO_MONTHLY       || '']: 'agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_AGENT_PRO_ANNUAL        || '']: 'agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_ELITE_MONTHLY           || '']: 'elite',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_ELITE_ANNUAL            || '']: 'elite',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_AGENT_PRO_ANNUAL || '']: 'founding_agent_pro',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_ELITE_ANNUAL     || '']: 'founding_elite',
    // Hardcoded fallback for founding IDs in case env vars are not set server-side
    'price_1TcqSd7JcUvuHoDO0b5Lbcht': 'founding_agent_pro',
    'price_1TcqSd7JcUvuHoDOzITZfA5t': 'founding_elite',
  };

  const TIER_LIMITS: Record<string, { content_packages: number; flyers: number; landing_pages: number; slideshow_videos: number }> = {
    starter_agent:      { content_packages: 15,  flyers: 8,   landing_pages: 8,   slideshow_videos: 0 },
    agent:              { content_packages: 50,  flyers: 30,  landing_pages: 30,  slideshow_videos: 3 },
    elite:              { content_packages: 150, flyers: 100, landing_pages: 100, slideshow_videos: 10 },
    founding_agent_pro: { content_packages: 50,  flyers: 30,  landing_pages: 30,  slideshow_videos: 3 },
    founding_elite:     { content_packages: 150, flyers: 100, landing_pages: 100, slideshow_videos: 10 },
  };

  const tier = PRICE_TO_TIER[priceId] || 'starter_agent';
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.starter_agent;
  const isFounder = tier.startsWith('founding_');
  // founding_agent_pro → base tier 'agent'; founding_elite → 'elite'
  const rawBase = isFounder ? tier.replace('founding_', '') : tier;
  const baseTier = rawBase === 'agent_pro' ? 'agent' : rawBase;

  const price = subscription.items.data[0]?.price;
  const interval = (price as any)?.recurring?.interval === 'year' ? 'annual' : 'monthly';

  console.log('[stripe-webhook] realtor listing_studio checkout', {
    userId,
    tier,
    baseTier,
    isFounder,
    interval,
    subscriptionId,
  });

  const directoryTiers = ['agent', 'pro_agent', 'founding_agent', 'founding_pro_agent', 'agent_pro', 'elite', 'founding_agent_pro', 'founding_elite'];

  const { error } = await supabase
    .from('realtor_profiles')
    .update({
      stripe_customer_id: session.customer,
      stripe_subscription_id: subscriptionId,
      listing_studio_tier: baseTier,
      listing_studio_status: 'active',
      listing_studio_interval: interval,
      listing_studio_is_founder: isFounder,
      realtor_plan: baseTier,
      subscription_status: 'active',
      directory_listed: directoryTiers.includes(tier),
      content_packages_remaining: limits.content_packages,
      flyers_remaining: limits.flyers,
      landing_pages_remaining: limits.landing_pages,
      slideshow_videos_remaining: limits.slideshow_videos,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('[stripe-webhook] Error updating realtor_profiles for listing studio checkout:', error);
    return;
  }

  console.log(`[stripe-webhook] Realtor ${userId} activated Listing Studio tier=${baseTier} isFounder=${isFounder}`);
}

async function handleRealtorSubscriptionUpdated(subscription: any) {
  const stripe = getStripe();
  const supabase = getSupabase();
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.error('[stripe-webhook] No user_id in realtor subscription metadata');
    return;
  }

  const priceId = subscription.items?.data[0]?.price?.id;

  const PRICE_TO_TIER: Record<string, string> = {
    // Legacy price IDs — keep so old subscriptions still resolve
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_STARTER_MONTHLY || '']: 'starter_agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_STARTER_ANNUAL  || '']: 'starter_agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_AGENT_MONTHLY   || '']: 'agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_AGENT_ANNUAL    || '']: 'agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_PRO_MONTHLY     || '']: 'elite',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_PRO_ANNUAL      || '']: 'elite',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_AGENT_ANNUAL   || '']: 'founding_agent_pro',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_PRO_ANNUAL     || '']: 'founding_elite',
    // Current price IDs
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_STARTER_AGENT_MONTHLY   || '']: 'starter_agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_STARTER_AGENT_ANNUAL    || '']: 'starter_agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_AGENT_PRO_MONTHLY       || '']: 'agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_AGENT_PRO_ANNUAL        || '']: 'agent',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_ELITE_MONTHLY           || '']: 'elite',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_ELITE_ANNUAL            || '']: 'elite',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_AGENT_PRO_ANNUAL || '']: 'founding_agent_pro',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_REALTOR_FOUNDING_ELITE_ANNUAL     || '']: 'founding_elite',
    // Hardcoded fallback for founding IDs in case env vars are not set server-side
    'price_1TcqSd7JcUvuHoDO0b5Lbcht': 'founding_agent_pro',
    'price_1TcqSd7JcUvuHoDOzITZfA5t': 'founding_elite',
  };

  const TIER_LIMITS: Record<string, { content_packages: number; flyers: number; landing_pages: number; slideshow_videos: number }> = {
    starter_agent:      { content_packages: 15,  flyers: 8,   landing_pages: 8,   slideshow_videos: 0 },
    agent:              { content_packages: 50,  flyers: 30,  landing_pages: 30,  slideshow_videos: 3 },
    elite:              { content_packages: 150, flyers: 100, landing_pages: 100, slideshow_videos: 10 },
    founding_agent_pro: { content_packages: 50,  flyers: 30,  landing_pages: 30,  slideshow_videos: 3 },
    founding_elite:     { content_packages: 150, flyers: 100, landing_pages: 100, slideshow_videos: 10 },
  };

  console.log('[stripe-webhook] handleRealtorSubscriptionUpdated', {
    subscriptionId: subscription.id,
    userId,
    status: subscription.status,
  });

  const directoryTiers = ['agent', 'pro_agent', 'founding_agent', 'founding_pro_agent', 'agent_pro', 'elite', 'founding_agent_pro', 'founding_elite'];

  if (subscription.status === 'active') {
    const tier = priceId ? (PRICE_TO_TIER[priceId] || 'starter_agent') : 'starter_agent';
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.starter_agent;
    const isFounder = tier.startsWith('founding_');
    const rawBase = isFounder ? tier.replace('founding_', '') : tier;
    const baseTier = rawBase === 'agent_pro' ? 'agent' : rawBase;

    const price = subscription.items?.data[0]?.price;
    const interval = (price as any)?.recurring?.interval === 'year' ? 'annual' : 'monthly';

    const { error } = await supabase
      .from('realtor_profiles')
      .update({
        listing_studio_tier: baseTier,
        listing_studio_status: 'active',
        listing_studio_interval: interval,
        listing_studio_is_founder: isFounder,
        realtor_plan: baseTier,
        subscription_status: 'active',
        directory_listed: directoryTiers.includes(tier),
        content_packages_remaining: limits.content_packages,
        flyers_remaining: limits.flyers,
        landing_pages_remaining: limits.landing_pages,
        slideshow_videos_remaining: limits.slideshow_videos,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[stripe-webhook] Error updating realtor_profiles on subscription active:', error);
    } else {
      console.log(`[stripe-webhook] Realtor ${userId} subscription active, tier=${baseTier}`);
    }

  } else if (subscription.status === 'past_due') {
    const { error } = await supabase
      .from('realtor_profiles')
      .update({
        listing_studio_status: 'past_due',
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[stripe-webhook] Error updating realtor_profiles on subscription past_due:', error);
    } else {
      console.log(`[stripe-webhook] Realtor ${userId} subscription past_due`);
    }

  } else if (subscription.status === 'canceled' || subscription.status === 'cancelled') {
    const { error } = await supabase
      .from('realtor_profiles')
      .update({
        listing_studio_tier: null,
        listing_studio_status: 'canceled',
        listing_studio_interval: null,
        listing_studio_is_founder: false,
        realtor_plan: 'free',
        subscription_status: 'canceled',
        directory_listed: false,
        content_packages_remaining: 0,
        flyers_remaining: 0,
        landing_pages_remaining: 0,
        slideshow_videos_remaining: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[stripe-webhook] Error updating realtor_profiles on subscription canceled:', error);
    } else {
      console.log(`[stripe-webhook] Realtor ${userId} subscription canceled, plan → free`);
    }
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  const contractorId = subscription.metadata?.contractorId;

  console.log('[stripe-webhook] customer.subscription.created/updated', {
    stripeSubscriptionId: subscription.id,
    contractorId,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
  });

  if (!contractorId) {
    console.error('[stripe-webhook] No contractor ID in subscription metadata');
    return;
  }

  let subscriptionStatus: 'active' | 'past_due' | 'cancelled' | 'incomplete' | 'trialing';

  switch (subscription.status) {
    case 'active':
      subscriptionStatus = 'active';
      break;
    case 'past_due':
      subscriptionStatus = 'past_due';
      break;
    case 'canceled':
    case 'cancelled':
      subscriptionStatus = 'cancelled';
      break;
    case 'incomplete':
      subscriptionStatus = 'incomplete';
      break;
    case 'trialing':
      subscriptionStatus = 'trialing';
      break;
    default:
      subscriptionStatus = 'incomplete';
  }

  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const { data: existingRow } = await getSupabase().from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();

  if (existingRow) {
    const { error: subscriptionError } = await getSupabase().from('subscriptions')
      .update({
        status: subscriptionStatus,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (subscriptionError) {
      console.error('[stripe-webhook] Error updating subscription:', subscriptionError);
      return;
    }

    console.log(`[stripe-webhook] Subscription row updated for stripe_subscription_id=${subscription.id} → status=${subscriptionStatus}`);
  } else {
    const tierSlug = subscription.metadata?.tierId;
    const resolvedTierId = tierSlug ? await resolveTierId(tierSlug) : null;

    if (!resolvedTierId) {
      console.error('[stripe-webhook] No existing subscription row and no tier metadata — cannot upsert');
    } else {
      const subscriptionPayload: Record<string, any> = {
        contractor_id: contractorId,
        tier_id: resolvedTierId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscriptionStatus,
        billing_period: subscription.metadata?.billingPeriod || 'monthly',
        current_period_start: periodStart,
        current_period_end: periodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        updated_at: new Date().toISOString(),
      };

      console.log('[stripe-webhook] No existing row — inserting subscription via upsert:', subscriptionPayload);

      const { data: upsertedSub, error: upsertError } = await getSupabase().from('subscriptions')
        .upsert(subscriptionPayload, { onConflict: 'contractor_id' })
        .select();

      if (upsertError) {
        console.error('[stripe-webhook] Error upserting subscription during update event:', upsertError);
        return;
      }

      console.log('[stripe-webhook] Subscription row created during update event:', upsertedSub);
    }
  }

  if (contractorId && periodEnd) {
    await getSupabase().from('contractor_profiles')
      .update({
        subscription_status: subscriptionStatus,
        subscription_current_period_end: periodEnd,
      })
      .eq('id', contractorId);
  }

  if (subscription.status === 'active') {
    const { data: profileData } = await getSupabase().from('contractor_profiles')
      .select('partner_status')
      .eq('id', contractorId)
      .maybeSingle();

    if (profileData && profileData.partner_status === PARTNER_STATUS.APPROVED) {
      const { error: statusError } = await getSupabase().from('contractor_profiles')
        .update({ partner_status: PARTNER_STATUS.ACTIVE })
        .eq('id', contractorId);

      if (!statusError) {
        console.log(`[stripe-webhook] contractor ${contractorId} partner_status → active (via subscription.updated)`);
        const tierName = subscription.metadata?.tierName;
        await sendSubscriptionActivatedWelcomeEmail(contractorId, tierName);
      }
    }
  } else if (subscription.status === 'past_due' || subscription.status === 'canceled') {
    const { data: profileData } = await getSupabase().from('contractor_profiles')
      .select('partner_status')
      .eq('id', contractorId)
      .maybeSingle();

    if (profileData && profileData.partner_status === PARTNER_STATUS.ACTIVE) {
      await getSupabase().from('contractor_profiles')
        .update({ partner_status: PARTNER_STATUS.PAUSED })
        .eq('id', contractorId);

      console.log(`[stripe-webhook] contractor ${contractorId} partner_status → paused (subscription ${subscription.status})`);
    }
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const contractorId = subscription.metadata?.contractorId;

  console.log('[stripe-webhook] customer.subscription.deleted', {
    stripeSubscriptionId: subscription.id,
    contractorId,
  });

  if (!contractorId) {
    console.error('[stripe-webhook] No contractor ID in subscription metadata');
    return;
  }

  const { error: subscriptionError } = await getSupabase().from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (subscriptionError) {
    console.error('[stripe-webhook] Error updating subscription to cancelled:', subscriptionError);
    return;
  }

  console.log(`[stripe-webhook] Subscription cancelled for stripe_subscription_id=${subscription.id}`);

  const { data: profileData } = await getSupabase().from('contractor_profiles')
    .select('partner_status')
    .eq('id', contractorId)
    .maybeSingle();

  if (profileData && profileData.partner_status === PARTNER_STATUS.ACTIVE) {
    await getSupabase().from('contractor_profiles')
      .update({ partner_status: PARTNER_STATUS.PAUSED })
      .eq('id', contractorId);

    console.log(`[stripe-webhook] contractor ${contractorId} partner_status → paused (subscription deleted)`);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    console.log('[stripe-webhook] Invoice without subscription:', invoice.id);
    return;
  }

  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    const contractorId = subscription.metadata?.contractorId;

    if (!contractorId) {
      console.error('[stripe-webhook] No contractor ID in subscription metadata');
      return;
    }

    const invoiceNumber = `INV-${invoice.number || invoice.id.slice(-8).toUpperCase()}`;

    const { error: invoiceError } = await getSupabase().from('invoices')
      .upsert({
        contractor_id: contractorId,
        stripe_invoice_id: invoice.id,
        invoice_number: invoiceNumber,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'paid',
        invoice_pdf_url: invoice.invoice_pdf,
        period_start: new Date(invoice.period_start * 1000).toISOString(),
        period_end: new Date(invoice.period_end * 1000).toISOString(),
        paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
      }, {
        onConflict: 'stripe_invoice_id'
      });

    if (invoiceError) {
      console.error('[stripe-webhook] Error saving invoice:', invoiceError);
      return;
    }

    await sendInvoiceEmail(contractorId, invoice);
  } catch (error) {
    console.error('[stripe-webhook] Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return;
  }

  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    const contractorId = subscription.metadata?.contractorId;

    if (!contractorId) {
      return;
    }

    const { error: subscriptionError } = await getSupabase().from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (subscriptionError) {
      console.error('[stripe-webhook] Error updating subscription to past_due:', subscriptionError);
    }

    console.log(`[stripe-webhook] Subscription ${subscriptionId} → past_due (payment failed)`);

    await sendPaymentFailedEmail(contractorId, invoice.amount_due);
  } catch (error) {
    console.error('[stripe-webhook] Error handling payment failed:', error);
  }
}

async function sendSubscriptionConfirmationEmail(
  contractorId: string,
  tierName: string,
  billingPeriod: string
) {
  try {
    const { data: contractor } = await getSupabase().from('contractor_profiles')
      .select(`
        owner_name,
        company_name,
        user_id,
        users!inner (
          email
        )
      `)
      .eq('id', contractorId)
      .maybeSingle();

    if (!contractor) {
      console.error('[stripe-webhook] Contractor not found for confirmation email');
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contractor-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'subscription_confirmation',
          to: (contractor.users as any)?.email || ((contractor.users as any)?.[0]?.email),
          contractorName: contractor.owner_name,
          companyName: contractor.company_name,
          tierName,
          isAnnual: billingPeriod === 'annual',
        }),
      }
    );

    if (!response.ok) {
      console.error('[stripe-webhook] Failed to send confirmation email:', await response.text());
    }
  } catch (error) {
    console.error('[stripe-webhook] Error sending confirmation email:', error);
  }
}

async function sendPaymentFailedEmail(contractorId: string, amountDue: number) {
  try {
    const { data: contractor } = await getSupabase().from('contractor_profiles')
      .select(`
        owner_name,
        company_name,
        user_id,
        users!inner (
          email
        )
      `)
      .eq('id', contractorId)
      .maybeSingle();

    if (!contractor) {
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contractor-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'payment_failed',
          to: (contractor.users as any)?.email || ((contractor.users as any)?.[0]?.email),
          contractorName: contractor.owner_name,
          companyName: contractor.company_name,
          amountDue: (amountDue / 100).toFixed(2),
        }),
      }
    );

    if (!response.ok) {
      console.error('[stripe-webhook] Failed to send payment failed email:', await response.text());
    }
  } catch (error) {
    console.error('[stripe-webhook] Error sending payment failed email:', error);
  }
}

async function sendAddOnConfirmationEmail(contractorId: string, addOnName: string) {
  try {
    const { data: contractor } = await getSupabase().from('contractor_profiles')
      .select(`
        owner_name,
        company_name,
        user_id,
        users!inner (
          email
        )
      `)
      .eq('id', contractorId)
      .maybeSingle();

    if (!contractor) {
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contractor-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'addon_purchase_confirmation',
          to: (contractor.users as any)?.email || ((contractor.users as any)?.[0]?.email),
          contractorName: contractor.owner_name,
          addOnName,
        }),
      }
    );

    if (!response.ok) {
      console.error('[stripe-webhook] Failed to send add-on confirmation email:', await response.text());
    }
  } catch (error) {
    console.error('[stripe-webhook] Error sending add-on confirmation email:', error);
  }
}

async function sendSubscriptionActivatedWelcomeEmail(contractorId: string, tierName: string) {
  try {
    const { data: contractor } = await getSupabase().from('contractor_profiles')
      .select(`
        owner_name,
        company_name,
        user_id,
        users!inner (
          email
        )
      `)
      .eq('id', contractorId)
      .maybeSingle();

    if (!contractor) {
      console.error('[stripe-webhook] Contractor not found for welcome email');
      return;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contractor-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'subscription_activated_welcome',
          to: (contractor.users as any)?.email || ((contractor.users as any)?.[0]?.email),
          contractorName: contractor.owner_name,
          companyName: contractor.company_name,
          tierName,
        }),
      }
    );

    if (!response.ok) {
      console.error('[stripe-webhook] Failed to send welcome email:', await response.text());
    }
  } catch (error) {
    console.error('[stripe-webhook] Error sending welcome email:', error);
  }
}

async function sendInvoiceEmail(contractorId: string, invoice: any) {
  try {
    const { data: contractor } = await getSupabase().from('contractor_profiles')
      .select(`
        owner_name,
        company_name,
        user_id,
        users!inner (
          email
        )
      `)
      .eq('id', contractorId)
      .maybeSingle();

    if (!contractor) {
      console.error('[stripe-webhook] Contractor not found for invoice email');
      return;
    }

    const invoiceNumber = `INV-${invoice.number || invoice.id.slice(-8).toUpperCase()}`;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contractor-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          type: 'invoice',
          to: (contractor.users as any)?.email || ((contractor.users as any)?.[0]?.email),
          contractorName: contractor.owner_name,
          companyName: contractor.company_name,
          invoiceNumber,
          amount: (invoice.amount_paid / 100).toFixed(2),
          paidAt: new Date(invoice.status_transitions.paid_at * 1000).toLocaleDateString(),
          invoicePdfUrl: invoice.invoice_pdf,
        }),
      }
    );

    if (!response.ok) {
      console.error('[stripe-webhook] Failed to send invoice email:', await response.text());
    }
  } catch (error) {
    console.error('[stripe-webhook] Error sending invoice email:', error);
  }
}
