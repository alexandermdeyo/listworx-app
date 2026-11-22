import { sendEmail } from '@/lib/send-email';
import { notifyAdmin, brandedEmail, detailRows, esc, BASE_URL } from '@/lib/server/notify';
import { formatUsd } from '@/lib/media/catalog';

export type MediaOrderForEmail = {
  id: string;
  order_number: number;
  customer_name: string;
  business_name?: string | null;
  email: string;
  phone: string;
  project_address: string;
  project_notes?: string | null;
  line_items: Array<{ name: string; finalCents: number }>;
  total_cents: number;
  discount_cents: number;
  discount_percent: number;
};

export type AppointmentForEmail = { visit_number: number; starts_at: string; ends_at: string };

const TZ = 'America/Chicago';
export function formatAppointment(a: AppointmentForEmail): string {
  const d = new Date(a.starts_at);
  const day = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(d);
  const t = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(d);
  return `${day} at ${t}`;
}

const apptText = (appts: AppointmentForEmail[]) =>
  appts
    .slice()
    .sort((a, b) => a.visit_number - b.visit_number)
    .map((a) => (appts.length > 1 ? `Visit ${a.visit_number}: ${formatAppointment(a)}` : formatAppointment(a)))
    .join('\n');

const serviceText = (o: MediaOrderForEmail) => o.line_items.map((l) => l.name).join(', ');

/** Admin alert for a new PAID order. Built separately so it can be tested. */
export function buildAdminPaidOrderEmail(o: MediaOrderForEmail, appts: AppointmentForEmail[], opts: { needsScheduling?: boolean } = {}) {
  const subject = opts.needsScheduling
    ? `⚠️ Paid media order #${o.order_number} NEEDS SCHEDULING: requested time was lost`
    : `📸 Paid media order #${o.order_number}: ${serviceText(o)} · ${formatUsd(o.total_cents)}`;
  const warning = opts.needsScheduling
    ? '<p style="padding:12px;background:#fff4e5;border-radius:8px;color:#7a4b00"><strong>Action needed:</strong> payment succeeded, but at least one requested appointment was released before payment finished and that time is no longer free. Propose a new time to the customer, or cancel and refund.</p>'
    : '';
  const html = brandedEmail({
    kicker: 'Admin alert',
    title: opts.needsScheduling ? `Paid media order #${o.order_number} needs scheduling` : `New paid media order #${o.order_number}`,
    body:
      warning +
      detailRows([
        ['Customer', o.customer_name],
        ['Business', o.business_name],
        ['Phone', o.phone],
        ['Email', o.email],
        ['Service', serviceText(o)],
        ['Amount paid', formatUsd(o.total_cents)],
        ['Membership discount', o.discount_cents ? `${o.discount_percent}% (${formatUsd(o.discount_cents)})` : 'None'],
        ['Project address', o.project_address],
        ['Requested time', apptText(appts) || 'None held. Propose a time.'],
        ['Notes', o.project_notes],
      ]) + '<p style="margin-top:14px">Confirm the appointment or propose another time from the admin dashboard.</p>',
    ctaLabel: 'Open order',
    ctaHref: `${BASE_URL}/admin/crm/media-orders?order=${o.id}`,
  });
  return { subject, html };
}

