import { cn } from '@/lib/utils';

/**
 * The Tennessee tri-star — three five-point stars set in a circle, the same
 * mark used on the printed ListWorx mailer kit.
 *
 *  - `variant="mono"` (default): drawn with `currentColor`, for a quiet corner
 *    watermark (tint it down with opacity / a muted colour).
 *  - `variant="flag"`: the state-flag palette — navy disc, white fimbriation,
 *    red field ring, white stars. Meant to be layered behind hero content at
 *    reduced opacity, so control that with an `opacity-*` class.
 *
 * viewBox is 0 0 64 64. Star geometry matches the state-flag arrangement:
 * a tight triangular cluster, each star rotated so the points fan outward.
 */
export default function TristarMark({
  className,
  title,
  variant = 'mono',
}: {
  className?: string;
  title?: string;
  variant?: 'mono' | 'flag';
}) {
  const star =
    '0,-10 2.245,-3.09 9.511,-3.09 3.633,1.18 5.878,8.09 0,3.82 -5.878,8.09 -3.633,1.18 -9.511,-3.09 -2.245,-3.09';

  const cluster = (
    <>
      <polygon points={star} transform="translate(32 21) scale(0.82) rotate(-8)" />
      <polygon points={star} transform="translate(23.5 41) scale(0.82) rotate(-30)" />
      <polygon points={star} transform="translate(40.5 41) scale(0.82) rotate(22)" />
    </>
  );

  if (variant === 'flag') {
    return (
      <svg
        viewBox="0 0 64 64"
        className={cn('block', className)}
        xmlns="http://www.w3.org/2000/svg"
        role={title ? 'img' : 'presentation'}
        aria-hidden={title ? undefined : true}
      >
        {title ? <title>{title}</title> : null}
        <circle cx="32" cy="32" r="30" fill="#C8102E" />
        <circle cx="32" cy="32" r="27" fill="#FFFFFF" />
        <circle cx="32" cy="32" r="24" fill="#0A2A66" />
        <g fill="#FFFFFF">{cluster}</g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('block', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2.5" />
      <g fill="currentColor">{cluster}</g>
    </svg>
  );
}
