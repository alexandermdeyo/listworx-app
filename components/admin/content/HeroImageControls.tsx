'use client';

import { useEffect, useRef } from 'react';
import { Crosshair, RotateCcw, TriangleAlert } from 'lucide-react';
import HeroImage from '@/components/blog/HeroImage';
import {
  FRAMES, FRAME_NAMES, HERO_FITS, HERO_FIT_LABELS, cropWarnings, heroFit, heroFocus, resolveFit,
  type HeroSettings,
} from '@/lib/content/hero-image';

/**
 * Featured-photo position controls + exact previews (Stage 1B). Used by the Content
 * editor and the Blog editor. Previews use the same HeroImage component and frame
 * shapes as the public article page.
 *
 * Warnings come from the photo's shape and the focus point only — nothing here looks
 * at what is in the photo (no face detection).
 */
export default function HeroImageControls({
  src, alt, value, onChange, disabled = false,
}: {
  src: string;
  alt: string;
  value: HeroSettings;
  onChange: (patch: HeroSettings) => void;
  disabled?: boolean;
}) {
  const focus = heroFocus(value);
  const fit = heroFit(value);
  const warnings = cropWarnings(value);
  const pickerRef = useRef<HTMLDivElement>(null);
  const sized = !!(value.featured_image_width && value.featured_image_height);

  // Record the photo's real size whenever the address changes (used for the
  // automatic display choice and the crop warnings).
  useEffect(() => {
    if (!src || disabled) return;
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
      if (img.naturalWidth !== value.featured_image_width || img.naturalHeight !== value.featured_image_height) {
        onChange({ featured_image_width: img.naturalWidth, featured_image_height: img.naturalHeight });
      }
    };
    img.src = src;
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, disabled]);

  const setFocusFromPointer = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !pickerRef.current) return;
    const r = pickerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    onChange({ featured_image_focus_x: Math.min(100, Math.max(0, x)), featured_image_focus_y: Math.min(100, Math.max(0, y)) });
  };

  if (!src) return null;
  const ratio = sized ? value.featured_image_width! / value.featured_image_height! : 16 / 9;

  return (
    <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-4 text-gray-900" data-testid="hero-controls">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Featured photo position</p>
        <p className="text-xs text-gray-700">
          {sized ? `Photo size ${value.featured_image_width} × ${value.featured_image_height}` : 'Measuring photo…'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="mb-1 text-xs font-semibold text-gray-800">Whole photo — click the most important spot (for example, faces)</p>
          <div
            ref={pickerRef}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label="Set the photo's focus point"
            onClick={setFocusFromPointer}
            className={`relative w-full overflow-hidden rounded-md border border-gray-400 bg-gray-100 ${disabled ? 'cursor-not-allowed opacity-80' : 'cursor-crosshair'}`}
            style={{ aspectRatio: String(ratio) }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="absolute inset-0 h-full w-full object-fill" draggable={false} />
            <span
              className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_#E8621A]"
              style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
              data-testid="focus-marker"
            >
              <Crosshair className="h-full w-full p-0.5 text-white" />
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-800" htmlFor="hero-fit">Display</label>
            <select
              id="hero-fit"
              disabled={disabled}
              className="w-full rounded-md border !border-gray-500 bg-white px-3 py-2 text-sm text-gray-900"
              value={fit}
              onChange={(e) => onChange({ featured_image_fit: e.target.value })}
            >
              {HERO_FITS.map((f) => <option key={f} value={f}>{HERO_FIT_LABELS[f]}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-700">
              Automatic fills the banner unless that would trim a large part of the photo; then it shows the whole photo.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-800" htmlFor="hero-x">Left ↔ right: {focus.x}%</label>
            <input id="hero-x" type="range" min={0} max={100} disabled={disabled} value={focus.x}
              onChange={(e) => onChange({ featured_image_focus_x: Number(e.target.value), featured_image_focus_y: focus.y })}
              className="w-full accent-[#E8621A]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-800" htmlFor="hero-y">Top ↕ bottom: {focus.y}%</label>
            <input id="hero-y" type="range" min={0} max={100} disabled={disabled} value={focus.y}
              onChange={(e) => onChange({ featured_image_focus_x: focus.x, featured_image_focus_y: Number(e.target.value) })}
              className="w-full accent-[#E8621A]" />
          </div>
          <button
            type="button"
            disabled={disabled || focus.isDefault}
            onClick={() => onChange({ featured_image_focus_x: null, featured_image_focus_y: null })}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-400 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> {focus.isDefault ? 'Using the default (keeps the top of the photo)' : 'Reset to default'}
          </button>
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-950" data-testid="hero-warnings">
          <p className="mb-1 flex items-center gap-1.5 font-semibold"><TriangleAlert className="h-4 w-4" /> Check the previews</p>
          <ul className="list-disc space-y-0.5 pl-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      ) : sized ? (
        <p className="text-xs text-gray-700" data-testid="hero-no-warnings">No large trims at any screen size.</p>
      ) : null}
      <p className="text-xs text-gray-700">
        Warnings are based only on the photo&apos;s shape and the focus point. Nothing checks what is in the photo, so look at
        the previews before approving.
      </p>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">How it will look</p>
        <div className="flex flex-wrap items-start gap-4">
          {FRAME_NAMES.map((name) => (
            <figure key={name} style={{ width: FRAMES[name].previewWidth, maxWidth: '100%' }} data-testid={`hero-preview-${name}`}>
              <HeroImage key={src} src={src} alt={alt} settings={value} frame={name} className="rounded-md border border-gray-300" />
              <figcaption className="mt-1 text-xs text-gray-700">
                {FRAMES[name].label} · {resolveFit(value, name) === 'contain' ? 'whole photo' : 'fills banner'}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
