'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Loader2, Search, X } from 'lucide-react';
import { PHOTO_STATUS_LABELS, PHOTO_USES, PHOTO_USE_LABELS } from '@/lib/photos/library';
import PhotoDetail from './PhotoDetail';
import PhotoUploader from './PhotoUploader';
import PhotoIssuesBanner from './PhotoIssuesBanner';
import { PHOTO_STATUS_STYLES, PrimaryButton, SecondaryButton, inputCls, useAdminApi, type LibraryPhoto } from './ui';

const FLAGS: { value: string; label: string }[] = [
  { value: '', label: 'Any' },
  { value: 'duplicates', label: 'Duplicates & look-alikes' },
  { value: 'low_res', label: 'Low resolution' },
  { value: 'ai', label: 'AI-generated' },
  { value: 'needs_alt', label: 'Missing alt text' },
  { value: 'flagged', label: 'Marked with problems' },
  { value: 'attention', label: 'Used in articles but not approved' },
];

export default function PhotoLibrary() {
  const { api } = useAdminApi();
  const [photos, setPhotos] = useState<LibraryPhoto[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [use, setUse] = useState('');
  const [flag, setFlag] = useState('');
  const [archived, setArchived] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [older, setOlder] = useState(0);
  const [securing, setSecuring] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ q, status, category, use, flag, archived: archived ? '1' : '' });
      const json = await api(`/api/admin/photos?${params}`);
      setPhotos(json.photos);
      setCounts(json.counts);
      setTotal(json.total);
      setCategories(json.categories);
      setOlder(json.olderPublicOriginals || 0);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }, [api, q, status, category, use, flag, archived]);

  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  if (openId) {
    return <PhotoDetail key={openId} id={openId} onClose={() => { setOpenId(null); load(); }} onChanged={() => {}} onOpen={setOpenId} />;
  }

  return (
    <div className="space-y-5 bg-white text-gray-900" data-testid="photo-library">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Photo Library</h1>
          <p className="text-sm text-gray-700">
            Every photo for articles and future newsletters and social posts. New photos start as pending; only approved photos can
            go into a published article.
          </p>
        </div>
        <PrimaryButton onClick={() => setUploading((u) => !u)} data-testid="toggle-uploader">
          {uploading ? <X className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />} {uploading ? 'Close' : 'Add photos'}
        </PrimaryButton>
      </div>

      <PhotoIssuesBanner onOpenPhoto={setOpenId} refreshKey={refreshKey} />

      {older > 0 && (
        <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm text-amber-950" data-testid="secure-older">
          <p className="font-semibold">{older} older photo{older === 1 ? ' was' : 's were'} uploaded before private storage and {older === 1 ? 'is' : 'are'} still publicly reachable.</p>
          <p className="mt-1">This copies each original into private storage (checked against its fingerprint), then keeps a public copy only for approved photos and for photos that published articles use.</p>
          <SecondaryButton
            className="mt-2"
            disabled={!!securing}
            onClick={async () => {
              setSecuring('Working…');
              try {
                const r = await api('/api/admin/photos/secure-older', { method: 'POST' });
                setSecuring(r.results.map((x: any) => `${x.file}: ${x.result}`).join(' · ') || 'Nothing to do');
              } catch (e: any) {
                setSecuring(e.message);
              }
              load();
            }}
          >
            Move older originals to private storage
          </SecondaryButton>
          {securing && <p className="mt-2" role="status">{securing}</p>}
        </div>
      )}

      {uploading && <PhotoUploader onDone={load} />}

      <div className="flex flex-wrap gap-2" role="tablist">
        {[['', `All (${total})`], ...(['pending', 'approved', 'rejected'] as const).map((s) => [s, `${PHOTO_STATUS_LABELS[s]} (${counts[s] || 0})`])].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => { setStatus(value); setArchived(false); }}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${status === value && !archived ? 'border-transparent text-white' : 'border-gray-400 bg-white text-gray-900 hover:bg-gray-50'}`}
            style={status === value && !archived ? { backgroundColor: '#E8621A' } : undefined}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setArchived((a) => !a)}
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${archived ? 'border-transparent bg-gray-800 text-white' : 'border-gray-400 bg-white text-gray-900 hover:bg-gray-50'}`}
        >
          Archived
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input aria-label="Search photos" className={`${inputCls} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search file name, title, category, tags…" data-testid="photo-search" />
        </div>
        <select aria-label="Category" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select aria-label="Intended use" className={inputCls} value={use} onChange={(e) => setUse(e.target.value)} data-testid="photo-use-filter">
          <option value="">Any use</option>
          {PHOTO_USES.map((u) => <option key={u} value={u}>{PHOTO_USE_LABELS[u]}</option>)}
        </select>
        <select aria-label="Checks" className={inputCls} value={flag} onChange={(e) => setFlag(e.target.value)} data-testid="photo-flag-filter">
          {FLAGS.map((f) => <option key={f.value} value={f.value}>{f.value ? f.label : 'Any checks'}</option>)}
        </select>
      </div>

      {error && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {loading ? (
        <div className="flex items-center gap-2 py-10 text-gray-800"><Loader2 className="h-5 w-5 animate-spin" /> Loading photos…</div>
      ) : photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-400 p-10 text-center text-sm text-gray-800">
          No photos match. {total === 0 && 'Use “Add photos” to start the library.'}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" data-testid="photo-grid">
          {photos.map((p) => {
            const lowRes = p.warnings?.some((w) => ['very_low_res', 'low_res'].includes(w.code));
            const dup = (p.duplicates?.exact.length || 0) + (p.duplicates?.similar.length || 0) > 0;
            return (
              <li key={p.id}>
                <button type="button" onClick={() => setOpenId(p.id)} className="group block w-full overflow-hidden rounded-lg border border-gray-300 bg-white text-left hover:border-[#E8621A]">
                  <div className="relative aspect-[4/3] bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.preview_url || ''} alt={p.alt_text || ''} loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: `${p.focus_x ?? 50}% ${p.focus_y ?? 30}%` }} />
                    <span className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${PHOTO_STATUS_STYLES[p.status]}`}>{PHOTO_STATUS_LABELS[p.status]}</span>
                  </div>
                  <div className="space-y-1 p-2">
                    <p className="truncate text-sm font-semibold" title={p.original_filename}>{p.title || p.original_filename}</p>
                    <p className="text-xs text-gray-700">{p.width}×{p.height}{p.category ? ` · ${p.category}` : ''}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.is_ai_generated && <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[11px] font-semibold text-purple-900">AI</span>}
                      {lowRes && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-900">Low-res</span>}
                      {dup && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-950">Duplicate?</span>}
                      {!p.alt_text && <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[11px] font-semibold text-gray-900">No alt text</span>}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!loading && photos.length > 0 && <SecondaryButton onClick={load}>Refresh</SecondaryButton>}
    </div>
  );
}
