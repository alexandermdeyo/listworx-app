'use client';

import { useCallback, useEffect, useState } from 'react';
import { Archive, ArrowLeft, CheckCircle2, Loader2, RotateCcw, Save, TriangleAlert, XCircle } from 'lucide-react';
import HeroImageControls from '@/components/admin/content/HeroImageControls';
import {
  AI_CHECKLIST, MANUAL_FLAGS, MANUAL_FLAG_LABELS, PHOTO_STATUS_LABELS, PHOTO_USES, PHOTO_USE_LABELS, USAGE_RIGHTS,
  USAGE_RIGHTS_LABELS, approvalProblems,
} from '@/lib/photos/library';
import {
  DangerButton, PHOTO_STATUS_STYLES, PrimaryButton, SecondaryButton, fmtBytes, fmtDate, helpCls, inputCls, labelCls,
  useAdminApi, type LibraryPhoto,
} from './ui';

type Detail = {
  photo: LibraryPhoto;
  related: { id: string; original_filename: string; preview_url: string | null; status: string; width: number; height: number }[];
  usedIn: { id: string; title: string; slug: string; status: string; published: boolean }[];
  reviewerName: string | null;
  history: { id: string; action: string; from_status: string | null; to_status: string | null; actor_name: string | null; note: string | null; created_at: string }[];
};

function copyText(outcome?: string, published?: { title: string }[]) {
  if (outcome === 'created') return 'A public copy was created for articles.';
  if (outcome === 'removed') return 'Its public copy was removed; the original is kept privately.';
  if (outcome === 'retained') return `Its public copy was KEPT because published articles use it: ${(published || []).map((x) => x.title).join(', ')}.`;
  return '';
}

const ACTION_LABELS: Record<string, string> = {
  approve: 'Approved', reject: 'Rejected', reset: 'Back to pending', auto_reset: 'Back to pending (rights or AI flag changed)',
  public_copy_created: 'Public copy created', public_copy_removed: 'Public copy removed',
  public_copy_retained: 'Public copy kept online', original_secured: 'Original moved to private storage',
};

const LEVEL_STYLE = { block: 'border-red-300 bg-red-50 text-red-900', warn: 'border-amber-300 bg-amber-50 text-amber-950', info: 'border-gray-300 bg-gray-50 text-gray-800' };

