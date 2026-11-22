import { cn } from '@/lib/utils';

/**
 * Wide photo that melts into the navy brand background.
 * Place inside a `relative isolate overflow-hidden bg-brand-navy` container.
 * On small screens the photo fills the block under a heavier navy wash so
 * text stays readable; from md up it sits on one side with a horizontal fade.
 */
export default function PhotoBlend({
  src,
  alt = '',
  side = 'right',
  priority = false,
  className,
  imgClassName,
}: {
  src: string;
  alt?: string;
  side?: 'right' | 'left';
  priority?: boolean;
  className?: string;
  imgClassName?: string;
}) {
  const right = side === 'right';
  return (
    <div aria-hidden={alt ? undefined : true} className={cn('absolute inset-0 -z-0', right ? 'md:left-[40%]' : 'md:right-[40%]', className)}>
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        className={cn('h-full w-full object-cover', imgClassName)}
      />
      {/* mobile: full wash */}
      <div className="absolute inset-0 bg-brand-navy/80 md:hidden" />
      {/* desktop: horizontal fade into navy */}
      <div
        className={cn(
          'absolute inset-0 hidden md:block',
          right
            ? 'bg-gradient-to-r from-brand-navy from-5% via-brand-navy/60 via-40% to-transparent'
            : 'bg-gradient-to-l from-brand-navy from-5% via-brand-navy/60 via-40% to-transparent'
        )}
      />
      {/* bottom fade so the feature strip sits on navy */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-navy/90 to-transparent" />
    </div>
  );
}
