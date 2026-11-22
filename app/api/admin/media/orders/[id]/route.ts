import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { createStripeServerClient } from '@/lib/stripe-server';
import { requireAdminRequest } from '@/lib/server/require-admin';
import { buildMediaQuote, canTransition, visitMinutes } from '@/lib/media/catalog';
import { slotFor } from '@/lib/media/schedule';
import { loadScheduleContext } from '@/lib/server/media-schedule';
import { sendCustomerMediaEmail } from '@/lib/server/media-emails';

export const dynamic = 'force-dynamic';

const now = () => new Date().toISOString();
const LIVE_APPT = ['requested', 'proposed', 'confirmed'];

async function loadOrder(id: string) {
  const { data } = await createSupabaseAdminClient()
    .from('media_orders')
    .select('*, media_appointments(id, visit_number, status, starts_at, ends_at)')
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
      const appts = liveAppts(order);
      if (!appts.length) return fail('Propose a time first: this order has no appointment.');
      await db.from('media_appointments').update({ status: 'confirmed', confirmed_at: now(), updated_at: now() }).eq('order_id', order.id).in('status', ['requested', 'proposed']);
      await db.from('media_orders').update({ fulfillment_status: 'confirmed', updated_at: now() }).eq('id', order.id);
      const fresh = await loadOrder(order.id);
      await sendCustomerMediaEmail('confirmed', fresh, liveAppts(fresh));
    } else if (action === 'propose') {
      if (!canTransition(order.fulfillment_status, 'reschedule_proposed', order.payment_status)) return fail('Cannot propose a new time for this order.');
      const visit = Number(body.visit) === 2 ? 2 : 1;
      const start = new Date(String(body.starts_at || ''));
      if (!Number.isFinite(start.getTime()) || start.getTime() < Date.now()) return fail('Choose a future date and time.');
      const quote = buildMediaQuote(order.service_code, order.addon_codes || [], null);
      if (visit > quote.visits) return fail('This service has one visit.');
      const ctx = await loadScheduleContext();
      const minutes = visitMinutes(quote, ctx.settings.durations, visit);
      const slot = slotFor(start, minutes, ctx.settings.buffer_minutes, ctx.settings.timezone);
      const existing = (order.media_appointments || []).find((a: any) => a.visit_number === visit && LIVE_APPT.includes(a.status));
      const row = { status: 'proposed', starts_at: slot.starts_at, ends_at: slot.ends_at, block_start: slot.block_start, block_end: slot.block_end, confirmed_at: null, updated_at: now() };
      const { error } = existing
        ? await db.from('media_appointments').update(row).eq('id', existing.id)
        : await db.from('media_appointments').insert({ ...row, order_id: order.id, visit_number: visit });
      if (error) return fail(error.code === '23P01' ? 'That time overlaps another appointment or block.' : error.message, error.code === '23P01' ? 409 : 500);
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
      if (!['paid', 'partially_refunded'].includes(order.payment_status) || !order.stripe_payment_intent_id) return fail('Only paid orders can be refunded.');
      const remaining = order.total_cents - order.refunded_cents;
      const amount = body.amount_cents ? Math.round(Number(body.amount_cents)) : remaining;
      if (!(amount > 0 && amount <= remaining)) return fail(`Refund must be between $0.01 and $${(remaining / 100).toFixed(2)}.`);
      const refund = await createStripeServerClient().refunds.create(
        { payment_intent: order.stripe_payment_intent_id, amount, metadata: { media_order_id: order.id } },
        { idempotencyKey: `media-refund-${order.id}-${order.refunded_cents}-${amount}` },
      );
      const refunded = order.refunded_cents + amount;
      await db
        .from('media_orders')
        .update({
          refunded_cents: refunded,
          refunded_at: now(),
          payment_status: refunded >= order.total_cents ? 'refunded' : 'partially_refunded',
          stripe_refund_ids: [...(order.stripe_refund_ids || []), refund.id],
          updated_at: now(),
        })
        .eq('id', order.id)
        .eq('refunded_cents', order.refunded_cents); // guards double submits
      await sendCustomerMediaEmail('refunded', order, [], { refundCents: amount });
    } else {
      return fail('Unknown action');
    }
    return NextResponse.json({ ok: true, order: await loadOrder(order.id) });
  } catch (err: any) {
    console.error('[admin/media/orders]', action, err);
    return fail(err?.message || 'Action failed', 500);
  }
}

