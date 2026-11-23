'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Eye, Loader as Loader2, Plus, Save, CalendarClock, History, PencilLine } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { renderBody } from '@/lib/blog-render';
import HeroImage from '@/components/blog/HeroImage';
import HeroImageControls from '@/components/admin/content/HeroImageControls';
import PhotoPicker from '@/components/admin/photos/PhotoPicker';
import { inlinePhotoTag, insertPhotoAt } from '@/lib/content/inline-photo';
import PhotoIssuesBanner from '@/components/admin/photos/PhotoIssuesBanner';
import type { HeroSettings } from '@/lib/content/hero-image';
import {
  ACTION_LABELS, AUDIENCES, AUDIENCE_LABELS, CONTENT_STATUSES, STATUS_LABELS,
  availableActions, isEditable, slugify,
  type ContentAction, type ContentStatus,
} from '@/lib/content/workflow';

const RUST = '#F26A21';

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  featured_image_focus_x: number | null;
  featured_image_focus_y: number | null;
  featured_image_fit: string | null;
  featured_image_width: number | null;
  featured_image_height: number | null;
  author_name: string | null;
  status: ContentStatus;
  published_at: string | null;
  scheduled_for: string | null;
  seo_title: string | null;
  meta_description: string | null;
  audience: string | null;
  category: string | null;
  sources: string[];
  created_at: string;
  updated_at: string;
};

type HistoryEntry = { id: string; action: string; from_status: string | null; to_status: string | null; actor_name: string | null; note: string | null; created_at: string };

const STATUS_STYLES: Record<ContentStatus, string> = {
  idea: 'bg-gray-100 text-gray-800 border-gray-300',
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  in_review: 'bg-amber-50 text-amber-900 border-amber-300',
  approved: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  scheduled: 'bg-blue-50 text-blue-900 border-blue-300',
  published: 'bg-emerald-100 text-emerald-900 border-emerald-400',
  rejected: 'bg-red-50 text-red-800 border-red-300',
};

// "!" is needed: the site-wide input rule in globals.css sets a pale border (#d4d4d8) with
// higher specificity than a utility class. Scoped to this editor only.
const inputCls = 'w-full rounded-md border !border-gray-500 bg-white px-3 py-2 text-[15px] text-gray-900 placeholder:text-gray-500 focus:!border-[#F26A21] focus:outline-none focus:ring-2 focus:ring-[#F26A21]/30';
const labelCls = 'block text-sm font-semibold text-gray-900 mb-1';
const helpCls = 'mt-1 text-xs text-gray-600';

function fmt(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${props.className || ''}`} style={{ backgroundColor: RUST }} />;
}
function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex items-center gap-1.5 rounded-md border border-gray-400 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50 ${props.className || ''}`} />;
}

