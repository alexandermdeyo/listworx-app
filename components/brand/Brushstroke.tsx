import { useId } from 'react';
import { CORNER_BRISTLES, UNDERLINE_BRISTLES, type Bristle } from './brushPaths';

/**
 * ListWorx brand brushstroke: a hand-painted, dry-brush orange stroke.
 *
 * Use it intentionally, not on every card:
 *  - "corner": upper-left of a navy hero (the signature placement)
 *  - "sidebar": top of the navy dashboard sidebar
 *  - "underline": a short swash under one key headline
 *
 * Pure SVG (no image request), decorative only.
 */

type Variant = 'corner' | 'underline' | 'sidebar';

interface BrushstrokeProps {
  variant?: Variant;
  className?: string;
}

const ORANGE = '#F26A21';

function Strokes({ bristles, filterId }: { bristles: Bristle[]; filterId: string }) {
  return (
    <g filter={`url(#${filterId})`} fill="none" stroke={ORANGE} strokeLinecap="round">
      {bristles.map(([d, w, o], i) => (
        <path key={i} d={d} strokeWidth={w} opacity={o} />
      ))}
    </g>
  );
}

function RoughFilter({ id, scale }: { id: string; scale: number }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
      <feDisplacementMap in="SourceGraphic" scale={scale} />
    </filter>
  );
}

export default function Brushstroke({ variant = 'corner', className = '' }: BrushstrokeProps) {
  const fid = `br-rough-${useId().replace(/:/g, '')}`;

  if (variant === 'underline') {
    return (
      <svg aria-hidden="true" viewBox="0 0 300 18" preserveAspectRatio="none" className={className}>
        <defs>
          <RoughFilter id={fid} scale={2} />
        </defs>
        <Strokes bristles={UNDERLINE_BRISTLES} filterId={fid} />
      </svg>
    );
  }

  if (variant === 'sidebar') {
    return (
      <svg aria-hidden="true" viewBox="0 0 240 600" preserveAspectRatio="xMidYMid slice" className={className}>
        <defs>
          <RoughFilter id={fid} scale={5} />
        </defs>
        <g transform="translate(-60 -40) scale(0.85)">
          <Strokes bristles={CORNER_BRISTLES} filterId={fid} />
        </g>

      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 420 260" className={className}>
      <defs>
        <RoughFilter id={fid} scale={5} />
      </defs>
      <Strokes bristles={CORNER_BRISTLES} filterId={fid} />
    </svg>
  );
}
