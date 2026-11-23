import { cn } from '@/lib/utils';

export type StripPhoto = { src: string; alt: string; caption?: string; position?: string };

/**
 * A row of captioned photos (2-4). Use between text sections to add real
 * imagery that matches what the section is about.
 */
export default function PhotoStrip({ photos, className, tall = false }: { photos: StripPhoto[]; className?: string; tall?: boolean }) {
  const cols = photos.length >= 4 ? 'md:grid-cols-4' : photos.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';
  return (
    <div className={cn('grid grid-cols-2 gap-3 md:gap-4', cols, className)}>
      {photos.map((p) => (
        <figure key={p.src + (p.caption || '')} className="group relative overflow-hidden rounded-2xl bg-brand-navy shadow-[0_14px_34px_-22px_rgba(15,35,66,0.6)]">
          <img
            src={p.src}
            alt={p.alt}
            loading="lazy"
            className={cn('w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]', tall ? 'aspect-[4/5]' : 'aspect-[4/3]')}
            style={p.position ? { objectPosition: p.position } : undefined}
          />
          {p.caption && (
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/50 to-transparent px-3 pb-2.5 pt-8 text-sm font-semibold text-white">
              {p.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
