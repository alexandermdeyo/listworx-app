import Link from 'next/link';
import { Lock } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { pageMetadata } from '@/lib/seo';
import { LEARNING_RESOURCES } from '@/lib/learning/resources';
import HeroPhoto from '@/components/brand/HeroPhoto';
import { LIB } from '@/lib/brand/photos';
import Brushstroke from '@/components/brand/Brushstroke';
import IroncladBadge from '@/components/site/IroncladBadge';

export const metadata = pageMetadata({
  title: 'ListWorx Learning Center: Guides for Homeowners, Contractors, and Realtors',
  description: 'Practical guides on hiring contractors, IronClad Standards, pre-listing repairs, and growing a contracting business.',
  path: '/learning-center',
});

const CATEGORY_PHOTO: Record<string, { src: string; alt: string; pos: string }> = {
  'Hiring guide': { src: '/images/library/handyman-tablet-consultation.webp', alt: 'A contractor walking a homeowner through an estimate on a tablet', pos: '50% 18%' },
  'IronClad Standards': { src: '/images/library/home-exterior-curb-appeal.webp', alt: 'A well-kept home with fresh landscaping', pos: '50% 45%' },
  'Realtor resource': { src: '/images/library/realtor-contractor-water-heater.webp', alt: 'A realtor and a contractor checking a water heater before listing', pos: '50% 15%' },
  'Business manual': { src: '/images/brand/playbook-cover-scene.webp', alt: 'The ListWorx Contractor Business Playbook', pos: '45% 35%' },
  'Marketing and photography': { src: '/images/library/media-camera-jobsite.webp', alt: 'A contractor photographing finished work on the jobsite', pos: '50% 40%' },
  Templates: { src: '/images/library/plans-calculator-desk.webp', alt: 'Plans, a calculator and a pencil on a desk', pos: '50% 40%' },
};

export default function LearningCenterPage() {
  // Only summaries are rendered here; member-only content is served by /api/learning/[slug].
  const items = LEARNING_RESOURCES.map(({ slug, title, audience, category, access, summary }) => ({ slug, title, audience, category, access, summary }));
  return (
    <div className="min-h-screen bg-mailer-black pb-20 text-white">
      <Navigation />
      <section className="relative isolate overflow-hidden bg-brand-navy">
        <HeroPhoto src={LIB.playbookScene.src} position="42% 45%" className="md:left-[48%]" />
        <Brushstroke variant="corner" className="pointer-events-none absolute left-0 top-0 z-10 w-[110px] md:w-[180px]" />
        <div className="container relative mx-auto max-w-5xl px-4 py-12 md:py-16">
          <p className="lw-label mb-2">ListWorx Learning Center</p>
          <h1 className="max-w-md text-4xl font-bold md:text-5xl">Practical guides that actually help.</h1>
          <p className="mt-4 max-w-md text-lg text-white/85">
            A growing starter library for homeowners, realtors, and contractors. Member resources are included with Growth and Business Pro.
          </p>
        </div>
      </section>
      <div className="container mx-auto max-w-5xl px-4 pt-10">
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((r) => (
            <Link key={r.slug} href={`/learning-center/${r.slug}`} className="group overflow-hidden rounded-2xl border border-mailer-border bg-mailer-card transition hover:border-lw-rust">
              <div className="relative h-52 overflow-hidden bg-brand-navy">
                {r.category === 'IronClad Standards' ? (
                  <>
                    <img src={CATEGORY_PHOTO[r.category].src} alt={CATEGORY_PHOTO[r.category].alt} loading="lazy" className="h-full w-full object-cover opacity-60" style={{ objectPosition: CATEGORY_PHOTO[r.category].pos }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <IroncladBadge variant="standards" hover={false} className="h-32 drop-shadow-xl" />
                    </div>
                  </>
                ) : (
                  <img src={CATEGORY_PHOTO[r.category].src} alt={CATEGORY_PHOTO[r.category].alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={{ objectPosition: CATEGORY_PHOTO[r.category].pos }} />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-mailer-card via-mailer-card/60 to-transparent" />
              </div>
              <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">{r.category} · {r.audience}</p>
              <h2 className="mt-2 text-lg font-bold">{r.title}</h2>
              <p className="mt-2 text-sm text-white/60">{r.summary}</p>
              {r.access === 'growth' && (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-lw-rust/15 px-3 py-1 text-xs font-semibold text-lw-rust">
                  <Lock className="h-3 w-3" /> Growth and Business Pro
                </p>
              )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