export default function PhotoDetail({ id, onClose, onChanged, onOpen }: { id: string; onClose: () => void; onChanged: () => void; onOpen: (id: string) => void }) {
  const { api } = useAdminApi();
  const [d, setD] = useState<Detail | null>(null);
  const [form, setForm] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const json: Detail = await api(`/api/admin/photos/${id}`);
    setD(json);
    const p = json.photo;
    setForm({
      title: p.title || '', description: p.description || '', alt_text: p.alt_text || '', category: p.category || '',
      tags: p.tags.join(', '), intended_uses: p.intended_uses, source: p.source || '', usage_rights: p.usage_rights,
      rights_notes: p.rights_notes || '', is_ai_generated: p.is_ai_generated, quality_flags: p.quality_flags,
      focus_x: p.focus_x, focus_y: p.focus_y,
    });
    setChecklist({});
    setNote('');
  }, [api, id]);

  useEffect(() => { load().catch((e) => setMsg({ text: e.message, error: true })); }, [load]);

  if (!d || !form) return <div className="flex items-center gap-2 p-8 text-gray-800"><Loader2 className="h-5 w-5 animate-spin" /> Loading photo…</div>;
  const p = d.photo;
  const dirty = JSON.stringify(form) !== JSON.stringify({
    title: p.title || '', description: p.description || '', alt_text: p.alt_text || '', category: p.category || '',
    tags: p.tags.join(', '), intended_uses: p.intended_uses, source: p.source || '', usage_rights: p.usage_rights,
    rights_notes: p.rights_notes || '', is_ai_generated: p.is_ai_generated, quality_flags: p.quality_flags,
    focus_x: p.focus_x, focus_y: p.focus_y,
  });
  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));
  const toggle = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x: string) => x !== v) : [...f[k], v] }));

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await api(`/api/admin/photos/${id}`, { method: 'PATCH', body: JSON.stringify(form) });
      await load(); onChanged();
      setMsg({ text: `Saved. ${r.photo?.status === 'pending' && p.status === 'approved' ? 'Rights or AI status changed, so it needs review again. ' : ''}${copyText(r.publicCopy, r.publishedUses)}` });
    } catch (e: any) { setMsg({ text: e.message, error: true }); }
    setBusy(false);
  };

  const review = async (decision: 'approve' | 'reject' | 'reset') => {
    setBusy(true); setMsg(null);
    try {
      const r = await api(`/api/admin/photos/${id}/review`, { method: 'POST', body: JSON.stringify({ decision, note, checklist }) });
      await load(); onChanged();
      const base = decision === 'approve' ? 'Approved.' : decision === 'reject' ? 'Rejected.' : 'Returned to pending review.';
      setMsg({ text: `${base} ${copyText(r.publicCopy, r.publishedUses)}` });
    } catch (e: any) { setMsg({ text: e.message, error: true }); }
    setBusy(false);
  };

  const archive = async (archived: boolean) => {
    setBusy(true); setMsg(null);
    try {
      const r = await api(`/api/admin/photos/${id}`, { method: 'PATCH', body: JSON.stringify({ archived }) });
      await load(); onChanged();
      setMsg({ text: `${archived ? 'Archived: hidden from the library and picker. The original file is kept.' : 'Restored to the library.'} ${copyText(r.publicCopy, r.publishedUses)}` });
    } catch (e: any) { setMsg({ text: e.message, error: true }); }
    setBusy(false);
  };

  const problems = approvalProblems({ ...p, alt_text: p.alt_text, usage_rights: p.usage_rights, is_ai_generated: p.is_ai_generated } as any, checklist);
  const heroSettings = {
    featured_image_focus_x: form.focus_x, featured_image_focus_y: form.focus_y, featured_image_fit: 'auto',
    featured_image_width: p.width, featured_image_height: p.height,
  };

  return (
    <div className="space-y-5 text-gray-900" data-testid="photo-detail">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SecondaryButton onClick={onClose}><ArrowLeft className="h-4 w-4" /> All photos</SecondaryButton>
        <div className="flex items-center gap-2">
          {p.is_ai_generated && <span className="rounded-full border border-purple-300 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-900">AI-generated</span>}
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PHOTO_STATUS_STYLES[p.status]}`} data-testid="photo-status">{PHOTO_STATUS_LABELS[p.status]}</span>
          {p.archived && <span className="rounded-full border border-gray-400 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">Archived</span>}
        </div>
      </div>
      {msg && <p className={`rounded-md border px-3 py-2 text-sm ${msg.error ? 'border-red-300 bg-red-50 text-red-800' : 'border-emerald-300 bg-emerald-50 text-emerald-900'}`} role="status">{msg.text}</p>}

      {(p.status !== 'approved' || p.archived) && d.usedIn.length > 0 && (
        <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-950" role="alert" data-testid="photo-in-use-alert">
          <p className="flex items-center gap-2 text-base font-bold"><TriangleAlert className="h-5 w-5" /> This photo is {p.archived ? 'archived' : p.status} but articles still use it</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {d.usedIn.map((u) => (
              <li key={u.id}>
                <strong>{u.title}</strong> — {u.published ? 'PUBLISHED (visitors can see this photo)' : `not published (${u.status}); it can't be approved or published until the photo is replaced`}
                {' · '}<a className="font-semibold underline" href="/admin/crm/blog">Replace in the Blog editor</a>
                {!u.published && <>{' · '}<a className="font-semibold underline" href="/admin/crm/content">Open Content</a></>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm">
            Nothing was unpublished or deleted automatically. Replace the photo in each article (or approve the photo again).
            {p.public_copy_live ? ' Its public copy stays online until no published article uses it; after replacing, archive or re-review the photo to remove it.' : ''}
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.preview_url || ''} alt={p.alt_text || ''} className="max-h-[520px] w-full rounded-lg border border-gray-300 bg-gray-100 object-contain" />
          <p className="text-sm text-gray-800 break-all">
            <strong>{p.original_filename}</strong> · {p.width}×{p.height} · {fmtBytes(p.file_size)} · {p.mime_type.replace('image/', '').toUpperCase()} · added {fmtDate(p.created_at)}
          </p>
          <p className="text-xs text-gray-700 break-all">
            Original ({p.storage_bucket === 'photo-library' ? 'private storage' : 'older photo, still in public storage'}, never modified): {p.storage_path}
          </p>
          <p className="text-sm text-gray-900" data-testid="public-copy-status">
            <strong>Public copy:</strong>{' '}
            {p.public_copy_live
              ? (p.status === 'approved' && !p.archived ? 'online — articles can use it.' : 'still online only because published articles use it (see the warning).')
              : p.public_url ? 'removed — not visible to the public. Approve it again to restore it at the same address.'
              : 'none — not visible to the public until approved.'}
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold">Checks</p>
          {(p.warnings || []).length === 0 && <p className="text-sm text-gray-800">No warnings from the file size, metadata or duplicate checks.</p>}
          <ul className="space-y-1.5" data-testid="photo-warnings">
            {(p.warnings || []).map((w) => (
              <li key={w.code} className={`flex gap-2 rounded-md border px-3 py-2 text-sm ${LEVEL_STYLE[w.level]}`}><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />{w.text}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-700">
            These checks use the file&apos;s size, its fingerprint and the details below. Nothing here looks at what the photo shows:
            faces, hands, text and realism are for you to check by eye.
          </p>
          {d.related.length > 0 && (
            <div>
              <p className="mt-2 text-sm font-semibold">Duplicates and look-alikes</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {d.related.map((r) => (
                  <button key={r.id} type="button" onClick={() => onOpen(r.id)} className="w-28 text-left" title={r.original_filename}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.preview_url || ''} alt="" loading="lazy" className="h-20 w-28 rounded border border-gray-300 object-cover" />
                    <span className="block truncate text-xs text-gray-800">{r.original_filename}</span>
                    <span className="block text-xs text-gray-600">{r.width}×{r.height} · {r.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mt-2 text-sm font-semibold">Used in</p>
            {d.usedIn.length ? (
              <ul className="text-sm">{d.usedIn.map((u) => <li key={u.id}>{u.title} <span className="text-gray-600">({u.published ? 'published' : u.status})</span></li>)}</ul>
            ) : <p className="text-sm text-gray-700">Not used in any article.</p>}
          </div>
        </div>
      </div>

      <fieldset disabled={busy} className="space-y-4 rounded-lg border border-gray-300 p-4">
        <legend className="px-1 text-base font-semibold">Details</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className={labelCls} htmlFor="ph-title">Title</label><input id="ph-title" className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
          <div><label className={labelCls} htmlFor="ph-category">Category</label><input id="ph-category" className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Homeowners" /></div>
        </div>
        <div>
          <label className={labelCls} htmlFor="ph-alt">Alt text <span className="font-normal text-gray-600">({form.alt_text.length}/300) — required for approval</span></label>
          <input id="ph-alt" className={inputCls} value={form.alt_text} onChange={(e) => set('alt_text', e.target.value)} placeholder="Describe what is visible, e.g. A contractor shows a homeowner a license card at a kitchen counter" />
          <p className={helpCls}>Describe what is in the photo. No keyword stuffing, and no claims the photo can&apos;t prove.</p>
        </div>
        <div><label className={labelCls} htmlFor="ph-desc">Description / notes</label><textarea id="ph-desc" rows={2} className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className={labelCls} htmlFor="ph-tags">Tags (comma-separated)</label><input id="ph-tags" className={inputCls} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="roofing, inspection, homeowner" /></div>
          <div><label className={labelCls} htmlFor="ph-source">Photographer / source</label><input id="ph-source" className={inputCls} value={form.source} onChange={(e) => set('source', e.target.value)} /></div>
          <div>
            <label className={labelCls} htmlFor="ph-rights">Usage rights — required for approval</label>
            <select id="ph-rights" className={inputCls} value={form.usage_rights} onChange={(e) => set('usage_rights', e.target.value)}>
              {USAGE_RIGHTS.map((r) => <option key={r} value={r}>{USAGE_RIGHTS_LABELS[r]}</option>)}
            </select>
          </div>
          <div><label className={labelCls} htmlFor="ph-rights-notes">Rights notes (licence, credit line)</label><input id="ph-rights-notes" className={inputCls} value={form.rights_notes} onChange={(e) => set('rights_notes', e.target.value)} /></div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[#E8621A]" checked={form.is_ai_generated} onChange={(e) => set('is_ai_generated', e.target.checked)} />
          <span><strong>AI-generated.</strong> Requires the three-point review before approval. Changing this (or the rights) on an approved photo sends it back to review.</span>
        </label>
        <div>
          <p className={labelCls}>Intended use</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {PHOTO_USES.map((u) => (
              <label key={u} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#E8621A]" checked={form.intended_uses.includes(u)} onChange={() => toggle('intended_uses', u)} />{PHOTO_USE_LABELS[u]}</label>
            ))}
          </div>
        </div>
        <div>
          <p className={labelCls}>Problems you can see (mark by eye)</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {MANUAL_FLAGS.map((f) => (
              <label key={f} className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#E8621A]" checked={form.quality_flags.includes(f)} onChange={() => toggle('quality_flags', f)} />{MANUAL_FLAG_LABELS[f]}</label>
            ))}
          </div>
        </div>

        <HeroImageControls
          key={p.id}
          src={p.preview_url || ''}
          alt={form.alt_text || p.original_filename}
          value={heroSettings}
          showFit={false}
          onChange={(patch) => {
            if ('featured_image_focus_x' in patch || 'featured_image_focus_y' in patch) {
              setForm((f: any) => ({
                ...f,
                focus_x: 'featured_image_focus_x' in patch ? patch.featured_image_focus_x ?? null : f.focus_x,
                focus_y: 'featured_image_focus_y' in patch ? patch.featured_image_focus_y ?? null : f.focus_y,
              }));
            }
          }}
        />
        <p className={helpCls}>The focus point is copied into an article when you pick this photo; each article can still adjust it.</p>

        <div className="flex flex-wrap gap-2">
          <PrimaryButton type="button" onClick={save} disabled={!dirty || busy}><Save className="h-4 w-4" /> Save details</PrimaryButton>
          {p.archived
            ? <SecondaryButton type="button" onClick={() => archive(false)}>Restore to library</SecondaryButton>
            : <SecondaryButton type="button" onClick={() => archive(true)}><Archive className="h-4 w-4" /> Archive (keeps the file)</SecondaryButton>}
        </div>
      </fieldset>

      {!p.archived && (
        <div className="space-y-3 rounded-lg border border-gray-300 p-4" data-testid="photo-review">
          <p className="text-base font-semibold">Review</p>
          {p.status !== 'pending' && (
            <p className="text-sm text-gray-800">{PHOTO_STATUS_LABELS[p.status]} by {d.reviewerName || 'Admin'} on {fmtDate(p.reviewed_at)}{p.review_note ? ` — "${p.review_note}"` : ''}</p>
          )}
          {dirty && <p className="text-sm text-amber-900">Save your detail changes before reviewing.</p>}
          {p.is_ai_generated && p.status !== 'approved' && (
            <div className="rounded-md border border-purple-300 bg-purple-50 p-3">
              <p className="mb-1 text-sm font-semibold text-purple-950">AI-generated photo — confirm each point after looking closely</p>
              {AI_CHECKLIST.map((c) => (
                <label key={c.key} className="flex items-start gap-2 text-sm text-purple-950">
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-[#E8621A]" checked={!!checklist[c.key]} onChange={(e) => setChecklist((x) => ({ ...x, [c.key]: e.target.checked }))} />{c.label}
                </label>
              ))}
            </div>
          )}
          <div>
            <label className={labelCls} htmlFor="ph-note">Review note {p.status !== 'rejected' && <span className="font-normal text-gray-600">(required to reject)</span>}</label>
            <input id="ph-note" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Hand on the card looks unnatural" />
          </div>
          {p.status !== 'approved' && problems.length > 0 && <p className="text-sm text-gray-800">Before approving: {problems.join(' · ')}.</p>}
          <div className="flex flex-wrap gap-2">
            {p.status !== 'approved' && (
              <PrimaryButton type="button" onClick={() => review('approve')} disabled={busy || dirty || problems.length > 0} data-testid="approve-photo">
                <CheckCircle2 className="h-4 w-4" /> Approve
              </PrimaryButton>
            )}
            {p.status !== 'rejected' && (
              <DangerButton type="button" onClick={() => review('reject')} disabled={busy || !note.trim()} data-testid="reject-photo"><XCircle className="h-4 w-4" /> Reject</DangerButton>
            )}
            {p.status !== 'pending' && <SecondaryButton type="button" onClick={() => review('reset')} disabled={busy}><RotateCcw className="h-4 w-4" /> Back to pending</SecondaryButton>}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-300 p-4">
        <p className="mb-2 text-base font-semibold">Review history</p>
        {d.history.length === 0 ? <p className="text-sm text-gray-700">No reviews yet.</p> : (
          <ul className="space-y-1 text-sm" data-testid="photo-history">
            {d.history.map((h) => (
              <li key={h.id}>
                <strong>{ACTION_LABELS[h.action] || h.action.replace(/_/g, ' ')}</strong> → {h.to_status} · {fmtDate(h.created_at)}{h.actor_name ? ` · ${h.actor_name}` : ''}
                {h.note ? <span className="text-gray-800"> — {h.note}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
