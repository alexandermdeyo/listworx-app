'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminApiPage, { adminBtn, adminBtnGhost, adminInput } from '@/components/admin/AdminApiPage';
import { authFetch } from '@/lib/auth-fetch';
import { FULFILLMENT_LABELS, FULFILLMENT_TRANSITIONS, formatUsd, type FulfillmentStatus } from '@/lib/media/catalog';

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-US', { timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

function OrderCard({ order, onChange }: { order: any; onChange: (o: any) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [propose, setPropose] = useState({ visit: '1', when: '' });
  const [refund, setRefund] = useState('');
  const [fields, setFields] = useState({ assigned_provider: order.assigned_provider || '', admin_notes: order.admin_notes || '', deliverables_url: order.deliverables_url || '' });

  async function act(body: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setMsg('');
    const r = await authFetch(`/api/admin/media/orders/${order.id}`, { method: 'POST', body: JSON.stringify(body) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg(j.error || 'Failed');
    setMsg(j.message ? `Saved: ${j.message}` : 'Saved');
    onChange(j.order);
  }

  const next = FULFILLMENT_TRANSITIONS[order.fulfillment_status as FulfillmentStatus] || [];
  const appts = (order.media_appointments || []).filter((a: any) => !['expired', 'canceled'].includes(a.status)).sort((a: any, b: any) => a.visit_number - b.visit_number);
  const refundable = ['paid', 'partially_refunded'].includes(order.payment_status) ? order.total_cents - order.refunded_cents : 0;
  const needsScheduling = order.fulfillment_status === 'needs_scheduling';

  return (
    <div className="space-y-4 border-t border-zinc-800 p-5 text-sm">
      {needsScheduling && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-amber-200">
          Paid, but a requested time was lost before payment finished. Propose a new time for each missing visit, or cancel and refund.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="font-semibold text-zinc-300">Customer</p>
          <p>{order.customer_name}{order.business_name ? ` · ${order.business_name}` : ''}</p>
          <p><a className="text-[#E07A3F]" href={`mailto:${order.email}`}>{order.email}</a> · <a className="text-[#E07A3F]" href={`tel:${order.phone}`}>{order.phone}</a></p>
          <p className="text-zinc-400">{order.customer_type}{order.membership_tier ? ` · ${order.membership_tier}` : ''}</p>
        </div>
        <div>
          <p className="font-semibold text-zinc-300">Project</p>
          <p>{order.project_address}</p>
          {order.project_notes && <p className="whitespace-pre-wrap text-zinc-400">{order.project_notes}</p>}
        </div>
        <div>
          <p className="font-semibold text-zinc-300">Payment</p>
          {(order.line_items || []).map((l: any) => <p key={l.code}>{l.name}: {formatUsd(l.retailCents)}</p>)}
          <p>Discount: {order.discount_cents ? `${order.discount_percent}% (-${formatUsd(order.discount_cents)})` : 'none'}</p>
          <p className="font-semibold">Paid: {formatUsd(order.total_cents)} · {order.payment_status}</p>
          {order.refunded_cents > 0 && <p className="text-amber-300">Refunded {formatUsd(order.refunded_cents)}</p>}
          <p className="break-all text-xs text-zinc-500">{order.stripe_payment_intent_id || order.stripe_checkout_session_id}</p>
        </div>
      </div>

      <div>
        <p className="font-semibold text-zinc-300">Appointments</p>
        {appts.length ? appts.map((a: any) => (
          <p key={a.id}>Visit {a.visit_number}: {fmt(a.starts_at)} to {fmt(a.ends_at).split(', ').pop()} · <strong>{a.status}</strong>{a.requested_starts_at && a.requested_starts_at !== a.starts_at ? ` (requested ${fmt(a.requested_starts_at)})` : ''}</p>
        )) : <p className="text-zinc-400">No live appointment. Propose a time.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {next.includes('confirmed') && <button disabled={busy} className={adminBtn} onClick={() => act({ action: 'confirm' }, 'Confirm this appointment and email the customer?')}>Confirm appointment</button>}
        {(['in_progress', 'delivered', 'completed'] as const).filter((s) => next.includes(s)).map((s) => (
          <button key={s} disabled={busy} className={adminBtnGhost} onClick={() => act({ action: 'status', to: s })}>Mark {FULFILLMENT_LABELS[s].toLowerCase()}</button>
        ))}
        {next.includes('canceled') && <button disabled={busy} className={`${adminBtnGhost} text-red-300`} onClick={() => act({ action: 'cancel' }, 'Cancel this order and email the customer? Refunds are separate.')}>Cancel order</button>}
      </div>

      {next.includes('reschedule_proposed') && (
        <div className="flex flex-wrap items-end gap-2">
          {order.service_code === 'before_after' && (
            <select className={adminInput} value={propose.visit} onChange={(e) => setPropose({ ...propose, visit: e.target.value })}>
              <option value="1">Visit 1</option>
              <option value="2">Visit 2</option>
            </select>
          )}
          <input type="datetime-local" className={adminInput} value={propose.when} onChange={(e) => setPropose({ ...propose, when: e.target.value })} />
          <button disabled={busy || !propose.when} className={adminBtnGhost} onClick={() => act({ action: 'propose', visit: Number(propose.visit), starts_at: new Date(propose.when).toISOString() }, 'Propose this time and email the customer?')}>Propose new time</button>
          <span className="text-xs text-zinc-500">Your browser time zone</span>
        </div>
      )}

      {refundable > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <input className={adminInput} placeholder={`Refund amount (max ${formatUsd(refundable)})`} value={refund} onChange={(e) => setRefund(e.target.value)} />
          <button
            disabled={busy}
            className={`${adminBtnGhost} text-amber-300`}
            onClick={() => {
              const cents = refund ? Math.round(parseFloat(refund) * 100) : refundable;
              act({ action: 'refund', amount_cents: cents }, `Refund ${formatUsd(cents)} through Stripe? This cannot be undone.`);
            }}
          >
            Issue refund
          </button>
          <span className="text-xs text-zinc-500">Blank = full remaining amount</span>
        </div>
      )}

      <div className="grid gap-2 md:grid-cols-3">
        <input className={adminInput} placeholder="Assigned provider (internal)" value={fields.assigned_provider} onChange={(e) => setFields({ ...fields, assigned_provider: e.target.value })} />
        <input className={adminInput} placeholder="Deliverables link (customer sees this)" value={fields.deliverables_url} onChange={(e) => setFields({ ...fields, deliverables_url: e.target.value })} />
        <input className={adminInput} placeholder="Admin notes (internal)" value={fields.admin_notes} onChange={(e) => setFields({ ...fields, admin_notes: e.target.value })} />
      </div>
      <div className="flex items-center gap-3">
        <button disabled={busy} className={adminBtnGhost} onClick={() => act({ action: 'update', ...fields })}>Save details</button>
        {msg && <span className={msg.startsWith('Saved') ? 'text-green-400' : 'text-red-400'}>{msg}</span>}
      </div>
    </div>
  );
}

function Orders() {
  const params = useSearchParams();
  const [orders, setOrders] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(params.get('order'));
  const [filter, setFilter] = useState('active');
  const [unpaid, setUnpaid] = useState(false);

  const load = useCallback(async () => {
    const r = await authFetch(`/api/admin/media/orders${unpaid ? '?unpaid=1' : ''}`);
    const j = await r.json();
    if (!r.ok) return setError(r.status === 401 ? 'Admin sign-in required.' : j.error);
    setOrders(j.orders);
  }, [unpaid]);
  useEffect(() => { load(); }, [load]);

  const shown = (orders || []).filter((o) =>
    filter === 'all' ? true : filter === 'active' ? !['completed', 'canceled'].includes(o.fulfillment_status) : o.fulfillment_status === filter,
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select className={adminInput} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="active">Open orders</option>
          <option value="all">All</option>
          {Object.entries(FULFILLMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-400"><input type="checkbox" checked={unpaid} onChange={(e) => setUnpaid(e.target.checked)} /> Include unpaid/abandoned checkouts</label>
      </div>
      {error && <p className="text-red-400">{error}</p>}
      {orders && !shown.length && <p className="text-zinc-400">No orders.</p>}
      <div className="space-y-3">
        {shown.map((o) => {
          const appt = (o.media_appointments || []).filter((a: any) => !['expired', 'canceled'].includes(a.status)).sort((a: any, b: any) => a.visit_number - b.visit_number)[0];
          return (
            <div key={o.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
              <button className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left" onClick={() => setOpen(open === o.id ? null : o.id)}>
                <div>
                  <p className="font-semibold">#{o.order_number} · {o.business_name || o.customer_name}</p>
                  <p className="text-sm text-zinc-400">{(o.line_items || []).map((l: any) => l.name).join(', ')}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{appt ? fmt(appt.starts_at) : 'No time'}</p>
                  <p className="text-zinc-400">{FULFILLMENT_LABELS[o.fulfillment_status as FulfillmentStatus]} · {formatUsd(o.total_cents)} {o.payment_status}</p>
                </div>
              </button>
              {open === o.id && <OrderCard order={o} onChange={(u) => setOrders((list) => (list || []).map((x) => (x.id === u.id ? { ...x, ...u } : x)))} />}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function AdminMediaOrdersPage() {
  return (
    <AdminApiPage title="Media orders" description="Paid ListWorx Media Services orders. Confirm, reschedule, deliver, or refund.">
      <Suspense fallback={null}>
        <Orders />
      </Suspense>
    </AdminApiPage>
  );
}
