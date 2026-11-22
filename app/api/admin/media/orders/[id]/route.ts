import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { createStripeServerClient } from '@/lib/stripe-server';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { buildMediaQuote, canTransition, visitMinutes } from '@/lib/media/catalog';
import { availableSlots, isPublishedSlot, localDate, slotFor, slotsOverlap } from '@/lib/media/schedule';
import { loadScheduleContext } from '@/lib/server/media-schedule';
import { sendCustomerMediaEmail } from '@/lib/server/media-emails';
import { reconcileRefunds, liveVisitCount } from '@/lib/media/refunds';

export const dynamic = 'force-dynamic';

const now = () => new Date().toISOString();
const LIVE_APPT = ['requested', 'proposed', 'confirmed'];
const REFUND_LOCK_MS = 2 * 60_000;

async function loadOrder(id: string) {
  const { data } = await createSupabaseAdminClient()
    .from('media_orders')
    .select('*, media_appointments(id, visit_number, status, starts_at, ends_at, block_start, block_end)')
    .eq('id', id)
    .maybeSingle();
  return data;
}

const liveAppts = (o: any) => (o.media_appointments || []).filter((a: any) => LIVE_APPT.includes(a.status));

/** ADMIN actions on one media order. Every action is explicit; nothing is automatic. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = createSupabaseAdminClient();
  const body = await request.json().catch(() => ({}));
  const order = await loadOrder(params.id);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const action = String(body.action || '');
  const fail = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

  try {
    if (action === 'update') {
      const patch: Record<string, unknown> = { updated_at: now() };
      for (const k of ['assigned_provider', 'admin_notes', 'deliverables_url']) if (k in body) patch[k] = String(body[k] ?? '').slice(0, 4000) || null;
      await db.from('media_orders').update(patch).eq('id', order.id);
    } else if (action === 'confirm') {
      if (!canTransition(order.fulfillment_status, 'confirmed', order.payment_status)) return fail('This order cannot be confirmed (it must be paid and awaiting confirmation).');
      if (liveVisitCount(liveAppts(order)) < (order.visits_required || 1)) {
        return fail(order.visits_required === 2 ? 'Both visits need a time before confirming. Propose the missing visit first.' : 'Propose a time first: this order has no appointment.');
      }
      await db.from('media_appointments').update({ status: 'confirmed', confirmed_at: now(), updated_at: now() }).eq('order_id', order.id).in('status', ['requested', 'proposed']);
      await db.from('media_orders').update({ fulfillment_status: 'confirmed', updated_at: now() }).eq('id', order.id);
      const fresh = await loadOrder(order.id);
      await sendCustomerMediaEmail('confirmed', fresh, liveAppts(fresh));
    } else if (action === 'propose') {
      if (!canTransition(order.fulfillment_status, 'reschedule_proposed', order.payment_status)) return fail('Cannot propose a new time for this order.');
      const quote = buildMediaQuote(order.service_code, order.addon_codes || [], null);
      const visit = Number(body.visit) === 2 ? 2 : 1;
      if (visit > quote.visits) return fail('This service has one visit.');
      const start = new Date(String(body.starts_at || ''));
      if (!Number.isFinite(start.getTime())) return fail('Choose a date and time.');
      const startIso = start.toISOString();

      // Same rules customers get: published hours, notice window, and no conflict with
      // any other live booking or block. This order's own rows are excluded so a
      // visit can move within its own time; its other visit is checked below.
      const ctx = await loadScheduleContext(order.id);
      const minutes = visitMinutes(quote, ctx.settings.durations, visit);
      const open = availableSlots({ date: localDate(start, ctx.settings.timezone), durationMinutes: minutes, settings: ctx.settings, rules: ctx.rules, exceptions: ctx.exceptions, busy: ctx.busy });
      if (!isPublishedSlot(startIso, open)) {
        return fail('That time is outside published availability or conflicts with another booking. Add hours or an extra open date first if needed.', 409);
      }
      const slot = slotFor(start, minutes, ctx.settings.buffer_minutes, ctx.settings.timezone);
      const other = liveAppts(order).find((a: any) => a.visit_number !== visit);
      if (other) {
        if (slotsOverlap(slot, other)) return fail('That time overlaps the other visit on this order.', 409);
        const first = visit === 1 ? slot.starts_at : other.starts_at;
        const second = visit === 1 ? other.starts_at : slot.starts_at;
        if (Date.parse(second) <= Date.parse(first)) return fail('Visit 2 must come after visit 1.');
      }

      const existing = (order.media_appointments || []).find((a: any) => a.visit_number === visit && LIVE_APPT.includes(a.status));
      const row = { status: 'proposed', starts_at: slot.starts_at, ends_at: slot.ends_at, block_start: slot.block_start, block_end: slot.block_end, confirmed_at: null, updated_at: now() };
      const { error } = existing
        ? await db.from('media_appointments').update(row).eq('id', existing.id)
        : await db.from('media_appointments').insert({ ...row, order_id: order.id, visit_number: visit });
      // The database exclusion constraint is the final guard against a race.
      if (error) return fail(error.code === '23P01' ? 'That time was just taken by another booking.' : error.message, error.code === '23P01' ? 409 : 500);
      await db.from('media_orders').update({ fulfillment_status: 'reschedule_proposed', updated_at: now() }).eq('id', order.id);
      const fresh = await loadOrder(order.id);
      await sendCustomerMediaEmail('proposed', fresh, liveAppts(fresh));
    } else if (action === 'status') {
      const to = String(body.to || '');
      if (!['in_progress', 'delivered', 'completed'].includes(to) || !canTransition(order.fulfillment_status, to, order.payment_status)) return fail(`Cannot move from ${order.fulfillment_status} to ${to}.`);
      await db.from('media_orders').update({ fulfillment_status: to, updated_at: now() }).eq('id', order.id);
      if (to === 'completed') await db.from('media_appointments').update({ status: 'completed', updated_at: now() }).eq('order_id', order.id).eq('status', 'confirmed');
    } else if (action === 'cancel') {
      if (!canTransition(order.fulfillment_status, 'canceled', order.payment_status)) return fail('This order cannot be canceled.');
      await db.from('media_appointments').update({ status: 'canceled', updated_at: now() }).eq('order_id', order.id).in('status', ['hold', ...LIVE_APPT]);
      await db.from('media_orders').update({ fulfillment_status: 'canceled', updated_at: now() }).eq('id', order.id);
      if (order.payment_status !== 'pending') await sendCustomerMediaEmail('canceled', order, []);
    } else if (action === 'refund') {
      return await refund(order, body, fail);
    } else {
      return fail('Unknown action');
    }
    return NextResponse.json({ ok: true, order: await loadOrder(order.id) });
  } catch (err: any) {
    console.error('[admin/media/orders]', action, err);
    return fail(err?.message || 'Action failed', 500);
  }
}

/**
 * Retry-safe refund:
 *  1. Claim a short refund lock (concurrent requests are rejected).
 *  2. Read Stripe's actual refunds for the payment and record them first. If
 *     Stripe already shows refunds the database missed (a failed write or a
 *     retried click), record them and stop: no new refund is created.
 *  3. Otherwise create the refund with an idempotency key tied to the
 *     already-refunded total, then re-read Stripe and record the real result.
 *  4. Email the customer only after the database holds the refunded amount.
 */
