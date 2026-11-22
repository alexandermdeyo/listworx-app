'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminApiPage, { adminBtnGhost, adminInput } from '@/components/admin/AdminApiPage';
import { authFetch } from '@/lib/auth-fetch';

const STATUSES = ['requested', 'in_progress', 'delivered', 'revision_requested', 'completed', 'canceled'];

function Row({ r, onSaved }: { r: any; onSaved: () => void }) {
  const [f, setF] = useState({ status: r.status, deliverable_url: r.deliverable_url || '', caption: r.caption || '', admin_notes: r.admin_notes || '' });
  const [msg, setMsg] = useState('');
  async function save() {
    const res = await authFetch('/api/admin/social-posts', { method: 'PATCH', body: JSON.stringify({ id: r.id, ...f }) });
    const j = await res.json();
    setMsg(res.ok ? 'Saved' : j.error);
    if (res.ok) onSaved();
  }
  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-sm">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="font-semibold">{r.contractor_profiles?.company_name || 'Contractor'} · {r.period_month?.slice(0, 7)} · post {r.slot_number} of 2</p>
          <p className="text-zinc-300">{r.topic}</p>
          {r.details && <p className="whitespace-pre-wrap text-zinc-400">{r.details}</p>}
          {r.photo_links && <p className="break-all text-zinc-400">Photos: {r.photo_links}</p>}
          {r.platforms && <p className="text-zinc-400">Platforms: {r.platforms}</p>}
          {r.revision_notes && <p className="text-amber-300">Revision request: {r.revision_notes}</p>}
        </div>
        <span className="h-fit rounded-full bg-zinc-800 px-3 py-1 text-xs">{r.status}</span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <select className={adminInput} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <input className={adminInput} placeholder="Deliverable link (graphic download)" value={f.deliverable_url} onChange={(e) => setF({ ...f, deliverable_url: e.target.value })} />
        <textarea className={`${adminInput} md:col-span-2`} rows={3} placeholder="Caption (contractor sees this)" value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} />
        <input className={`${adminInput} md:col-span-2`} placeholder="Internal notes" value={f.admin_notes} onChange={(e) => setF({ ...f, admin_notes: e.target.value })} />
      </div>
      <div className="flex items-center gap-3">
        <button className={adminBtnGhost} onClick={save}>Save{f.status === 'delivered' && r.status !== 'delivered' ? ' and email contractor' : ''}</button>
        {msg && <span className={msg === 'Saved' ? 'text-green-400' : 'text-red-400'}>{msg}</span>}
      </div>
    </div>
  );
}

export default function AdminSocialPostsPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('open');
  const load = useCallback(async () => {
    const r = await authFetch('/api/admin/social-posts');
    const j = await r.json();
    if (!r.ok) return setError(r.status === 401 ? 'Admin sign-in required.' : j.error);
    setRows(j.requests);
  }, []);
  useEffect(() => { load(); }, [load]);
  const shown = (rows || []).filter((r) => (filter === 'open' ? !['completed', 'canceled'].includes(r.status) : filter === 'all' || r.status === filter));
  return (
    <AdminApiPage title="Business Pro social posts" description="Two finished static or photo-based posts per member per calendar month, captions included, one revision each. Members publish them.">
      <select className={`${adminInput} mb-4`} value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="open">Open</option>
        <option value="all">All</option>
        {STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
      {error && <p className="text-red-400">{error}</p>}
      {rows && !shown.length && <p className="text-zinc-400">No requests.</p>}
      <div className="space-y-3">{shown.map((r) => <Row key={r.id} r={r} onSaved={load} />)}</div>
    </AdminApiPage>
  );
}
