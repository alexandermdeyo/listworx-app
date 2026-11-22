import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { sendAdminPaidOrderEmail, sendCustomerMediaEmail } from '@/lib/server/media-emails';

export const isMediaSession = (session: any) => session?.metadata?.kind === 'media_order';

/**
 * Verified checkout.session.completed for a media order. Only a session whose
 * payment_status is 'paid' marks the order paid. mark_media_order_paid() flips
 * the order exactly once, so Stripe retries never send duplicate emails.
 */
export async function handleMediaCheckoutCompleted(session: any) {
  if (session.payment_status !== 'paid') {
    console.warn('[media-webhook] session completed but not paid', session.id, session.payment_status);
    return;
  }
  const db = createSupabaseAdminClient();
  const { data: firstTime, error } = await db.rpc('mark_media_order_paid', {
    p_session_id: session.id,
    p_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
    p_customer: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
  });
  if (error) throw error; // 500 → Stripe retries
  if (!firstTime) return; // already processed (retry or duplicate)

  const { data: order } = await db
    .from('media_orders')
    .select('*, media_appointments(visit_number, status, starts_at, ends_at)')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle();
  if (!order) return;
  const appts = (order.media_appointments || []).filter((a: any) => a.status === 'requested');
  await sendAdminPaidOrderEmail(order, appts);
  await sendCustomerMediaEmail('paid', order, appts);
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
