import { cn } from '@/lib/utils';

/**
 * Animated chrome-and-orange ListWorx logo (shine sweep, then a ~4s hold so it
 * reads as a polished glint rather than constant motion). Transparent, so it
 * sits on light and dark backgrounds alike.
 *
 *   wordmark — LISTWORX only; for small placements like the nav bar where the
 *              tagline would be unreadable.
 *   full     — LISTWORX + "IronClad Contractors • Trusted by Realtors • Chosen
 *              by Homeowners"; for big hero moments.
 *
 * Visitors with "reduce motion" turned on get the still final frame.
 */
const SOURCES = {
  wordmark: {
    animated: '/brand/listworx-wordmark-animated.webp',
    still: '/brand/listworx-wordmark-animated-still.webp',
    width: 560,
    height: 81,
  },
  full: {
    animated: '/brand/listworx-logo-animated.webp',
    still: '/brand/listworx-logo-animated-still.webp',
    width: 1100,
    height: 202,
  },
} as const;

export default function AnimatedListWorxLogo({
  variant = 'wordmark',
  className,
  priority = false,
}: {
  variant?: keyof typeof SOURCES;
  className?: string;
  priority?: boolean;
}) {
  const src = SOURCES[variant];
  return (
    <picture>
      <source srcSet={src.still} media="(prefers-reduced-motion: reduce)" />
      <img
        src={src.animated}
        alt="ListWorx"
        width={src.width}
        height={src.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('w-auto select-none', className)}
        draggable={false}
      />
    </picture>
  );
}
