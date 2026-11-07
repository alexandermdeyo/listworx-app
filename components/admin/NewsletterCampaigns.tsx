'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { newsletterBodyFromPost } from '@/lib/newsletter';
import { Loader as Loader2, Plus, Send, Trash2, Pencil, Eye, EyeOff, X, FileText } from 'lucide-react';

interface Campaign {
  id: string;
  subject: string;
  preview_text: string | null;
  body_html: string;
  status: 'draft' | 'sending' | 'sent';
  source_post_id: string | null;
  sent_at: string | null;
  recipient_count: number | null;
  created_at: string;
}

interface PostOption {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

export default function NewsletterCampaigns({ activeCount }: { activeCount: number }) {
  const supabase = useRef(createClient()).current;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Campaign> | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ id: string; text: string; error?: boolean } | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('newsletter_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('blog_posts').select('id, title, slug, excerpt, featured_image_url').eq('is_draft', false).order('published_at', { ascending: false }),
    ]);
    setCampaigns((c as Campaign[]) || []);
    setPosts((p as PostOption[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const call = async (body: Record<string, unknown>) => {
    const { data } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/newsletter/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const save = async () => {
    if (!editing?.subject?.trim()) { setError('Subject is required.'); return; }
    setSaving(true);
    setError('');
    const fields = {
      subject: editing.subject.trim(),
      preview_text: editing.preview_text || null,
      body_html: editing.body_html || '',
      source_post_id: editing.source_post_id || null,
      updated_at: new Date().toISOString(),
    };
    const { error: e } = editing.id
      ? await supabase.from('newsletter_campaigns').update(fields).eq('id', editing.id)
      : await supabase.from('newsletter_campaigns').insert(fields);
    setSaving(false);
    if (e) { setError(e.message); return; }
    setEditing(null);
    load();
  };

  const startFromPost = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    setEditing((prev) => ({
      ...prev,
      subject: prev?.subject || post.title,
      preview_text: prev?.preview_text || post.excerpt || '',
      body_html: newsletterBodyFromPost(post),
      source_post_id: post.id,
    }));
  };

  const test = async (c: Campaign) => {
    const { data } = await supabase.auth.getSession();
    const to = window.prompt('Send a test copy to:', data.session?.user.email || '');
    if (!to) return;
    setBusy(c.id);
    const json = await call({ campaignId: c.id, testTo: to }).catch(() => ({ error: 'Network error' }));
    setMessage({ id: c.id, text: json.success ? `Test sent to ${to}.` : `Error: ${json.error}`, error: !json.success });
    setBusy(null);
  };

  const send = async (c: Campaign) => {
    if (!window.confirm(`Send "${c.subject}" to all ${activeCount} active subscribers now? This can't be undone.`)) return;
    setBusy(c.id);
    const json = await call({ campaignId: c.id }).catch(() => ({ error: 'Network error' }));
    setMessage({ id: c.id, text: json.success ? `Sent to ${json.sent} subscribers.` : `Error: ${json.error}`, error: !json.success });
    setBusy(null);
    load();
  };

  const remove = async (c: Campaign) => {
    if (!window.confirm('Delete this draft?')) return;
    await supabase.from('newsletter_campaigns').delete().eq('id', c.id);
    load();
  };

  if (editing) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{editing.id ? 'Edit newsletter' : 'New newsletter'}</h2>
          <button onClick={() => { setEditing(null); setError(''); }} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
        </div>

        {posts.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Start from a blog post</label>
            <select
              className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={editing.source_post_id || ''}
              onChange={(e) => e.target.value && startFromPost(e.target.value)}
            >
              <option value="">Choose a published post…</option>
              {posts.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Subject line</label>
          <Input value={editing.subject || ''} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="7 questions to ask before you hire a contractor" />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Preview text <span className="normal-case font-normal text-gray-400">(gray line shown after the subject in the inbox)</span></label>
          <Input value={editing.preview_text || ''} onChange={(e) => setEditing({ ...editing, preview_text: e.target.value })} placeholder="Number 4 saves people thousands." />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">Body (HTML)</label>
            <button onClick={() => setPreview(!preview)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-lw-rust">
              {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {preview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div className="min-h-[280px] rounded-md border border-gray-200 p-5 text-sm text-gray-800 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-xs [&_h3]:uppercase [&_h3]:tracking-widest [&_h3]:text-lw-rust [&_h3]:mt-5 [&_p]:mb-3 [&_a]:text-lw-rust [&_a.cta]:inline-block [&_a.cta]:bg-lw-rust [&_a.cta]:text-white [&_a.cta]:px-5 [&_a.cta]:py-2.5 [&_a.cta]:rounded-md [&_a.cta]:font-bold [&_img]:rounded-md"
              dangerouslySetInnerHTML={{ __html: editing.body_html || '<em>Nothing yet.</em>' }} />
          ) : (
            <textarea
              className="w-full min-h-[280px] rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
              value={editing.body_html || ''}
              onChange={(e) => setEditing({ ...editing, body_html: e.target.value })}
              placeholder={'<h2>Headline</h2>\n<p>Your message...</p>\n<p><a href="https://listworx.co/blog/..." class="cta">Read more →</a></p>'}
            />
          )}
          <p className="text-xs text-gray-400 mt-1">The ListWorx header, unsubscribe link, and business address are added automatically.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} className="text-white" style={{ backgroundColor: '#E8621A' }}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save draft
          </Button>
          <Button variant="outline" onClick={() => { setEditing(null); setError(''); }}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Newsletters</h2>
          <p className="text-sm text-gray-500">Write a draft, send yourself a test, then send to {activeCount} active subscriber{activeCount !== 1 ? 's' : ''}.</p>
        </div>
        <Button onClick={() => { setPreview(false); setEditing({ subject: '', preview_text: '', body_html: '' }); }} className="text-white" style={{ backgroundColor: '#E8621A' }}>
          <Plus className="h-4 w-4 mr-1" /> New newsletter
        </Button>
      </div>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="h-6 w-6 animate-spin text-lw-rust inline" /></div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          <FileText className="h-6 w-6 mx-auto mb-2 text-gray-300" />
          No newsletters yet. Publish a blog post, then start a newsletter from it.
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : c.status === 'sending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                  <span className="text-xs text-gray-400">{c.status === 'sent' ? `Sent ${fmt(c.sent_at)} · ${c.recipient_count ?? 0} recipients` : `Created ${fmt(c.created_at)}`}</span>
                </div>
                <p className="font-medium text-gray-900 truncate">{c.subject}</p>
                {message?.id === c.id && <p className={`text-xs mt-1 ${message.error ? 'text-red-600' : 'text-emerald-700'}`}>{message.text}</p>}
              </div>
              {c.status === 'draft' && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => { setPreview(false); setEditing(c); }} className="p-2 text-gray-400 hover:text-gray-800" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <Button variant="outline" size="sm" disabled={busy === c.id} onClick={() => test(c)}>Test</Button>
                  <Button size="sm" disabled={busy === c.id || activeCount === 0} onClick={() => send(c)} className="text-white" style={{ backgroundColor: '#E8621A' }}>
                    {busy === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />} Send
                  </Button>
                  <button onClick={() => remove(c)} className="p-2 text-gray-300 hover:text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