async function refund(order: any, body: any, fail: (m: string, s?: number) => NextResponse) {
  const db = createSupabaseAdminClient();
  if (!order.stripe_payment_intent_id || !['paid', 'partially_refunded', 'refunded'].includes(order.payment_status)) return fail('Only paid orders can be refunded.');

  const staleBefore = new Date(Date.now() - REFUND_LOCK_MS).toISOString();
  const { data: locked } = await db
    .from('media_orders')
    .update({ refund_lock_at: now() })
    .eq('id', order.id)
    .or(`refund_lock_at.is.null,refund_lock_at.lt.${staleBefore}`)
    .select('id')
    .maybeSingle();
  if (!locked) return fail('A refund for this order is already in progress. Wait a moment and refresh.', 409);

  const stripe = createStripeServerClient();
  const record = async () => {
    const list = await stripe.refunds.list({ payment_intent: order.stripe_payment_intent_id, limit: 100 });
    const r = reconcileRefunds(order.total_cents, list.data as any);
    const { error } = await db
      .from('media_orders')
      .update({
        refunded_cents: r.refundedCents,
        stripe_refund_ids: r.refundIds,
        payment_status: r.paymentStatus,
        refunded_at: r.refundedCents > 0 ? now() : null,
        updated_at: now(),
      })
      .eq('id', order.id);
    if (error) throw new Error(`Refund is in Stripe but could not be saved (${error.message}). Click refund again to sync; no second refund will be issued.`);
    return r;
  };

  try {
    const before = await record();
    let issued = false;
    if (before.refundedCents === Number(order.refunded_cents || 0)) {
      const remaining = order.total_cents - before.refundedCents;
      const amount = body.amount_cents ? Math.round(Number(body.amount_cents)) : remaining;
      if (!(amount > 0 && amount <= remaining)) return fail(remaining > 0 ? `Refund must be between $0.01 and $${(remaining / 100).toFixed(2)}.` : 'This order is fully refunded.');
      await stripe.refunds.create(
        { payment_intent: order.stripe_payment_intent_id, amount, metadata: { media_order_id: order.id } },
        { idempotencyKey: `media-refund-${order.id}-after-${before.refundedCents}-${amount}` },
      );
      issued = true;
    }
    const after = issued ? await record() : before;

    // Notify only what is recorded and not yet notified.
    const unnotified = after.refundedCents - Number(order.refund_notified_cents || 0);
    if (unnotified > 0) {
      const sent = await sendCustomerMediaEmail('refunded', order, [], { refundCents: unnotified });
      if (sent) await db.from('media_orders').update({ refund_notified_cents: after.refundedCents }).eq('id', order.id);
    }
    return NextResponse.json({
      ok: true,
      reconciled: !issued,
      message: issued ? 'Refund issued and recorded.' : 'Stripe already had a refund the database was missing. It is now recorded; no new refund was issued.',
      order: await loadOrder(order.id),
    });
  } finally {
    await db.from('media_orders').update({ refund_lock_at: null }).eq('id', order.id);
  }
}
