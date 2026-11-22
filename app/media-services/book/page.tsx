'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { MEDIA_ADDONS, MEDIA_PACKAGES, MEDIA_SERVICES, formatUsd, getBookableService } from '@/lib/media/catalog';
import { authFetch, getSignedInEmail } from '@/lib/auth-fetch';

type Quote = { lines: Array<{ code: string; name: string; retailCents: number; discountCents: number; finalCents: number }>; retailCents: number; discountPercent: number; discountCents: number; totalCents: number; visits: number; membership: string | null };
type DateSlots = { date: string; slots: Array<{ starts_at: string; label: string }> };

const SERVICES = [...MEDIA_PACKAGES, ...MEDIA_SERVICES];
// Matches the site-wide form style (white field, dark text) with light gray example text.
const input = 'w-full rounded-md border border-zinc-300 px-3 py-2.5 text-base placeholder:text-zinc-400 focus:border-lw-rust focus:outline-none focus:ring-2 focus:ring-lw-rust/30';
const label = 'mb-1.5 block text-sm font-semibold text-white';
const fmtDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

function VisitPicker({ service, addons, visit, value, onChange, after }: { service: string; addons: string[]; visit: number; value: string; onChange: (v: string) => void; after?: string }) {
  const [dates, setDates] = useState<DateSlots[] | null>(null);
  const [day, setDay] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    setDates(null);
    setDay('');
    onChange('');
    fetch(`/api/media/availability?service=${service}&addons=${addons.join(',')}&visit=${visit}`)
      .then((r) => r.json())
      .then((j) => (j.error ? setErr(j.error) : setDates(j.dates)))
      .catch(() => setErr('Could not load availability.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, addons.join(','), visit]);
  const shown = (dates || []).map((d) => ({ ...d, slots: d.slots.filter((s) => !after || Date.parse(s.starts_at) > Date.parse(after)) })).filter((d) => d.slots.length);
  const current = shown.find((d) => d.date === day);
  if (err) return <p className="text-sm text-red-400">{err}</p>;
  if (!dates) return <p className="flex items-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading open times…</p>;
  if (!shown.length) return <p className="text-sm text-white/60">No open times right now. <a className="text-lw-rust underline" href="mailto:adeyo@listworx.co?subject=Media%20booking">Email us</a> and we&apos;ll find one.</p>;
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {shown.map((d) => (
          <button type="button" key={d.date} onClick={() => { setDay(d.date); onChange(''); }} className={`shrink-0 rounded-md border px-3 py-2 text-sm ${day === d.date ? 'border-lw-rust bg-lw-rust text-white' : 'border-mailer-border bg-mailer-ink text-white/80 hover:border-lw-rust'}`}>
            {fmtDate(d.date)}
          </button>
        ))}
      </div>
      {current && (
        <div className="mt-3 flex flex-wrap gap-2">
          {current.slots.map((s) => (
            <button type="button" key={s.starts_at} onClick={() => onChange(s.starts_at)} className={`rounded-md border px-3 py-1.5 text-sm ${value === s.starts_at ? 'border-lw-rust bg-lw-rust text-white' : 'border-mailer-border text-white/80 hover:border-lw-rust'}`}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingForm() {
  const params = useSearchParams();
  const [service, setService] = useState(getBookableService(params.get('service') || '')?.code || 'contractor_essentials');
  const [addons, setAddons] = useState<string[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [appts, setAppts] = useState<string[]>(['', '']);
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '', address: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get('canceled') ? 'Checkout was canceled. Your time was not booked.' : '');
  const item = useMemo(() => getBookableService(service)!, [service]);

  useEffect(() => { getSignedInEmail().then((e) => e && setForm((f) => (f.email ? f : { ...f, email: e }))); }, []);
  useEffect(() => {
    authFetch('/api/media/quote', { method: 'POST', body: JSON.stringify({ service, addons }) })
      .then((r) => r.json())
      .then((j) => (j.error ? setError(j.error) : setQuote(j)));
  }, [service, addons]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  const needed = item.visits;
  const chosen = appts.slice(0, needed);
  const ready = chosen.every(Boolean) && form.name && form.email && form.phone && form.address;

  async function checkout() {
    setBusy(true);
    setError('');
    try {
      const r = await authFetch('/api/media/checkout', { method: 'POST', body: JSON.stringify({ service, addons, appointments: chosen, ...form }) });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || 'Could not start checkout.');
      window.location.href = j.url;
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-8">
        <section className="min-w-0 rounded-2xl border border-mailer-border bg-mailer-card p-6">
          <h2 className="text-lg font-bold">1. Service</h2>
          <label htmlFor="service" className={`${label} mt-3`}>What would you like to book?</label>
          <select id="service" className={input} value={service} onChange={(e) => { setService(e.target.value); setAppts(['', '']); }}>
            {SERVICES.map((s) => (
              <option key={s.code} value={s.code}>{s.name} · {formatUsd(s.priceCents)}</option>
            ))}
          </select>
          <p className="mt-2 text-sm text-white/60">{item.summary}</p>
          <p className="mt-5 text-sm font-semibold">Add-ons (optional)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {MEDIA_ADDONS.map((a) => (
              <label key={a.code} className="flex cursor-pointer items-start gap-3 rounded-md border border-mailer-border bg-mailer-ink p-3 text-sm">
                <input type="checkbox" className="mt-1 accent-[#C65A1E]" checked={addons.includes(a.code)} onChange={(e) => setAddons(e.target.checked ? [...addons, a.code] : addons.filter((c) => c !== a.code))} />
                <span><span className="font-semibold">{a.name}</span> · {formatUsd(a.priceCents)}<span className="block text-white/55">{a.summary}</span></span>
              </label>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-mailer-border bg-mailer-card p-6">
          <h2 className="text-lg font-bold">2. Requested appointment</h2>
          <p className="mt-1 text-sm text-white/60">Times are Central. Your request is held while you check out and confirmed by us afterward.</p>
          <div className="mt-4 space-y-6">
            <div>
              {needed === 2 && <p className="mb-2 text-sm font-semibold">Visit 1: before the work starts</p>}
              <VisitPicker service={service} addons={addons} visit={1} value={appts[0]} onChange={(v) => setAppts((a) => [v, a[1]])} />
            </div>
            {needed === 2 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Visit 2: after the work is finished</p>
                {appts[0] ? (
                  <VisitPicker service={service} addons={addons} visit={2} value={appts[1]} after={appts[0]} onChange={(v) => setAppts((a) => [a[0], v])} />
                ) : (
                  <p className="text-sm text-white/50">Choose the first visit, then pick the second.</p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-mailer-border bg-mailer-card p-6">
          <h2 className="text-lg font-bold">3. Your details</h2>
          <p className="mt-1 text-sm text-white/55">Fields marked * are required.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bk-name" className={label}>Your name *</label>
              <input id="bk-name" className={input} placeholder="e.g. Jane Smith" value={form.name} onChange={set('name')} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="bk-business" className={label}>Business name</label>
              <input id="bk-business" className={input} placeholder="e.g. Smith Roofing" value={form.business} onChange={set('business')} autoComplete="organization" />
            </div>
            <div>
              <label htmlFor="bk-email" className={label}>Email *</label>
              <input id="bk-email" className={input} placeholder="you@example.com" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="bk-phone" className={label}>Phone *</label>
              <input id="bk-phone" className={input} placeholder="e.g. 615-555-0123" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="bk-address" className={label}>Project address *</label>
              <input id="bk-address" className={input} placeholder="Street, city, state" value={form.address} onChange={set('address')} autoComplete="street-address" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="bk-notes" className={label}>Notes for the shoot</label>
              <textarea id="bk-notes" className={input} rows={4} placeholder="What should we capture? Gate codes, who will be there, anything we should know." value={form.notes} onChange={set('notes')} />
            </div>
          </div>
        </section>
      </div>

      <aside className="min-w-0 h-fit rounded-2xl border border-lw-rust/60 bg-mailer-card p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold">Order summary</h2>
        {quote ? (
          <>
            <ul className="mt-4 space-y-2 text-sm">
              {quote.lines.map((l) => (
                <li key={l.code} className="flex justify-between gap-3"><span className="text-white/75">{l.name}</span><span>{formatUsd(l.retailCents)}</span></li>
              ))}
            </ul>
            <div className="mt-4 space-y-1 border-t border-mailer-border pt-4 text-sm">
              <div className="flex justify-between"><span className="text-white/60">Retail price</span><span>{formatUsd(quote.retailCents)}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Membership discount{quote.discountPercent ? ` (${quote.discountPercent}%)` : ''}</span><span>{quote.discountCents ? `-${formatUsd(quote.discountCents)}` : '$0'}</span></div>
              <div className="flex justify-between pt-2 text-lg font-bold"><span>Total due today</span><span>{formatUsd(quote.totalCents)}</span></div>
            </div>
            {!quote.discountPercent && (
              <p className="mt-3 text-xs text-white/50">
                Growth members save 5% and Business Pro members save 10%. <Link className="underline" href="/login?redirect=/media-services/book">Sign in</Link> to apply your discount.
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-white/60">Calculating…</p>
        )}
        {error && <p className="mt-4 rounded-md bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <button type="button" disabled={!ready || busy} onClick={checkout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-lw-rust px-4 py-3 font-semibold text-white hover:bg-lw-rust-hover disabled:cursor-not-allowed disabled:opacity-40">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Pay {quote ? formatUsd(quote.totalCents) : ''} and request appointment
        </button>
        <p className="mt-3 text-xs text-white/50">Paid 100% up front through Stripe. Appointment requested, pending confirmation. If we can&apos;t find a time that works, we&apos;ll refund you.</p>
      </aside>
    </div>
  );
}

export default function BookMediaPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-mailer-black pb-20 text-white">
      <Navigation />
      <div className="container mx-auto max-w-6xl px-4 pb-8 pt-28">
        <p className="lw-label mb-2">ListWorx Media Services</p>
        <h1 className="text-3xl font-bold md:text-4xl">Book a shoot</h1>
      </div>
      <Suspense fallback={<p className="container mx-auto px-4 text-white/60">Loading…</p>}>
        <BookingForm />
      </Suspense>
    </div>
  );
}
