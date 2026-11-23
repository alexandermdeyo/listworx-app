import { cn } from '@/lib/utils';

/**
 * Background photo for an existing dark page-top section. Put it as the first
 * child of a section that has `relative isolate overflow-hidden` and a navy
 * background. The photo sits on the right and fades into navy (desktop), or
 * fills behind a navy wash (mobile), so white text stays readable.
 */
export default function HeroPhoto({
  src,
  position = 'center',
  className,
  strength = 'normal',
}: {
  src: string;
  /** CSS object-position for the crop, e.g. "60% 30%" */
  position?: string;
  className?: string;
  /** 'strong' = heavier navy wash for busy photos or centered text */
  strength?: 'normal' | 'strong';
}) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 -z-10 md:left-[36%]', className)}>
      <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: position }} />
      <div className="absolute inset-0 bg-brand-navy/[0.82] md:hidden" />
      <div
        className={cn(
          'absolute inset-0 hidden bg-gradient-to-r md:block',
          strength === 'strong'
            ? 'from-brand-navy from-[8%] via-brand-navy/80 via-[45%] to-brand-navy/30'
            : 'from-brand-navy from-[2%] via-brand-navy/70 via-[30%] to-brand-navy/0 to-[65%]'
        )}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-navy/80 to-transparent" />
    </div>
  );
}
