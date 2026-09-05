import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RevealBadge } from '@/components/motion';

type BadgeVariant = 'standards' | 'partner' | 'founder';

const SOURCES: Record<BadgeVariant, { src: string; alt: string; darkOnly?: boolean }> = {
  // Primary recurring trust mark — clean transparent shield.
  standards: { src: '/Ironclad_Standards_Logo.png', alt: 'IronClad Standards' },
  // Contractor-facing certification seal — transparent.
  partner: { src: '/Ironclad_Cert_Partner_Final_Logo.png', alt: 'IronClad Certified Partner' },
  // Founding-partner seal — has a baked dark background, use on black only.
  founder: { src: '/ironclad_founder_shield_logo.png', alt: 'IronClad Certified — Founding Partner', darkOnly: true },
};

/**
 * The IronClad badge, used as a recurring trust element across the site.
 * Kept as the original red/chrome art on purpose — it reads as a distinct
 * certification seal rather than part of the orange system.
 *
 *   <IroncladBadge variant="standards" className="h-24" href="/ironclad" />
 */
export default function IroncladBadge({
  variant = 'standards',
  className,
  href,
  reveal = false,
  hover = true,
  priority = false,
}: {
  variant?: BadgeVariant;
  /** sizing utilities — set a height, width stays auto (e.g. "h-20 md:h-28") */
  className?: string;
  /** wrap in a link (usually "/ironclad") */
  href?: string;
  /** one-time clip-path assemble wipe when it scrolls into view */
  reveal?: boolean;
  /** subtle lift + warm halo on hover */
  hover?: boolean;
  priority?: boolean;
}) {
  const { src, alt } = SOURCES[variant];

  const img = (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className={cn('w-auto select-none', hover && 'lw-badge-hover', className)}
      draggable={false}
    />
  );

  const wrapped = reveal ? <RevealBadge>{img}</RevealBadge> : img;

  if (href) {
    return (
      <Link href={href} aria-label={alt} className="inline-flex shrink-0">
        {wrapped}
      </Link>
    );
  }
  return <span className="inline-flex shrink-0">{wrapped}</span>;
}
