'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, FolderOpen, ImagePlus, Loader2, TriangleAlert, XCircle } from 'lucide-react';
import { dhashOfFile, newLibraryPath, sha256OfFile } from '@/lib/photos/browser';
import {
  ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES, USAGE_RIGHTS, USAGE_RIGHTS_LABELS, manifestSuggestions, parseCsv,
} from '@/lib/photos/library';
import { PrimaryButton, SecondaryButton, fmtBytes, helpCls, inputCls, labelCls, useAdminApi } from './ui';

type Row = { name: string; size: number; state: 'waiting' | 'checking' | 'uploading' | 'done' | 'skipped' | 'error'; note?: string };

/**
 * Upload single photos or a whole folder. Each file is fingerprinted first; exact
 * duplicates are skipped before anything is uploaded. Originals go to PRIVATE storage
 * unchanged (no resizing, no re-encoding) and never overwrite an existing file.
 * Everything arrives as "pending review" and is not publicly reachable until approved.
 */
export default function PhotoUploader({ onDone }: { onDone: () => void }) {
  const { api, supabase } = useAdminApi();
  const filesRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [manifest, setManifest] = useState<Record<string, string>[] | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [isAi, setIsAi] = useState(false);
  const [rights, setRights] = useState('unknown');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [skipFolders, setSkipFolders] = useState('Concept_Contact_Sheets, Low_Resolution_Reference_Thumbnails');

  const pick = async (list: FileList | null) => {
    if (!list) return;
    const all = Array.from(list);
    const csv = all.find((f) => /IMAGE_MANIFEST\.csv$/i.test(f.name));
    setManifest(csv ? parseCsv(await csv.text()) : null);
    const skip = skipFolders.split(',').map((s) => s.trim()).filter(Boolean);
    const images = all.filter((f) => (ALLOWED_PHOTO_TYPES as readonly string[]).includes(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
    const kept = images.filter((f) => !skip.some((s) => ((f as any).webkitRelativePath || '').split('/').includes(s)));
    setFiles(kept);
    setRows(kept.map((f) => ({ name: (f as any).webkitRelativePath || f.name, size: f.size, state: 'waiting' })));
  };

  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const run = async () => {
    setBusy(true);
    const batch = `import-${new Date().toISOString().slice(0, 16)}`;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        if (f.size > MAX_PHOTO_BYTES) { update(i, { state: 'skipped', note: 'Larger than 25 MB' }); continue; }
        update(i, { state: 'checking' });
        const sha = await sha256OfFile(f);
        const check = await api('/api/admin/photos/check', { method: 'POST', body: JSON.stringify({ sha256: sha }) });
        if (check.duplicates?.length) {
          update(i, { state: 'skipped', note: `Identical file already in the library (${check.duplicates[0].original_filename})` });
          continue;
        }
        const dhash = await dhashOfFile(f);
        update(i, { state: 'uploading' });
        const path = newLibraryPath(f.name);
        const { error: upErr } = await supabase.storage.from('photo-library').upload(path, f, { upsert: false, contentType: f.type || undefined, cacheControl: '3600' });
        if (upErr) throw new Error(upErr.message);
        const suggested = manifest ? manifestSuggestions(manifest, f.name) : null;
        const json = await api('/api/admin/photos/register', {
          method: 'POST',
          body: JSON.stringify({
            storage_path: path,
            original_filename: f.name,
            dhash,
            import_batch: batch,
            is_ai_generated: isAi,
            usage_rights: rights,
            source: source || null,
            category: suggested?.category || category || null,
            title: suggested?.title || null,
            tags: suggested?.tags || [],
            intended_uses: suggested?.intended_uses || [],
            external_ref: suggested?.external_ref || null,
            description: suggested?.import_note ? `Import note: ${suggested.import_note}` : null,
          }),
        });
        const p = json.photo;
        update(i, { state: 'done', note: `${p.width}×${p.height}${p.width < 800 ? ' — low resolution' : ''}` });
      } catch (e: any) {
        if (e.status === 409) update(i, { state: 'skipped', note: e.message });
        else update(i, { state: 'error', note: e.message });
      }
    }
    setBusy(false);
    onDone();
  };

  const counts = rows.reduce((a, r) => ({ ...a, [r.state]: (a[r.state] || 0) + 1 }), {} as Record<string, number>);

  return (
    <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-4 text-gray-900" data-testid="photo-uploader">
      <div>
        <p className="text-base font-semibold">Add photos</p>
        <p className="text-sm text-gray-700">
          Originals are stored privately, exactly as they are (never resized or replaced). Identical files are skipped. Everything
          starts as <strong>pending review</strong> and is not visible to the public. Approving a photo makes a public copy for articles.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="up-rights">Usage rights for these photos</label>
          <select id="up-rights" className={inputCls} value={rights} onChange={(e) => setRights(e.target.value)} disabled={busy}>
            {USAGE_RIGHTS.map((r) => <option key={r} value={r}>{USAGE_RIGHTS_LABELS[r]}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="up-source">Photographer / source</label>
          <input id="up-source" className={inputCls} value={source} onChange={(e) => setSource(e.target.value)} disabled={busy} placeholder="e.g. Alex Deyo, or the AI tool used" />
        </div>
        <div>
          <label className={labelCls} htmlFor="up-category">Category (if no import list)</label>
          <input id="up-category" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} disabled={busy} placeholder="e.g. Homeowners" />
        </div>
        <div>
          <label className={labelCls} htmlFor="up-skip">Skip folders named</label>
          <input id="up-skip" className={inputCls} value={skipFolders} onChange={(e) => setSkipFolders(e.target.value)} disabled={busy} />
          <p className={helpCls}>Comma-separated. Applies when you choose a folder.</p>
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[#F26A21]" checked={isAi} onChange={(e) => setIsAi(e.target.checked)} disabled={busy} />
        <span><strong>These photos are AI-generated.</strong> They will need your three-point review before they can be approved.</span>
      </label>

      <div className="flex flex-wrap gap-2">
        <input ref={filesRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files)} />
        {/* @ts-expect-error webkitdirectory is supported by Chrome, Edge and Safari */}
        <input ref={folderRef} type="file" webkitdirectory="" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
        <SecondaryButton type="button" onClick={() => filesRef.current?.click()} disabled={busy}><ImagePlus className="h-4 w-4" /> Choose photos</SecondaryButton>
        <SecondaryButton type="button" onClick={() => folderRef.current?.click()} disabled={busy}><FolderOpen className="h-4 w-4" /> Choose a folder</SecondaryButton>
        <PrimaryButton type="button" onClick={run} disabled={busy || !files.length} data-testid="start-upload">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Upload {files.length || ''} photo{files.length === 1 ? '' : 's'}
        </PrimaryButton>
      </div>
      {manifest && <p className="text-sm text-emerald-800">Found IMAGE_MANIFEST.csv ({manifest.length} rows): titles, categories, tags and uses will be filled in from it.</p>}

      {rows.length > 0 && (
        <div>
          <p className="mb-1 text-sm text-gray-800">
            {rows.length} photo(s) · {counts.done || 0} added · {counts.skipped || 0} skipped · {counts.error || 0} failed
          </p>
          <ul className="max-h-72 space-y-1 overflow-auto rounded-md border border-gray-200 p-2 text-sm" data-testid="upload-rows">
            {rows.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                {r.state === 'done' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                  : r.state === 'error' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />
                  : r.state === 'skipped' ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  : r.state === 'waiting' ? <span className="mt-0.5 h-4 w-4 shrink-0" />
                  : <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />}
                <span className="min-w-0 break-all">{r.name} <span className="text-gray-600">({fmtBytes(r.size)})</span>{r.note ? <span className="text-gray-800"> — {r.note}</span> : null}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
