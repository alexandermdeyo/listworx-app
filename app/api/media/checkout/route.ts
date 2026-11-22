import { NextRequest, NextResponse } from 'next/server';
import { createStripeServerClient } from '@/lib/stripe-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { buildMediaQuote, MediaQuoteError, visitMinutes } from '@/lib/media/catalog';
import { availableSlots, isPublishedSlot, localDate, slotFor, slotsOverlap } from '@/lib/media/schedule';
import { getRequestUser } from '@/lib/server/require-admin';
import { getVerifiedMembership } from '@/lib/server/membership';
import { loadScheduleContext } from '@/lib/server/media-schedule';

export const dynamic = 'force-dynamic';

const clean = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);

/**
 * Creates a media order, reserves the requested time(s) atomically, and opens
 * Stripe Checkout. Prices and discounts are computed here from the catalog and
 * the caller's verified membership. The order is only marked paid by the
 * verified Stripe webhook, never by the success redirect.
 */
export async function POST(request: NextRequest) {
  const db = createSupabaseAdminClient();
  let orderId: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    const user = await getRequestUser(request);
    const membership = user ? await getVerifiedMembership(user.id) : null;
    const quote = buildMediaQuote(body.service, body.addons, membership?.tier || null);

    const customer = {
      name: clean(body.name, 120),
      business: clean(body.business, 160),
      email: clean(body.email, 200).toLowerCase(),
      phone: clean(body.phone, 40),
      address: clean(body.address, 300),
      notes: clean(body.notes, 2000),
    };
    if (!customer.name || !customer.phone || !customer.address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return NextResponse.json({ error: 'Name, email, phone, and project address are required.' }, { status: 400 });
    }

    // Validate each requested start against published availability.
    const starts: string[] = Array.isArray(body.appointments) ? body.appointments.map(String) : [];
    if (starts.length !== quote.visits) {
      return NextResponse.json({ error: quote.visits === 2 ? 'Choose a time for both visits.' : 'Choose an appointment time.' }, { status: 400 });
    }
    const ctx = await loadScheduleContext();
    const slots = starts.map((startIso, i) => {
      const minutes = visitMinutes(quote, ctx.settings.durations, i + 1);
      const date = localDate(new Date(startIso), ctx.settings.timezone);
      const open = availableSlots({ date, durationMinutes: minutes, settings: ctx.settings, rules: ctx.rules, exceptions: ctx.exceptions, busy: ctx.busy });
      if (!isPublishedSlot(startIso, open)) throw new MediaQuoteError('That time is no longer available. Please choose another.');
      return slotFor(new Date(startIso), minutes, ctx.settings.buffer_minutes, ctx.settings.timezone);
    });
    if (slots.length === 2) {
      if (Date.parse(slots[1].starts_at) <= Date.parse(slots[0].starts_at)) throw new MediaQuoteError('The after visit must come after the before visit.');
      if (slotsOverlap(slots[0], slots[1])) throw new MediaQuoteError('The two visits overlap. Choose a later time for the second visit.');
    }

    const customerType = membership?.contractorId ? 'contractor' : membership?.isRealtor ? 'realtor' : 'guest';
    const holdMinutes = Math.max(31, ctx.settings.hold_minutes);
    const sessionExpires = Math.floor(Date.now() / 1000) + holdMinutes * 60;
    const holdExpiresAt = new Date((sessionExpires + 10 * 60) * 1000).toISOString();

    const { data: order, error: orderErr } = await db
      .from('media_orders')
      .insert({
        customer_user_id: user?.id || null,
        customer_type: customerType,
        contractor_id: membership?.contractorId || null,
        customer_name: customer.name,
        business_name: customer.business || null,
        email: customer.email,
        phone: customer.phone,
        project_address: customer.address,
        project_notes: customer.notes || null,
        service_code: quote.service.code,
        addon_codes: quote.addons.map((a) => a.code),
        line_items: quote.lines,
        retail_cents: quote.retailCents,
        discount_percent: quote.discountPercent,
        discount_cents: quote.discountCents,
        total_cents: quote.totalCents,
        membership_tier: membership?.tier || null,
        hold_expires_at: holdExpiresAt,
      })
      .select('id, order_number')
      .single();
    if (orderErr || !order) throw orderErr || new Error('order insert failed');
    orderId = order.id;

    const { error: reserveErr } = await db.rpc('reserve_media_appointments', {
      p_order_id: order.id,
      p_slots: slots.map((s, i) => ({ visit: i + 1, starts_at: s.starts_at, ends_at: s.ends_at, block_start: s.block_start, block_end: s.block_end })),
      p_hold_expires_at: holdExpiresAt,
    });
    if (reserveErr) {
      await db.from('media_orders').delete().eq('id', order.id);
      orderId = null;
      const taken = reserveErr.code === '23P01' || /exclu|overlap/i.test(reserveErr.message || '');
      return NextResponse.json(
        { error: taken ? 'Someone just booked that time. Please choose another.' : 'Could not hold that time.' },
        { status: taken ? 409 : 500 },
      );
    }

    const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://listworx.co';
    const stripe = createStripeServerClient();
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: customer.email,
        client_reference_id: order.id,
        expires_at: sessionExpires,
        line_items: quote.lines.map((l) => ({
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: l.finalCents,
            product_data: {
              name: `ListWorx Media: ${l.name}`,
              description: quote.discountPercent
                ? `Retail ${(l.retailCents / 100).toFixed(2)} less ${quote.discountPercent}% membership discount`
                : undefined,
            },
          },
        })),
        metadata: { kind: 'media_order', media_order_id: order.id, order_number: String(order.order_number) },
        payment_intent_data: { metadata: { kind: 'media_order', media_order_id: order.id }, description: `ListWorx Media order #${order.order_number}` },
        success_url: `${baseUrl}/media-services/orders?paid=${order.id}`,
        cancel_url: `${baseUrl}/media-services/book?service=${quote.service.code}&canceled=1`,
      },
      { idempotencyKey: `media-order-${order.id}` },
    );

    await db.from('media_orders').update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() }).eq('id', order.id);
    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (err: any) {
    if (orderId) {
      // Release the hold and remove the unpaid order if checkout could not start.
      await db.from('media_appointments').update({ status: 'expired' }).eq('order_id', orderId).eq('status', 'hold');
      await db.from('media_orders').update({ payment_status: 'expired', fulfillment_status: 'canceled' }).eq('id', orderId).eq('payment_status', 'pending');
    }
    if (err instanceof MediaQuoteError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error('[media/checkout]', err);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 });
  }
}
