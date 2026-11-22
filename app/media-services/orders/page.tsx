'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { authFetch } from '@/lib/auth-fetch';
import { FULFILLMENT_LABELS, formatUsd, type FulfillmentStatus } from '@/lib/media/catalog';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

const APPT_LABEL: Record<string, string> = { hold: 'Held during checkout', requested: 'Requested, pending confirmation', proposed: 'New time proposed', confirmed: 'Confirmed', completed: 'Completed' };

function Orders() {
  const params = useSearchParams();
  const [orders, setOrders] = useState<any[] | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  useEffect(() => {
    authFetch('/api/media/my-orders').then(async (r) => {
      if (r.status === 401) return setSignedOut(true);
      const j = await r.json();
      setOrders(j.orders || []);
    });
  }, []);

  return (
    <div className="container mx-auto max-w-4xl px-4">
      {params.get('paid') && (
        <div className="mb-6 rounded-xl border border-lw-rust/50 bg-lw-rust/10 p-5 text-sm">
          <p className="font-semibold">Thanks! Your checkout is complete.</p>
          <p className="mt-1 text-white/70">
            Your appointment is <strong>requested, pending confirmation</strong>. We&apos;ll email your receipt and then confirm the time or suggest another one. Payment status updates
            here once Stripe confirms it.
          </p>
        </div>
      )}
      {signedOut && (
        <p className="text-white/70">
          <Link className="text-lw-rust underline" href="/login?redirect=/media-services/orders">Sign in</Link> to see orders placed with your account. Orders placed without signing in are tracked by email.
        </p>
      )}
      {orders && !orders.length && <p className="text-white/60">No media orders yet. <Link href="/media-services" className="text-lw-rust underline">Browse services</Link>.</p>}
      <div className="space-y-4">
        {(orders || []).map((o) => (
          <div key={o.id} className="rounded-2xl border border-mailer-border bg-mailer-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">Order #{o.order_number}</p>
                <p className="mt-1 font-semibold">{(o.line_items || []).map((l: any) => l.name).join(', ')}</p>
                <p className="text-sm text-white/55">{o.project_address}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatUsd(o.total_cents)}</p>
                <p className="text-xs text-white/50">{o.payment_status === 'pending' ? 'Payment processing' : o.payment_status.replace('_', ' ')}</p>
              </div>
            </div>
            <p className="mt-4 inline-block rounded-full bg-lw-rust/15 px-3 py-1 text-xs font-semibold text-lw-rust">
              {FULFILLMENT_LABELS[o.fulfillment_status as FulfillmentStatus] || o.fulfillment_status}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-white/75">
              {(o.media_appointments || [])
                .sort((a: any, b: any) => a.visit_number - b.visit_number)
                .map((a: any) => (
                  <li key={a.visit_number}>
                    {o.media_appointments.length > 1 ? `Visit ${a.visit_number}: ` : ''}
                    {fmt(a.starts_at)} · <span className="text-white/50">{APPT_LABEL[a.status] || a.status}</span>
                  </li>
                ))}
            </ul>
            {o.deliverables_url && (
              <a href={o.deliverables_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-md bg-lw-rust px-4 py-2 text-sm font-semibold">
                Download your files
              </a>
            )}
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-white/50">Questions about an order? Email adeyo@listworx.co.</p>
    </div>
  );
}

export default function MediaOrdersPage() {
  return (
    <div className="min-h-screen bg-mailer-black pb-20 text-white">
      <Navigation />
      <div className="container mx-auto max-w-4xl px-4 pb-6 pt-28">
        <p className="lw-label mb-2">ListWorx Media Services</p>
        <h1 className="text-3xl font-bold">Your media orders</h1>
      </div>
      <Suspense fallback={null}>
        <Orders />
      </Suspense>
    </div>
  );
}
