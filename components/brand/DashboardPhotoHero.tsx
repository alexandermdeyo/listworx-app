import Brushstroke from './Brushstroke';
import HeroPhoto from './HeroPhoto';

/**
 * Compact navy photo banner for the top of a dashboard page (display only).
 * Place inside the page's padded content wrapper; it bleeds to the edges with
 * negative margins that match `p-6`.
 */
export default function DashboardPhotoHero({
  eyebrow,
  title,
  body,
  photo,
  position = 'center',
}: {
  eyebrow: string;
  title: string;
  body?: string;
  photo: string;
  position?: string;
}) {
  return (
    <section className="relative isolate -mx-6 -mt-6 mb-6 overflow-hidden bg-brand-navy text-white">
      <HeroPhoto src={photo} position={position} className="md:left-[40%]" />
      <Brushstroke variant="corner" className="pointer-events-none absolute left-0 top-0 z-10 w-[90px] md:w-[130px]" />
      <div className="relative px-6 py-7 md:px-8 md:py-9">
        <p className="text-sm font-semibold text-white/85">{eyebrow}</p>
        <h2 className="br-display mt-1 text-3xl leading-[1.05] md:text-[40px]">{title}</h2>
        <Brushstroke variant="underline" className="mt-2 h-2.5 w-48" />
        {body && <p className="mt-3 max-w-xl text-base text-white/90">{body}</p>}
      </div>
    </section>
  );
}