export default function ContentManager() {
  const supabase = useRef(createClient()).current;
  const [articles, setArticles] = useState<Article[]>([]);
  const [schedulerEnabled, setSchedulerEnabled] = useState(false);
  const [filter, setFilter] = useState<ContentStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | 'new' | null>(null);
  const [listError, setListError] = useState('');

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const { data } = await supabase.auth.getSession();
    const res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}`, ...(init?.headers || {}) },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  }, [supabase]);

  const load = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const json = await api('/api/admin/content');
      setArticles(json.articles || []);
      setSchedulerEnabled(json.schedulerEnabled === true);
    } catch (e: any) {
      setListError(e.message);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: articles.length };
    for (const s of CONTENT_STATUSES) c[s] = articles.filter((a) => a.status === s).length;
    return c;
  }, [articles]);

  const shown = filter === 'all' ? articles : articles.filter((a) => a.status === filter);

  if (openId) {
    return <ArticleEditor key={openId} id={openId} api={api} onClose={() => { setOpenId(null); load(); }} onCreated={(id) => setOpenId(id)} />;
  }

  return (
    <div className="space-y-5 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content</h1>
          <p className="text-sm text-gray-700">Plan, write and approve articles. Nothing here goes live on its own.</p>
        </div>
        <PrimaryButton onClick={() => setOpenId('new')}><Plus className="h-4 w-4" /> New article</PrimaryButton>
      </div>

      <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-800">
        <strong>Automatic publishing: {schedulerEnabled ? 'On' : 'Off'}.</strong>{' '}
        Scheduled articles are not published automatically yet. To make an approved article live today, use the Blog section.
      </div>

      <PhotoIssuesBanner />

      <div className="flex flex-wrap gap-2" role="tablist">
        {(['all', ...CONTENT_STATUSES] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={filter === s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${filter === s ? 'text-white border-transparent' : 'bg-white text-gray-900 border-gray-400 hover:bg-gray-50'}`}
            style={filter === s ? { backgroundColor: RUST } : undefined}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {listError && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{listError}</p>}

      {loading ? (
        <div className="py-10 text-center"><Loader2 className="inline h-6 w-6 animate-spin" style={{ color: RUST }} /></div>
      ) : shown.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-400 p-10 text-center text-sm text-gray-700">
          {filter === 'all' ? 'No articles yet. Start with "New article".' : `No articles marked ${STATUS_LABELS[filter as ContentStatus]}.`}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-300 bg-white">
          {shown.map((a) => (
            <li key={a.id}>
              <button onClick={() => setOpenId(a.id)} className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{a.title}</p>
                  <p className="text-xs text-gray-700">
                    {a.audience ? `${AUDIENCE_LABELS[a.audience as keyof typeof AUDIENCE_LABELS] || a.audience} · ` : ''}
                    {a.status === 'scheduled' && a.scheduled_for ? `Scheduled for ${fmt(a.scheduled_for)}` : `Updated ${fmt(a.updated_at)}`}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const EMPTY = {
  title: '', slug: '', excerpt: '', body: '', featured_image_url: '', featured_image_alt: '', author_name: 'ListWorx Team',
  seo_title: '', meta_description: '', audience: '', category: '', sources: '',
};
type Form = typeof EMPTY;

function toHero(a: Article): HeroSettings {
  return {
    featured_image_focus_x: a.featured_image_focus_x, featured_image_focus_y: a.featured_image_focus_y,
    featured_image_fit: a.featured_image_fit || 'auto',
    featured_image_width: a.featured_image_width, featured_image_height: a.featured_image_height,
  };
}

function toForm(a: Article): Form {
  return {
    title: a.title || '', slug: a.slug || '', excerpt: a.excerpt || '', body: a.body || '',
    featured_image_url: a.featured_image_url || '', featured_image_alt: a.featured_image_alt || '',
    author_name: a.author_name || 'ListWorx Team', seo_title: a.seo_title || '', meta_description: a.meta_description || '',
    audience: a.audience || '', category: a.category || '', sources: (a.sources || []).join('\n'),
  };
}

function ArticleEditor({ id, api, onClose, onCreated }: {
  id: string; api: (p: string, i?: RequestInit) => Promise<any>; onClose: () => void; onCreated: (id: string) => void;
}) {
  const isNew = id === 'new';
  const [article, setArticle] = useState<Article | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [form, setForm] = useState<Form>(EMPTY);
  const [hero, setHero] = useState<HeroSettings>({ featured_image_fit: 'auto' });
  const [picking, setPicking] = useState(false);
  const [pickingInline, setPickingInline] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef<number | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [preview, setPreview] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');

  const loadOne = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const json = await api(`/api/admin/content/${id}`);
      setArticle(json.article);
      setHistory(json.history || []);
      setForm(toForm(json.article));
      setHero(toHero(json.article));
      setSlugTouched(true);
    } catch (e: any) {
      setMessage({ text: e.message, error: true });
    }
    setLoading(false);
  }, [api, id, isNew]);

  useEffect(() => { loadOne(); }, [loadOne]);

  const status: ContentStatus = article?.status || 'draft';
  const editable = isNew || isEditable(status);
  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v, ...(k === 'title' && !slugTouched ? { slug: slugify(v) } : {}) }));
  };

  const save = async (asIdea = false) => {
    setBusy(true);
    setMessage(null);
    const payload = { ...form, ...hero, sources: form.sources.split('\n').map((s) => s.trim()).filter(Boolean) };
    try {
      if (isNew) {
        const json = await api('/api/admin/content', { method: 'POST', body: JSON.stringify({ ...payload, status: asIdea ? 'idea' : 'draft' }) });
        setBusy(false);
        onCreated(json.article.id);
        return;
      }
      await api('/api/admin/content', { method: 'PATCH', body: JSON.stringify({ id, ...payload }) });
      setMessage({ text: 'Saved.' });
      await loadOne();
    } catch (e: any) {
      setMessage({ text: e.message, error: true });
    }
    setBusy(false);
  };

  const act = async (action: ContentAction, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setMessage(null);
    try {
      await api(`/api/admin/content/${id}/action`, { method: 'POST', body: JSON.stringify({ action, ...extra }) });
      setRejecting(false);
      setRejectNote('');
      setScheduling(false);
      setScheduleAt('');
      setMessage({ text: `${ACTION_LABELS[action]}: done.` });
      await loadOne();
    } catch (e: any) {
      setMessage({ text: e.message, error: true });
    }
    setBusy(false);
  };

  const onAction = (a: ContentAction) => {
    if (a === 'reject') { setRejecting(true); setScheduling(false); return; }
    if (a === 'schedule') { setScheduling(true); setRejecting(false); return; }
    act(a);
  };

  if (loading) return <div className="py-10 text-center"><Loader2 className="inline h-6 w-6 animate-spin" style={{ color: RUST }} /></div>;

  const actions = isNew ? [] : availableActions(status);
  const seoTitle = form.seo_title || form.title;
  const seoDesc = form.meta_description || form.excerpt;

  return (
    <div className="space-y-5 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SecondaryButton onClick={onClose}><ArrowLeft className="h-4 w-4" /> All articles</SecondaryButton>
        <div className="flex items-center gap-2">
          {!isNew && <StatusBadge status={status} />}
          <SecondaryButton onClick={() => setPreview((p) => !p)}>
            {preview ? <><PencilLine className="h-4 w-4" /> Back to editing</> : <><Eye className="h-4 w-4" /> Preview</>}
          </SecondaryButton>
        </div>
      </div>

      {message && (
        <p role="status" className={`rounded-md border px-3 py-2 text-sm ${message.error ? 'border-red-300 bg-red-50 text-red-800' : 'border-emerald-300 bg-emerald-50 text-emerald-900'}`}>{message.text}</p>
      )}

      {!isNew && !editable && (
        <p className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800">
          {status === 'published'
            ? 'This article is live. Edit it in the Blog section.'
            : 'Approved and scheduled articles are locked so the approved text is what gets published. Use "Back to draft" to make changes.'}
        </p>
      )}

      {article?.status === 'scheduled' && article.scheduled_for && (
        <p className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-900">
          Scheduled for {fmt(article.scheduled_for)}. Automatic publishing is off, so this will not go live by itself yet.
        </p>
      )}

      {preview ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-300 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">Search result preview</p>
            <p className="text-lg text-[#1a0dab]">{seoTitle || 'Untitled'} | ListWorx</p>
            <p className="text-sm text-[#006621]">listworx.co/blog/{form.slug || '…'}</p>
            <p className="text-sm text-gray-800">{seoDesc || 'No description yet.'}</p>
          </div>
          {form.featured_image_url && (
            <div className="rounded-lg border border-gray-300 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Featured photo on each screen size</p>
              <div className="flex flex-wrap items-start gap-4">
                {(['desktop', 'tablet', 'mobile'] as const).map((f) => (
                  <figure key={f} style={{ width: f === 'desktop' ? 520 : f === 'tablet' ? 360 : 260, maxWidth: '100%' }}>
                    <HeroImage key={form.featured_image_url} src={form.featured_image_url} alt={form.featured_image_alt || form.title} settings={hero} frame={f} className="rounded-md" />
                    <figcaption className="mt-1 text-xs text-gray-700">{f === 'desktop' ? 'Desktop' : f === 'tablet' ? 'Tablet' : 'Phone'}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
          <article className="rounded-lg border border-gray-300 p-6">
            {form.featured_image_url && (
              <HeroImage key={form.featured_image_url} src={form.featured_image_url} alt={form.featured_image_alt || form.title} settings={hero} className="mb-6 rounded-xl" />
            )}
            <h1 className="mb-2 text-3xl font-bold text-gray-900">{form.title || 'Untitled'}</h1>
            <p className="mb-4 text-sm text-gray-700">By {form.author_name || 'ListWorx Team'}</p>
            {form.excerpt && <p className="mb-4 text-lg text-gray-800">{form.excerpt}</p>}
            <div className="text-base">{form.body ? renderBody(form.body) : <p className="text-gray-600">No body yet.</p>}</div>
          </article>
        </div>
      ) : (
        <fieldset disabled={!editable || busy} className="space-y-4 disabled:opacity-90">
          <div>
            <label className={labelCls} htmlFor="c-title">Title</label>
            <input id="c-title" className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. 7 Questions to Ask Before Hiring a Contractor" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelCls} htmlFor="c-slug">Web address</label>
              <input id="c-slug" className={inputCls} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }} />
              <p className={helpCls}>listworx.co/blog/{form.slug || '…'}</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="c-audience">Audience</label>
              <select id="c-audience" className={inputCls} value={form.audience} onChange={(e) => set('audience', e.target.value)}>
                <option value="">Choose…</option>
                {AUDIENCES.map((a) => <option key={a} value={a}>{AUDIENCE_LABELS[a]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="c-category">Category</label>
              <input id="c-category" className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Hiring a contractor" />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="c-excerpt">Summary</label>
            <textarea id="c-excerpt" rows={2} className={inputCls} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
              <label className={labelCls} htmlFor="c-body">Article</label>
              {editable && (
                <SecondaryButton type="button" onClick={() => setPickingInline(true)} data-testid="add-inline-photo">Add a photo here</SecondaryButton>
              )}
            </div>
            <textarea
              id="c-body"
              ref={bodyRef}
              rows={16}
              className={`${inputCls} font-mono text-sm`}
              value={form.body}
              onChange={(e) => { set('body', e.target.value); cursorRef.current = e.target.selectionStart; }}
              onSelect={(e) => { cursorRef.current = (e.target as HTMLTextAreaElement).selectionStart; }}
              onBlur={(e) => { cursorRef.current = e.target.selectionStart; }}
            />
            <p className={helpCls}>Blank line between paragraphs. "# " heading, "- " bullet, "1. " numbered, "**bold**". To add a photo inside the article, click in the paragraph it should follow, then press &quot;Add a photo here&quot;. Add as many as you like; each one shows as an &lt;img …&gt; line you can move or delete.</p>
            <PhotoPicker
              open={pickingInline}
              onClose={() => setPickingInline(false)}
              defaultUse="blog_inline"
              title="Add a photo inside the article"
              onSelect={(p) => {
                const { body, caret } = insertPhotoAt(form.body, cursorRef.current, inlinePhotoTag(p.public_url, p.alt_text || ''));
                set('body', body);
                cursorRef.current = caret;
                requestAnimationFrame(() => { const el = bodyRef.current; if (el) { el.focus(); el.setSelectionRange(caret, caret); } });
              }}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="c-seo-title">SEO title <span className="font-normal text-gray-600">({form.seo_title.length}/60 recommended)</span></label>
              <input id="c-seo-title" className={inputCls} value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder="Defaults to the title" />
            </div>
            <div>
              <label className={labelCls} htmlFor="c-meta">Meta description <span className="font-normal text-gray-600">({form.meta_description.length}/155 recommended)</span></label>
              <input id="c-meta" className={inputCls} value={form.meta_description} onChange={(e) => set('meta_description', e.target.value)} placeholder="Defaults to the summary" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="c-img">Featured image address</label>
              <input id="c-img" className={inputCls} value={form.featured_image_url} onChange={(e) => set('featured_image_url', e.target.value)} placeholder="https://…" />
              {editable && (
                <SecondaryButton type="button" className="mt-2" onClick={() => setPicking(true)} data-testid="choose-from-library">Choose from Photo Library</SecondaryButton>
              )}
              <p className={helpCls}>Only approved library photos can be chosen. An article can&apos;t be approved while it uses an unapproved library photo.</p>
              <PhotoPicker
                open={picking}
                onClose={() => setPicking(false)}
                title="Choose a featured photo"
                onSelect={(p) => {
                  setForm((f) => ({ ...f, featured_image_url: p.public_url, featured_image_alt: p.alt_text || f.featured_image_alt }));
                  setHero((h) => ({
                    ...h,
                    featured_image_focus_x: p.focus_x, featured_image_focus_y: p.focus_y,
                    featured_image_width: p.width, featured_image_height: p.height,
                  }));
                }}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="c-alt">Image description (alt text)</label>
              <input id="c-alt" className={inputCls} value={form.featured_image_alt} onChange={(e) => set('featured_image_alt', e.target.value)} placeholder="Describe what the image shows" />
            </div>
          </div>
          {/^https?:\/\//i.test(form.featured_image_url) && (
            <HeroImageControls
              src={form.featured_image_url}
              alt={form.featured_image_alt || form.title}
              value={hero}
              disabled={!editable || busy}
              onChange={(patch) => setHero((h) => ({ ...h, ...patch }))}
            />
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="c-sources">Sources (one web address per line)</label>
              <textarea id="c-sources" rows={3} className={inputCls} value={form.sources} onChange={(e) => set('sources', e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className={labelCls} htmlFor="c-author">Author</label>
              <input id="c-author" className={inputCls} value={form.author_name} onChange={(e) => set('author_name', e.target.value)} />
            </div>
          </div>
          {editable && (
            <div className="flex flex-wrap gap-2">
              <PrimaryButton type="button" onClick={() => save(false)} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {isNew ? 'Save draft' : 'Save changes'}
              </PrimaryButton>
              {isNew && <SecondaryButton type="button" onClick={() => save(true)} disabled={busy}>Save as idea</SecondaryButton>}
            </div>
          )}
        </fieldset>
      )}

      {actions.length > 0 && (
        <div className="space-y-3 rounded-lg border border-gray-300 p-4">
          <p className="text-sm font-semibold text-gray-900">Workflow</p>
          <div className="flex flex-wrap gap-2">
            {actions.map((a) =>
              a === 'approve' || a === 'submit' || a === 'schedule' ? (
                <PrimaryButton key={a} onClick={() => onAction(a)} disabled={busy}>{a === 'schedule' && <CalendarClock className="h-4 w-4" />}{ACTION_LABELS[a]}</PrimaryButton>
              ) : a === 'reject' ? (
                <button key={a} onClick={() => onAction(a)} disabled={busy} className="rounded-md border border-red-400 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{ACTION_LABELS[a]}</button>
              ) : (
                <SecondaryButton key={a} onClick={() => onAction(a)} disabled={busy}>{ACTION_LABELS[a]}</SecondaryButton>
              )
            )}
          </div>
          {rejecting && (
            <div className="space-y-2">
              <label className={labelCls} htmlFor="c-reject">Reason for rejecting (required)</label>
              <textarea id="c-reject" rows={3} className={inputCls} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => act('reject', { note: rejectNote })} disabled={busy || !rejectNote.trim()} className="rounded-md border border-red-500 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Confirm rejection</button>
                <SecondaryButton onClick={() => setRejecting(false)}>Cancel</SecondaryButton>
              </div>
            </div>
          )}
          {scheduling && (
            <div className="space-y-2">
              <label className={labelCls} htmlFor="c-when">Publish on (your local time)</label>
              <input id="c-when" type="datetime-local" className={`${inputCls} max-w-xs`} value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
              <div className="flex gap-2">
                <PrimaryButton onClick={() => act('schedule', { scheduledFor: new Date(scheduleAt).toISOString() })} disabled={busy || !scheduleAt}>Confirm schedule</PrimaryButton>
                <SecondaryButton onClick={() => setScheduling(false)}>Cancel</SecondaryButton>
              </div>
            </div>
          )}
        </div>
      )}

      {!isNew && (
        <div className="rounded-lg border border-gray-300 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900"><History className="h-4 w-4" /> History</p>
          {history.length === 0 ? (
            <p className="text-sm text-gray-700">No history yet.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="text-sm text-gray-900">
                  <span className="font-semibold">{h.action === 'created' ? 'Created' : h.action === 'status_changed' ? 'Status changed' : ACTION_LABELS[h.action as ContentAction] || h.action}</span>
                  {h.to_status && <> → {STATUS_LABELS[h.to_status as ContentStatus] || h.to_status}</>}
                  <span className="text-gray-700"> · {fmt(h.created_at)}{h.actor_name ? ` · ${h.actor_name}` : h.action === 'created' ? ' · creator not recorded' : ''}</span>
                  {h.note && <p className="ml-3 text-gray-800">“{h.note}”</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
