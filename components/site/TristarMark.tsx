import { cn } from '@/lib/utils';

/**
 * The Tennessee tri-star — three five-point stars set in a circle, the same
 * mark used on the printed ListWorx mailer kit. Drawn inline so it inherits
 * `currentColor`; intended as a quiet corner watermark (tint it down with
 * opacity / a muted colour), not a loud graphic.
 *
 * viewBox is 0 0 64 64. Star geometry matches the state-flag arrangement:
 * a tight triangular cluster, each star rotated so the points fan outward.
 */
export default function TristarMark({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  const star = '0,-10 2.245,-3.09 9.511,-3.09 3.633,1.18 5.878,8.09 0,3.82 -5.878,8.09 -3.633,1.18 -9.511,-3.09 -2.245,-3.09';
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
      <g fill="currentColor">
        <polygon points={star} transform="translate(32 21) scale(0.82) rotate(-8)" />
        <polygon points={star} transform="translate(23.5 41) scale(0.82) rotate(-30)" />
        <polygon points={star} transform="translate(40.5 41) scale(0.82) rotate(22)" />
      </g>
    </svg>
  );
}
