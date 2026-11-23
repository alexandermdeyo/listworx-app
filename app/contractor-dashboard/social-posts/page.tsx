'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

const input = 'w-full rounded-md border border-lw-dark-border bg-brand-navy px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-[#C65A1E] focus:outline-none';
const LABEL: Record<string, string> = { requested: 'Requested', in_progress: 'In progress', delivered: 'Ready', revision_requested: 'Revision requested', completed: 'Completed', canceled: 'Canceled' };

export default function SocialPostsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ topic: '', details: '', photo_links: '', platforms: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [revision, setRevision] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const r = await authFetch('/api/social-posts');
    const j = await r.json();
    if (!r.ok) return setError(r.status === 401 ? 'Sign in with your contractor account.' : j.error);
    setData(j);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function submit(body: Record<string, unknown>) {
    setBusy(true);
    setMsg('');
    const r = await authFetch('/api/social-posts', { method: 'POST', body: JSON.stringify(body) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg(j.error || 'Something went wrong.');
    setMsg('Request received. We will email you when it is ready.');
    setForm({ topic: '', details: '', photo_links: '', platforms: '' });
    load();
  }

  return (
    <div className="min-h-screen bg-brand-navy-deep px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/contractor-dashboard" className="text-sm text-zinc-400 hover:text-white">← Dashboard</Link>
        <h1 className="mt-2 text-2xl font-bold">Custom branded social posts</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Business Pro includes two finished static graphics or photo-based posts per calendar month, with captions and one reasonable revision each. Video, paid ads, and
          on-site photography are not included, and unused posts don&apos;t roll over. We deliver the finished post; you publish it.
        </p>

        {error && <p className="mt-6 text-red-400">{error}</p>}
        {!data && !error && <Loader2 className="mt-6 h-6 w-6 animate-spin text-[#C65A1E]" />}

        {data && data.allowance === 0 && (
          <div className="mt-6 rounded-xl border border-lw-dark-border bg-brand-navy p-5 text-sm">
            <p>Custom social posts are included with <strong>Business Pro</strong>.</p>
            <Link href="/contractor-dashboard" className="mt-3 inline-block rounded-md bg-[#C65A1E] px-4 py-2 font-semibold">See membership options</Link>
          </div>
        )}

        {data && data.allowance > 0 && (
          <div className="mt-6 rounded-xl border border-lw-dark-border bg-brand-navy p-5">
            <p className="text-sm text-zinc-300"><strong>{data.remaining}</strong> of {data.allowance} posts left this month.</p>
            {data.remaining > 0 ? (
              <div className="mt-4 space-y-3">
                <input className={input} placeholder="What is the post about? (e.g. finished kitchen remodel in Gallatin) *" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
                <textarea className={input} rows={4} placeholder="Details, offer, or message you want to get across" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
                <input className={input} placeholder="Links to your photos (Google Drive, Dropbox, etc.)" value={form.photo_links} onChange={(e) => setForm({ ...form, photo_links: e.target.value })} />
                <input className={input} placeholder="Where will you post it? (Facebook, Instagram, Google…)" value={form.platforms} onChange={(e) => setForm({ ...form, platforms: e.target.value })} />
                <button disabled={busy || !form.topic.trim()} onClick={() => submit(form)} className="rounded-md bg-[#C65A1E] px-4 py-2 text-sm font-semibold disabled:opacity-40">Request post</button>
              </div>
            ) : <p className="mt-2 text-sm text-zinc-400">You&apos;ve used this month&apos;s posts. Your allowance resets on the 1st.</p>}
            {msg && <p className="mt-3 text-sm text-zinc-300">{msg}</p>}
          </div>
        )}

        {data?.requests?.length > 0 && (
          <div className="mt-8 space-y-3">
            <h2 className="font-bold">Your requests</h2>
            {data.requests.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-lw-dark-border bg-brand-navy p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold">{r.topic}</p>
                  <span className="text-zinc-400">{r.period_month.slice(0, 7)} · {LABEL[r.status] || r.status}</span>
                </div>
                {r.deliverable_url && <a href={r.deliverable_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[#E07A3F] underline">Download your post</a>}
                {r.caption && <p className="mt-2 whitespace-pre-wrap text-zinc-300">{r.caption}</p>}
                {r.status === 'delivered' && !r.revision_used && (
                  <div className="mt-3 flex gap-2">
                    <input className={input} placeholder="What should we change? (one revision)" value={revision[r.id] || ''} onChange={(e) => setRevision({ ...revision, [r.id]: e.target.value })} />
                    <button disabled={busy || !revision[r.id]} onClick={() => submit({ action: 'revision', id: r.id, notes: revision[r.id] })} className="whitespace-nowrap rounded-md border border-lw-dark-border px-3 text-sm disabled:opacity-40">Request revision</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