/** Customer email per event. Never includes admin-only notes or provider details. */
export function buildCustomerMediaEmail(
  kind: 'paid' | 'paid_unscheduled' | 'confirmed' | 'proposed' | 'canceled' | 'refunded',
  o: MediaOrderForEmail,
  appts: AppointmentForEmail[],
  extra?: { refundCents?: number },
) {
  const first = esc(o.customer_name.split(' ')[0] || 'there');
  const when = esc(apptText(appts)).replace(/\n/g, '<br>');
  const ordersLink = `${BASE_URL}/media-services/orders`;
  const map = {
    paid: {
      subject: `Payment received: ListWorx Media order #${o.order_number}`,
      title: 'Payment received. Your appointment is pending confirmation.',
      body: `<p>Hi ${first},</p><p>Thanks for booking ListWorx Media Services. We received your payment of <strong>${formatUsd(o.total_cents)}</strong> for ${esc(serviceText(o))}.</p><p><strong>Requested time:</strong><br>${when || 'Not selected'}</p><p>Your appointment is <strong>requested, not yet confirmed</strong>. We'll email you to confirm it or suggest another time. This email is your receipt; Stripe also sends a payment receipt.</p>`,
    },
    paid_unscheduled: {
      subject: `Payment received: ListWorx Media order #${o.order_number}`,
      title: 'Payment received. We need to schedule your appointment.',
      body: `<p>Hi ${first},</p><p>Thanks for booking ListWorx Media Services. We received your payment of <strong>${formatUsd(o.total_cents)}</strong> for ${esc(serviceText(o))}.</p><p>The appointment time you picked was taken before checkout finished, so we'll contact you within one business day with another time. If none of our times work, we'll refund you in full. This email is your receipt; Stripe also sends a payment receipt.</p>`,
    },
    confirmed: {
      subject: `Confirmed: ListWorx Media appointment (order #${o.order_number})`,
      title: 'Your appointment is confirmed',
      body: `<p>Hi ${first},</p><p>Your ListWorx Media appointment for ${esc(serviceText(o))} is confirmed:</p><p><strong>${when}</strong></p><p>Location: ${esc(o.project_address)}</p><p>Need to change something? Reply to this email.</p>`,
    },
    proposed: {
      subject: `New time proposed: ListWorx Media order #${o.order_number}`,
      title: 'We proposed a new appointment time',
      body: `<p>Hi ${first},</p><p>We can't make the time you requested, so we'd like to propose:</p><p><strong>${when}</strong></p><p>Reply to this email to accept it or suggest another time. If none of our times work for you, we can cancel and refund your order.</p>`,
    },
    canceled: {
      subject: `Canceled: ListWorx Media order #${o.order_number}`,
      title: 'Your media order was canceled',
      body: `<p>Hi ${first},</p><p>Your ListWorx Media order #${o.order_number} for ${esc(serviceText(o))} has been canceled. If a refund applies, you'll receive a separate refund email.</p><p>Questions? Reply to this email.</p>`,
    },
    refunded: {
      subject: `Refund issued: ListWorx Media order #${o.order_number}`,
      title: 'Your refund is on the way',
      body: `<p>Hi ${first},</p><p>We issued a refund of <strong>${formatUsd(extra?.refundCents || 0)}</strong> for ListWorx Media order #${o.order_number}. Refunds usually reach your card within 5 to 10 business days, depending on your bank.</p>`,
    },
  }[kind];
  return {
    subject: map.subject,
    html: brandedEmail({ kicker: 'ListWorx Media Services', title: map.title, body: map.body, ctaLabel: 'View your orders', ctaHref: ordersLink }),
  };
}

export async function sendCustomerMediaEmail(
  kind: Parameters<typeof buildCustomerMediaEmail>[0],
  o: MediaOrderForEmail,
  appts: AppointmentForEmail[],
  extra?: { refundCents?: number },
) {
  const { subject, html } = buildCustomerMediaEmail(kind, o, appts, extra);
  try {
    await sendEmail({ to: o.email, subject, html, replyTo: 'adeyo@listworx.co' });
    return true;
  } catch (err) {
    console.error('[media-email] customer send failed', kind, o.id, err);
    return false;
  }
}

export async function sendAdminPaidOrderEmail(o: MediaOrderForEmail, appts: AppointmentForEmail[], opts: { needsScheduling?: boolean } = {}) {
  const { subject, html } = buildAdminPaidOrderEmail(o, appts, opts);
  return notifyAdmin(subject, html, o.email);
}
