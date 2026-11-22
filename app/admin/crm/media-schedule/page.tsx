'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminApiPage, { adminBtn, adminBtnGhost, adminInput } from '@/components/admin/AdminApiPage';
import { authFetch } from '@/lib/auth-fetch';
import { MEDIA_PACKAGES, MEDIA_SERVICES } from '@/lib/media/catalog';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SERVICES = [...MEDIA_PACKAGES, ...MEDIA_SERVICES];
const fmt = (iso: string) => new Date(iso).toLocaleString('en-US', { timeZone: 'America/Chicago', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const hm = (t: string) => String(t).slice(0, 5);

export default function MediaSchedulePage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [rule, setRule] = useState({ weekday: '1', start_time: '09:00', end_time: '16:00' });
  const [ex, setEx] = useState({ date: '', kind: 'blocked', start_time: '', end_time: '', note: '' });
  const [block, setBlock] = useState({ starts_at: '', ends_at: '', note: '' });
  const [view, setView] = useState('upcoming');

  const load = useCallback(async () => {
    const r = await authFetch('/api/admin/media/schedule');
    const j = await r.json();
    if (!r.ok) return setError(r.status === 401 ? 'Admin sign-in required.' : j.error);
    setData(j);
    setSettings((s: any) => s || { ...j.settings, durations: { ...(j.settings?.durations || {}) } });
  }, []);
  useEffect(() => { load(); }, [load]);

  async function post(body: Record<string, unknown>) {
    setMsg('');
    const r = await authFetch('/api/admin/media/schedule', { method: 'POST', body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || 'Failed');
    setMsg('Saved');
    load();
  }

  if (error) return <AdminApiPage title="Media schedule"><p className="text-red-400">{error}</p></AdminApiPage>;
  if (!data || !settings) return <AdminApiPage title="Media schedule"><p className="text-zinc-400">Loading…</p></AdminApiPage>;

  const appts = (data.appointments || []).filter((a: any) =>
    view === 'upcoming' ? ['requested', 'proposed', 'confirmed', 'blocked'].includes(a.status) && Date.parse(a.ends_at) > Date.now() : a.status === view,
  );

  return (
    <AdminApiPage title="Media schedule" description="Times are Central (America/Chicago). Customers can only request times inside these hours, and no appointment starts before 3:30 PM.">
      {msg && <p className={`mb-4 ${msg === 'Saved' ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-3 font-bold">Weekly hours</h2>
          {data.rules.length ? (
            <ul className="mb-4 space-y-1 text-sm">
              {data.rules.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between">
                  <span>{DAYS[r.weekday]} {hm(r.start_time)} to {hm(r.end_time)}</span>
                  <button className="text-xs text-red-300" onClick={() => post({ action: 'delete_rule', id: r.id })}>Remove</button>
                </li>
              ))}
            </ul>
          ) : <p className="mb-4 text-sm text-amber-300">No weekly hours yet. Customers will see no open times until you add some.</p>}
          <div className="flex flex-wrap gap-2">
            <select className={adminInput} value={rule.weekday} onChange={(e) => setRule({ ...rule, weekday: e.target.value })}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
            <input type="time" className={adminInput} value={rule.start_time} onChange={(e) => setRule({ ...rule, start_time: e.target.value })} />
            <input type="time" className={adminInput} value={rule.end_time} onChange={(e) => setRule({ ...rule, end_time: e.target.value })} />
            <button className={adminBtn} onClick={() => post({ action: 'add_rule', ...rule })}>Add hours</button>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-3 font-bold">Days off, holidays, and extra open dates</h2>
          <ul className="mb-4 space-y-1 text-sm">
            {data.exceptions.map((e: any) => (
              <li key={e.id} className="flex items-center justify-between">
                <span>{e.date} · {e.kind === 'open' ? 'Extra open' : 'Blocked'} {e.start_time ? `${hm(e.start_time)} to ${hm(e.end_time)}` : 'all day'} {e.note ? `· ${e.note}` : ''}</span>
                <button className="text-xs text-red-300" onClick={() => post({ action: 'delete_exception', id: e.id })}>Remove</button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <input type="date" className={adminInput} value={ex.date} onChange={(e) => setEx({ ...ex, date: e.target.value })} />
            <select className={adminInput} value={ex.kind} onChange={(e) => setEx({ ...ex, kind: e.target.value })}><option value="blocked">Block</option><option value="open">Extra open</option></select>
            <input type="time" className={adminInput} value={ex.start_time} onChange={(e) => setEx({ ...ex, start_time: e.target.value })} />
            <input type="time" className={adminInput} value={ex.end_time} onChange={(e) => setEx({ ...ex, end_time: e.target.value })} />
            <input className={adminInput} placeholder="Note" value={ex.note} onChange={(e) => setEx({ ...ex, note: e.target.value })} />
            <button className={adminBtn} onClick={() => post({ action: 'add_exception', ...ex })}>Add</button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Leave times blank to block the whole day.</p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-3 font-bold">Booking rules</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['buffer_minutes', 'Travel/setup buffer (min, each side)'],
              ['slot_interval_minutes', 'Start-time interval (min)'],
              ['min_notice_hours', 'Minimum notice (hours)'],
              ['booking_window_days', 'Booking window (days)'],
              ['hold_minutes', 'Unpaid checkout hold (min, 31+)'],
            ].map(([k, label]) => (
              <label key={k} className="space-y-1"><span className="block text-zinc-400">{label}</span>
                <input type="number" className={`${adminInput} w-full`} value={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} />
              </label>
            ))}
          </div>
          <h3 className="mb-2 mt-5 text-sm font-semibold">On-site duration by service (minutes)</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {SERVICES.map((s) => (
              <label key={s.code} className="space-y-1"><span className="block text-zinc-400">{s.name}{s.visits === 2 ? ' (per visit)' : ''}</span>
                <input type="number" className={`${adminInput} w-full`} placeholder={String(s.minutes)} value={settings.durations?.[s.code] ?? ''} onChange={(e) => setSettings({ ...settings, durations: { ...settings.durations, [s.code]: e.target.value } })} />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">Blank uses the package default. Add-ons add time automatically (drone 30, reel 30, extra hour 60).</p>
          <button className={`${adminBtn} mt-4`} onClick={() => post({ action: 'save_settings', ...settings })}>Save booking rules</button>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-3 font-bold">Block time manually</h2>
          <div className="flex flex-wrap gap-2">
            <input type="datetime-local" className={adminInput} value={block.starts_at} onChange={(e) => setBlock({ ...block, starts_at: e.target.value })} />
            <input type="datetime-local" className={adminInput} value={block.ends_at} onChange={(e) => setBlock({ ...block, ends_at: e.target.value })} />
            <input className={adminInput} placeholder="Note" value={block.note} onChange={(e) => setBlock({ ...block, note: e.target.value })} />
            <button className={adminBtn} disabled={!block.starts_at || !block.ends_at} onClick={() => post({ action: 'add_block', note: block.note, starts_at: new Date(block.starts_at).toISOString(), ends_at: new Date(block.ends_at).toISOString() })}>Block</button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Uses your browser time zone. Blocks can&apos;t overlap a live appointment.</p>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Appointments</h2>
          <select className={adminInput} value={view} onChange={(e) => setView(e.target.value)}>
            <option value="upcoming">Upcoming</option>
            <option value="requested">Pending</option>
            <option value="proposed">Rescheduled (proposed)</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
            <option value="blocked">Manual blocks</option>
          </select>
        </div>
        {appts.length ? (
          <ul className="divide-y divide-zinc-800 text-sm">
            {appts.map((a: any) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{fmt(a.starts_at)} to {fmt(a.ends_at).split(', ').pop()} · <strong>{a.status}</strong>{a.order_id ? '' : ` · ${a.note || 'Blocked'}`}</span>
                {a.media_orders ? (
                  <a className="text-[#E07A3F]" href={`/admin/crm/media-orders?order=${a.media_orders.id}`}>#{a.media_orders.order_number} {a.media_orders.business_name || a.media_orders.customer_name}</a>
                ) : a.status === 'blocked' ? (
                  <button className={adminBtnGhost} onClick={() => post({ action: 'delete_block', id: a.id })}>Remove block</button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-zinc-400">Nothing here.</p>}
      </section>
    </AdminApiPage>
  );
}
