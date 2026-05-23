import { NextRequest, NextResponse } from 'next/server';
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
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

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
