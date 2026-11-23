import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  Camera,
  CircleCheck,
  Search,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import Brushstroke from './Brushstroke';
import { BRAND_PHOTOS } from '@/lib/brand/photos';

/**
 * Homepage top, laid out to match the approved mockup
 * (ListWorx_Contractor_Network_Homepage.png):
 *   navy hero with corner paint mark + blended photo + 5-item feature strip,
 *   three pathway cards, featured manual banner.
 * Wide wrapper (max 1600px) like the mockup, not the narrower site container.
 */

export const WIDE = 'mx-auto w-full max-w-[1600px] px-4 md:px-6';

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const features = [
  { icon: ShieldCheck, label: 'Vetted & Reliable Contractors', href: '/ironclad' },
  { icon: BookOpen, label: 'Business Training & Manuals', soon: true },
  { icon: Calculator, label: 'Calculators, Checklists & Forms', soon: true },
  { icon: Camera, label: 'Professional Media & Marketing Support', href: '/media-services' },
  { icon: TrendingUp, label: 'Real Strategies for Growth & Profitability', href: '/learning-center' },
] as const;

export function BrandHomeHero() {
  return (
    <section className="br-body relative isolate overflow-hidden bg-brand-navy text-white">
      {/* photo: full-bleed on mobile, right ~65% on desktop, fading into navy */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 md:left-[33%]">
        <picture>
          <source media="(max-width: 767px)" srcSet={BRAND_PHOTOS.homeHeroMobile.src} />
          <img
            src={BRAND_PHOTOS.homeHero.src}
            alt=""
            fetchPriority="high"
            className="h-full w-full object-cover object-[60%_30%]"
          />
        </picture>
        <div className="absolute inset-0 bg-brand-navy/[0.82] md:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-brand-navy from-[2%] via-brand-navy/70 via-[30%] to-brand-navy/0 to-[62%] md:block" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-navy/95 via-brand-navy/60 to-transparent" />
      </div>

      <Brushstroke variant="corner" className="pointer-events-none absolute left-0 top-0 z-10 w-[120px] md:w-[200px]" />

      <div className={`relative z-20 ${WIDE}`}>
        <div className="max-w-[760px] pt-6 md:pl-[3.5%] md:pt-8">
          <h1 className="br-display text-[34px] leading-[1.0] md:text-[52px]">
            A Stronger Business
            <span className="block">for Contractors.</span>
            <span className="block">Trusted Pros for Homeowners.</span>
          </h1>
          <Brushstroke variant="underline" className="mt-2 h-2.5 w-40 md:h-3 md:w-64" />
          <p className="mt-3 max-w-[600px] text-[18px] leading-[1.22] text-white md:text-[20px]">
            The contractor network that connects homeowners, realtors, and property managers with
            vetted, reliable pros, and gives contractors the tools, training, and resources to grow a
            more profitable business.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/request" className="br-btn-primary !px-6 text-lg">
              <Search className="h-5 w-5" /> Find a Contractor <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/contractors" className="br-btn-outline-light !px-6 text-lg">
              <BarChart3 className="h-5 w-5" /> Grow Your Business <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <ul className="mt-5 grid grid-cols-1 gap-y-3 border-t border-white/20 py-4 sm:grid-cols-2 md:mt-6 lg:grid-cols-5 lg:divide-x lg:divide-white/30 lg:border-t-0 lg:pb-5 lg:pt-1">
          {features.map((f) => {
            const Icon = f.icon;
            const body = (
              <span className="flex items-center gap-3">
                <Icon className="h-10 w-10 shrink-0 text-brand-orange md:h-11 md:w-11" strokeWidth={1.7} />
                <span className="text-[16px] font-semibold leading-tight md:text-[18px]">
                  {f.label}
                  {'soon' in f && f.soon && <span className="br-soon-light ml-2 align-middle">Coming Soon</span>}
                </span>
              </span>
            );
            return (
              <li key={f.label} className="flex items-center lg:justify-center lg:px-4 lg:first:justify-start lg:first:pl-[2%]">
                {'href' in f && f.href ? (
                  <Link href={f.href} className="hover:text-brand-orange">{body}</Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pathway cards                                                       */
/* ------------------------------------------------------------------ */

export function BrandPathways() {
  return (
    <section className="br-body bg-brand-mist py-4 md:py-5">
      <div className={`grid gap-4 lg:grid-cols-3 ${WIDE}`}>
        <PathCard
          img={BRAND_PHOTOS.pathHomeowners.src}
          imgAlt={BRAND_PHOTOS.pathHomeowners.alt}
          title="Homeowners, Realtors & Property Managers"
          body="Find trusted, vetted contractors for your next project. Always free."
          cta="Find a Contractor"
          href="/request"
        />
        <PathCard
          img={BRAND_PHOTOS.pathContractors.src}
          imgAlt={BRAND_PHOTOS.pathContractors.alt}
          imgPos="object-[22%_center]"
          title="Contractors"
          body="Get referrals, business tools, training, and marketing support to grow and run a more profitable business."
          cta="Join the Network"
          href="/apply"
        />
        <div className="br-card group flex min-h-[210px] flex-col overflow-hidden sm:flex-row">
          <div className="relative h-44 w-full shrink-0 overflow-hidden bg-brand-navy sm:h-auto sm:w-[48%]">
            {BRAND_PHOTOS.pathManualLibrary ? (
              <img
                src={BRAND_PHOTOS.pathManualLibrary.src}
                alt={BRAND_PHOTOS.pathManualLibrary.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-[48%_center] transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <Brushstroke variant="corner" className="absolute left-0 top-0 w-[110px]" />
            )}
          </div>
          <div className="flex flex-1 flex-col px-4 py-4 md:px-5">
            <h3 className="br-display text-[25px] leading-[1.0] text-brand-ink xl:text-[28px]">Manual Library &amp; Business Tools</h3>
            <p className="mt-2 flex-1 text-[16px] leading-snug text-brand-ink/85">
              In-depth manuals, calculators, worksheets, and jobsite tools built for real contractors.
            </p>
            <span className="br-soon mt-2 self-start">Coming Soon</span>
            <Link href="#newsletter" className="br-btn-outline mt-3 self-start">
              Get Notified <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PathCard({
  img,
  imgAlt,
  imgPos = 'object-center',
  title,
  body,
  cta,
  href,
}: {
  img: string;
  imgAlt: string;
  imgPos?: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="br-card group flex min-h-[210px] flex-col overflow-hidden sm:flex-row">
      <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-[48%]">
        <img
          src={img}
          alt={imgAlt}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${imgPos}`}
        />
      </div>
      <div className="flex flex-1 flex-col px-4 py-4 md:px-5">
        <h3 className="br-display text-[25px] leading-[1.0] text-brand-ink xl:text-[28px]">{title}</h3>
        <p className="mt-2 flex-1 text-[16px] leading-snug text-brand-ink/85">{body}</p>
        <Link href={href} className="br-btn-outline mt-3 self-start">
          {cta} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Featured manual (Coming Soon, not purchasable)                      */
/* ------------------------------------------------------------------ */

const planned = [
  'Real numbers and worked examples',
  'Current costs, rates, and industry data',
  'AI tools and practical applications',
  'Checklists, calculators, and worksheets',
  '20+ in-depth chapters planned',
];

export function BrandFeaturedManual() {
  const scene = BRAND_PHOTOS.featuredManualScene;
  return (
    <section className="br-body relative isolate overflow-hidden border-b border-brand-line bg-gradient-to-r from-[#EEF1F5] via-white to-white">
      {scene && (
        <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden w-[30%] xl:block">
          <img src={scene.src} alt="" loading="lazy" className="h-full w-full object-cover object-[40%_30%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
        </div>
      )}
      <div className={`grid items-center gap-6 py-6 md:py-7 lg:grid-cols-[auto_minmax(440px,1fr)_auto] lg:gap-8 xl:pr-[24%] ${WIDE}`}>
        {BRAND_PHOTOS.featuredManualCover ? (
          <img
            src={BRAND_PHOTOS.featuredManualCover.src}
            alt={BRAND_PHOTOS.featuredManualCover.alt}
            loading="lazy"
            className="mx-auto w-48 rounded-xl object-cover shadow-[16px_20px_34px_-18px_rgba(15,35,66,0.6)] md:w-52 lg:ml-[4%]"
          />
        ) : (
          <div className="relative mx-auto aspect-[3/4] w-36 overflow-hidden rounded-r-lg rounded-l-sm bg-brand-navy md:w-44 lg:ml-[10%]">
            <Brushstroke variant="corner" className="absolute left-0 top-0 w-[110px]" />
          </div>
        )}
        <div className="lg:border-r lg:border-brand-line lg:pr-10">
          <span className="br-eyebrow">Featured Manual · Coming Soon</span>
          <h2 className="br-display mt-2 text-4xl leading-[0.98] text-brand-ink md:text-[50px]">
            The Contractor
            <span className="block whitespace-nowrap">Business Playbook</span>
          </h2>
          <p className="mt-2 max-w-md text-[18px] leading-snug text-brand-ink/85">
            A complete guide to starting, running, and growing a profitable contracting business. Being
            written now; not available to buy yet.
          </p>
          <Link href="#newsletter" className="br-btn-primary mt-4 !px-7 text-lg">
            Get Notified <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <ul className="space-y-2.5">
          {planned.map((p) => (
            <li key={p} className="flex items-center gap-3 text-[18px] text-brand-ink xl:whitespace-nowrap">
              <CircleCheck className="h-6 w-6 shrink-0 text-brand-orange" strokeWidth={2.6} />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
