import { cn } from '@/lib/utils';

/**
 * A stylised waving flag used as a quiet background mark — the successor to
 * TristarMark. It's a suggestion of a flag (wavy stripe ribbons + a starred
 * canton), softened with a blur and faded at the edges so it dissolves into
 * whatever sits behind it (a photo, a flat panel).
 *
 *  - `variant="mono"` (default): stripes drawn in `currentColor`, for a faint
 *    corner watermark (control strength with a text-color / opacity class).
 *  - `variant="flag"`: subdued red / bone / navy, for layering behind hero art
 *    (control overall strength with an `opacity-*` class).
 *
 * viewBox is 0 0 96 64. The <defs> (blur filter + edge-fade mask) are identical
 * for every instance, so a shared id set is safe even with several on a page.
 */
export default function WavingFlag({
  className,
  title,
  variant = 'mono',
}: {
  className?: string;
  title?: string;
  variant?: 'mono' | 'flag';
}) {
  const uid = 'wf';
  const flag = variant === 'flag';

  const stripeH = 8;
  const amp = 3.4;
  const rows = 7;

  // one wavy horizontal ribbon starting at y
  const ribbon = (y: number, w = 96) =>
    `M0 ${y} C ${w * 0.28} ${y - amp} ${w * 0.5} ${y + amp} ${w} ${y}` +
    ` L ${w} ${y + stripeH} C ${w * 0.5} ${y + stripeH + amp} ${w * 0.28} ${y + stripeH - amp} 0 ${y + stripeH} Z`;

  const star =
    '0,-3.2 0.72,-0.99 3.04,-0.99 1.16,0.38 1.88,2.59 0,1.22 -1.88,2.59 -1.16,0.38 -3.04,-0.99 -0.72,-0.99';

  const stripeColor = (i: number) =>
    flag ? (i % 2 === 0 ? '#B5352A' : '#EDE7DD') : 'currentColor';
  const stripeOpacity = (i: number) => (flag ? 1 : i % 2 === 0 ? 0.9 : 0.35);

  return (
    <svg
      viewBox="0 0 96 64"
      className={cn('block', className)}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <filter id={`${uid}-blur`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
        <radialGradient id={`${uid}-fade`} cx="40%" cy="40%" r="78%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="62%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="88%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${uid}-mask`}>
          <rect x="0" y="0" width="96" height="64" fill={`url(#${uid}-fade)`} />
        </mask>
      </defs>

      <g
        filter={`url(#${uid}-blur)`}
        mask={`url(#${uid}-mask)`}
        transform="rotate(-4 48 32)"
      >
        {Array.from({ length: rows }).map((_, i) => (
          <path
            key={i}
            d={ribbon(4 + i * stripeH)}
            fill={stripeColor(i)}
            fillOpacity={stripeOpacity(i)}
          />
        ))}

        {/* canton — a wavy block over the first three stripes */}
        <path
          d={`M0 4 C 11 1 22 7 40 4 L 40 ${4 + stripeH * 3} C 22 ${4 + stripeH * 3 + amp} 11 ${
            4 + stripeH * 3 - amp
          } 0 ${4 + stripeH * 3} Z`}
          fill={flag ? '#243B6B' : 'currentColor'}
          fillOpacity={flag ? 1 : 0.9}
        />
        <g fill={flag ? '#EDE7DD' : 'currentColor'} fillOpacity={flag ? 0.95 : 0.55}>
          {[
            [9, 9],
            [20, 9],
            [31, 9],
            [9, 18],
            [20, 18],
            [31, 18],
          ].map(([x, y], i) => (
            <polygon key={i} points={star} transform={`translate(${x} ${y})`} />
          ))}
        </g>
      </g>
    </svg>
  );
}
