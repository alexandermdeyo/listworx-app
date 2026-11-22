import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { notifyAdmin, brandedEmail, detailRows, BASE_URL } from '@/lib/server/notify';
import { sendAdminPaidOrderEmail, sendCustomerMediaEmail } from '@/lib/server/media-emails';

export const isMediaSession = (session: any) => session?.metadata?.kind === 'media_order';

export class MediaNotificationError extends Error {}

/**
 * Claim-then-send: a notification is claimed with a conditional update, so
 * concurrent webhook deliveries can't both send it. If sending fails the claim
 * is released and the caller throws, so Stripe retries and the notice is sent
 * on a later delivery instead of being suppressed.
 */
async function sendOnce(orderId: string, column: 'admin_notified_at' | 'customer_notified_at', send: () => Promise<boolean>) {
  const db = createSupabaseAdminClient();
  const { data: claimed } = await db
    .from('media_orders')
    .update({ [column]: new Date().toISOString() })
    .eq('id', orderId)
    .is(column, null)
    .select('id')
    .maybeSingle();
  if (!claimed) return true; // already sent (or being sent) by another delivery
  const ok = await send().catch(() => false);
  if (!ok) await db.from('media_orders').update({ [column]: null }).eq('id', orderId);
  return ok;
}

/**
 * Verified checkout.session.completed for a media order. Only a session whose
 * payment_status is 'paid' marks the order paid. mark_media_order_paid() runs
 * the paid transition exactly once; notifications are tracked separately so a
 * failed email is retried on the next Stripe delivery.
 */
export async function handleMediaCheckoutCompleted(session: any) {
  if (session.payment_status !== 'paid') {
    console.warn('[media-webhook] session completed but not paid', session.id, session.payment_status);
    return;
  }
  const db = createSupabaseAdminClient();
  const { data: result, error } = await db.rpc('mark_media_order_paid', {
    p_session_id: session.id,
    p_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
    p_customer: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
  });
  if (error) throw error; // 500 → Stripe retries

  if (result === 'not_found') {
    // A paid media session with no order row. Money was taken: alert, don't retry forever.
    console.error('[media-webhook] paid session has no media order', session.id);
    await notifyAdmin(
      '🚨 Paid media checkout with no order record',
      brandedEmail({
        kicker: 'Admin alert',
        title: 'Payment received but no media order was found',
        body: detailRows([
          ['Stripe session', session.id],
          ['Amount', `$${((session.amount_total || 0) / 100).toFixed(2)}`],
          ['Customer email', session.customer_details?.email],
          ['Order id (metadata)', session.metadata?.media_order_id],
        ]) + '<p>Look up the payment in Stripe and contact the customer to schedule or refund.</p>',
      }),
    );
    return;
  }

  const { data: order } = await db
    .from('media_orders')
    .select('*, media_appointments(visit_number, status, starts_at, ends_at)')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle();
  if (!order) throw new Error(`media order vanished for session ${session.id}`);

  const appts = (order.media_appointments || []).filter((a: any) => a.status === 'requested');
  const needsScheduling = order.fulfillment_status === 'needs_scheduling';

  const adminOk = await sendOnce(order.id, 'admin_notified_at', () => sendAdminPaidOrderEmail(order, appts, { needsScheduling }));
  const customerOk = await sendOnce(order.id, 'customer_notified_at', () =>
    sendCustomerMediaEmail(needsScheduling ? 'paid_unscheduled' : 'paid', order, appts),
  );
  if (!adminOk || !customerOk) {
    throw new MediaNotificationError(`media order ${order.id} notification failed (admin=${adminOk} customer=${customerOk}); Stripe will retry`);
  }
}

/** Abandoned checkout: release the temporary hold. */
export async function handleMediaCheckoutExpired(session: any) {
  const db = createSupabaseAdminClient();
  const { data: order } = await db
    .from('media_orders')
    .update({ payment_status: 'expired', fulfillment_status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_checkout_session_id', session.id)
    .eq('payment_status', 'pending')
    .select('id')
    .maybeSingle();
  if (order?.id) await db.from('media_appointments').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('order_id', order.id).eq('status', 'hold');
}

export const ADMIN_ORDERS_URL = `${BASE_URL}/admin/crm/media-orders`;
