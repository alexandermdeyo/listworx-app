import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A photo with the mailer-style dark treatment (see `.lw-photo-dark` in
 * globals.css): warm near-black CSS gradient, heaviest toward the bottom-left,
 * plus a gentle desaturate. The overlay is never baked into the image file.
 *
 * Tune per placement without touching CSS:
 *   <PhotoDark src="…" srcMobile="…" objectPosition="center 45%"
 *     objectPositionMobile="center 35%" a1={0.98} angle="to top"
 *     className="aspect-[4/3]">
 *     <div className="lw-photo-dark__content …">…copy…</div>
 *   </PhotoDark>
 */
export default function PhotoDark({
  src,
  srcMobile,
  alt = '',
  className,
  children,
  angle,
  a1,
  a2,
  a3,
  floor,
  sat,
  con,
  bri,
  objectPosition,
  objectPositionMobile,
  priority = false,
  style,
}: {
  src: string;
  /** optional narrower/portrait crop used at <768px */
  srcMobile?: string;
  alt?: string;
  className?: string;
  children?: ReactNode;
  angle?: string;
  a1?: number;
  a2?: number;
  a3?: number;
  /** alpha of the full-height bottom floor (default 0.5) */
  floor?: number;
  sat?: number;
  con?: number;
  bri?: number;
  objectPosition?: string;
  objectPositionMobile?: string;
  priority?: boolean;
  style?: CSSProperties;
}) {
  const vars = {
    ...(angle ? { ['--pd-angle' as string]: angle } : {}),
    ...(a1 != null ? { ['--pd-a1' as string]: String(a1) } : {}),
    ...(a2 != null ? { ['--pd-a2' as string]: String(a2) } : {}),
    ...(a3 != null ? { ['--pd-a3' as string]: String(a3) } : {}),
    ...(floor != null ? { ['--pd-floor' as string]: String(floor) } : {}),
    ...(sat != null ? { ['--pd-sat' as string]: String(sat) } : {}),
    ...(con != null ? { ['--pd-con' as string]: String(con) } : {}),
    ...(bri != null ? { ['--pd-bri' as string]: String(bri) } : {}),
    ...(objectPosition ? { ['--pd-obj' as string]: objectPosition } : {}),
    ...(objectPositionMobile ? { ['--pd-obj-m' as string]: objectPositionMobile } : {}),
    ...style,
  } as CSSProperties;

  const img = (
    <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} />
  );

  return (
    <div className={cn('lw-photo-dark', className)} style={vars}>
      {srcMobile ? (
        <picture>
          <source media="(max-width: 767px)" srcSet={srcMobile} />
          {img}
        </picture>
      ) : (
        img
      )}
      {children}
    </div>
  );
}
