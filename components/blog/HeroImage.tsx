'use client';

import { useEffect, useRef, useState } from 'react';
import { FRAMES, objectPosition, resolveFit, type FrameName, type HeroSettings } from '@/lib/content/hero-image';

/**
 * Article hero photo. Used by the public article page (frame="responsive") and by
 * the editor previews (frame="desktop" | "tablet" | "mobile") so both render the
 * same way: same frame shapes, same object-position, same whole-photo treatment.
 *
 * Responsive frame shapes: 16:9 on phones and tablets, 2:1 from 1024px wide.
 * Keep in step with FRAMES in lib/content/hero-image.ts.
 */
export default function HeroImage({
  src, alt, settings, frame = 'responsive', className = '', priority = false,
}: {
  src: string;
  alt: string;
  settings: HeroSettings;
  frame?: 'responsive' | FrameName;
  className?: string;
  priority?: boolean;
}) {
  // When the saved settings don't include the photo's size, measure it once loaded
  // so "automatic" can switch to the whole-photo view for unusual shapes.
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null);
  const effective: HeroSettings =
    settings.featured_image_width && settings.featured_image_height
      ? settings
      : { ...settings, featured_image_width: measured?.w ?? null, featured_image_height: measured?.h ?? null };

  const onLoad = (img: HTMLImageElement) => {
    if (!settings.featured_image_width && img.naturalWidth && img.naturalHeight) {
      setMeasured({ w: img.naturalWidth, h: img.naturalHeight });
    }
  };

  const position = objectPosition(effective);

  if (frame !== 'responsive') {
    const mode = resolveFit(effective, frame);
    return (
      <Frame
        src={src} alt={alt} mode={mode} position={position} onLoad={onLoad} priority={priority}
        className={className} style={{ aspectRatio: String(FRAMES[frame].ratio) }}
      />
    );
  }

  // Public page: phones/tablets use the 16:9 frame, desktops the 2:1 frame.
  const small = resolveFit(effective, 'mobile');
  const large = resolveFit(effective, 'desktop');
  if (small === large) {
    return (
      <Frame
        src={src} alt={alt} mode={large} position={position} onLoad={onLoad} priority={priority}
        className={`aspect-[16/9] lg:aspect-[2/1] ${className}`}
      />
    );
  }
  return (
    <>
      <Frame src={src} alt={alt} mode={small} position={position} onLoad={onLoad} priority={priority} className={`aspect-[16/9] lg:hidden ${className}`} />
      <Frame src={src} alt={alt} mode={large} position={position} onLoad={onLoad} priority={priority} className={`hidden lg:block aspect-[2/1] ${className}`} />
    </>
  );
}

function Frame({
  src, alt, mode, position, onLoad, priority, className, style,
}: {
  src: string; alt: string; mode: 'cover' | 'contain'; position: string;
  onLoad: (img: HTMLImageElement) => void; priority: boolean;
  className: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLImageElement>(null);
  // A server-rendered photo can finish loading before React attaches onLoad.
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) onLoad(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);
  return (
    <div className={`relative w-full overflow-hidden bg-zinc-100 ${className}`} style={style} data-hero-mode={mode}>
      {mode === 'contain' && (
        // Soft backdrop made from the same photo, so the uncropped photo doesn't sit in empty bars.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        ref={ref}
        onLoad={(e) => onLoad(e.currentTarget)}
        loading={priority ? 'eager' : 'lazy'}
        className={`relative h-full w-full ${mode === 'contain' ? 'object-contain' : 'object-cover'}`}
        style={mode === 'cover' ? { objectPosition: position } : undefined}
      />
    </div>
  );
}
