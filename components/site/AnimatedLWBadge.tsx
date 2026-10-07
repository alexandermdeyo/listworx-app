import { cn } from '@/lib/utils';

/**
 * Animated LW badge (shine sweep + sparks). Source GIF is 250×250 on black;
 * served as animated WebP (~half the GIF's weight) and clipped to a circle so
 * the black corners disappear on both light and dark backgrounds.
 * Visitors with "reduce motion" turned on get the still first frame.
 */
export default function AnimatedLWBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 overflow-hidden rounded-full bg-black ring-1 ring-black/10',
        className
      )}
    >
      <picture>
        <source srcSet="/brand/lw-animated-still.webp" media="(prefers-reduced-motion: reduce)" />
        <img
          src="/brand/lw-animated.webp"
          alt=""
          aria-hidden="true"
          width={250}
          height={250}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </picture>
    </span>
  );
}
