import { useId } from 'react';
import { BAND_MARK, CORNER_MARK, UNDERLINE_BRISTLES, type Mark } from './brushPaths';

/**
 * ListWorx brand paint mark.
 *
 * Use it intentionally, not on every card:
 *  - "corner": solid orange wedge with a dry-brush edge, pinned to the
 *    upper-left of a navy hero (the signature placement from the mockup)
 *  - "sidebar": dry-brush diagonal band across the top of the navy sidebar
 *  - "underline": a short swash under one key headline
 *
 * Pure SVG (no image request), decorative only. The bristle gaps are painted
 * in navy, so place "corner" and "sidebar" on a brand-navy background.
 */

type Variant = 'corner' | 'underline' | 'sidebar';

const ORANGE = '#F26A21';
const NAVY = '#0F2342';

function MarkPaths({ mark, gapColor }: { mark: Mark; gapColor: string }) {
  return (
    <>
      <path d={mark.solid} fill={ORANGE} />
      <path d={mark.gaps} fill={gapColor} />
      <path d={mark.fringe} fill={ORANGE} />
    </>
  );
}

export default function Brushstroke({
  variant = 'corner',
  className = '',
  gapColor = NAVY,
}: {
  variant?: Variant;
  className?: string;
  gapColor?: string;
}) {
  const fid = `br-rough-${useId().replace(/:/g, '')}`;

  if (variant === 'underline') {
    return (
      <svg aria-hidden="true" viewBox="0 0 300 18" preserveAspectRatio="none" className={className}>
        <defs>
          <filter id={fid} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale={2} />
          </filter>
        </defs>
        <g filter={`url(#${fid})`} fill="none" stroke={ORANGE} strokeLinecap="round">
          {UNDERLINE_BRISTLES.map(([d, w, o], i) => (
            <path key={i} d={d} strokeWidth={w} opacity={o} />
          ))}
        </g>
      </svg>
    );
  }

  if (variant === 'sidebar') {
    return (
      <svg aria-hidden="true" viewBox="0 0 240 120" preserveAspectRatio="none" className={className}>
        <MarkPaths mark={BAND_MARK} gapColor={gapColor} />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 230 220" className={className}>
      <MarkPaths mark={CORNER_MARK} gapColor={gapColor} />
    </svg>
  );
}
