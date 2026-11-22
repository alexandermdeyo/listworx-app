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
} from 'lucide-react';
import Brushstroke from './Brushstroke';
import PhotoBlend from './PhotoBlend';

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const features = [
  { icon: ShieldCheck, label: 'Vetted & Reliable Contractors', href: '/ironclad' },
  { icon: BookOpen, label: 'Business Training & Manuals', soon: true },
  { icon: Calculator, label: 'Calculators, Checklists & Forms', soon: true },
  { icon: Camera, label: 'Professional Media & Marketing Support', href: '/media-services' },
  { icon: BarChart3, label: 'Real Strategies for Growth & Profitability', href: '/learning-center' },
] as const;

export function BrandHomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-navy text-white">
      <PhotoBlend
        src="/images/redesign/contractor_roofers-team-hero.webp"
        alt=""
        side="right"
        priority
        className="md:left-[38%]"
        imgClassName="object-[60%_35%]"
      />
      <Brushstroke variant="corner" className="pointer-events-none absolute -left-6 -top-4 z-10 w-[260px] md:-left-8 md:-top-6 md:w-[420px]" />

      <div className="relative z-20 container mx-auto px-4 pb-10 pt-16 md:pb-12 md:pt-24">
        <div className="max-w-[640px]">
          <h1 className="br-display text-[31px] leading-[1.06] md:text-[56px]">
            A Stronger Business for Contractors.
            <span className="block">Trusted Pros for Homeowners.</span>
          </h1>
          <Brushstroke variant="underline" className="mt-3 h-3 w-48 md:h-4 md:w-72" />
          <p className="mt-5 text-lg leading-relaxed text-white/90 md:text-xl">
            The contractor network that connects homeowners, realtors, and property managers with
            vetted, reliable pros, and gives contractors the tools, training, and resources to grow a
            more profitable business.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="#request" className="br-btn-primary text-lg">
              <Search className="h-5 w-5" /> Find a Contractor <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/contractors" className="br-btn-outline-light text-lg">
              <BarChart3 className="h-5 w-5" /> Grow Your Business <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-y-4 border-t border-white/[0.15] pt-6 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-white/20 lg:border-t-0 lg:pt-0">
          {features.map((f) => {
            const Icon = f.icon;
            const body = (
              <span className="flex items-center gap-3">
                <Icon className="h-9 w-9 shrink-0 text-brand-orange" strokeWidth={1.75} />
                <span className="text-[15px] font-semibold leading-snug">
                  {f.label}
                  {'soon' in f && f.soon && <span className="br-soon-light ml-2 align-middle">Coming Soon</span>}
                </span>
              </span>
            );
            return (
              <li key={f.label} className="lg:px-5 lg:first:pl-0">
                {'href' in f && f.href ? (
                  <Link href={f.href} className="block hover:text-brand-orange">{body}</Link>
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
    <section className="bg-brand-mist py-10 md:py-14">
      <div className="container mx-auto grid gap-5 px-4 lg:grid-cols-3">
        <PathCard
          img="/images/redesign/realtor_couple-consultation-laptop.webp"
          imgAlt="A homeowner couple reviewing contractor options with their realtor"
          title="Homeowners, Realtors & Property Managers"
          body="Find trusted, vetted contractors for your next project. Free, with no account needed to get matched."
          cta="Find a Contractor"
          href="#request"
        />
        <PathCard
          img="/images/redesign/contractor_hvac-crop.webp"
          imgAlt="An HVAC technician servicing an outdoor unit"
          title="Contractors"
          body="Get referrals, marketing support, and business tools to grow and run a more profitable business. Free to join."
          cta="Join the Network"
          href="/apply"
        />
        <div className="br-card flex flex-col overflow-hidden sm:flex-row">
          <div className="relative h-32 w-full shrink-0 overflow-hidden bg-brand-navy sm:h-auto sm:w-[42%]">
            <Brushstroke variant="corner" className="absolute -left-10 -top-4 w-[240px] opacity-90" />
            <BookOpen className="absolute bottom-4 left-1/2 sm:bottom-6 h-16 w-16 -translate-x-1/2 text-white/90" strokeWidth={1.4} />
          </div>
          <div className="flex flex-1 flex-col p-6">
            <span className="br-soon mb-2 self-start">Coming Soon</span>
            <h3 className="br-display text-xl leading-tight text-brand-ink xl:text-2xl">Manual Library &amp; Business Tools</h3>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-brand-ink/75">
              In-depth manuals, calculators, worksheets, and jobsite tools built for real contractors.
              In development now.
            </p>
            <Link href="#newsletter" className="br-btn-outline mt-5 self-start">
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
  title,
  body,
  cta,
  href,
}: {
  img: string;
  imgAlt: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="br-card group flex flex-col overflow-hidden sm:flex-row">
      <div className="relative h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-[42%]">
        <img src={img} alt={imgAlt} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="br-display text-xl leading-tight text-brand-ink xl:text-2xl">{title}</h3>
        <p className="mt-2 flex-1 text-[15px] leading-relaxed text-brand-ink/75">{body}</p>
        <Link href={href} className="br-btn-outline mt-5 self-start">
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
  'Current costs, rates, and industry data, with sources',
  'Practical AI tools and workflows',
  'Companion calculators and worksheets',
];

export function BrandFeaturedManual() {
  return (
    <section className="border-y border-brand-line bg-white">
      <div className="container mx-auto grid items-center gap-10 px-4 py-14 md:py-16 lg:grid-cols-[0.8fr_1.2fr_1fr]">
        <div className="relative mx-auto aspect-[3/4] w-48 overflow-hidden rounded-r-lg rounded-l-sm bg-brand-navy shadow-[18px_24px_40px_-20px_rgba(15,35,66,0.7)] md:w-56">
          <Brushstroke variant="corner" className="absolute -left-12 -top-6 w-[260px]" />
          <div className="absolute inset-x-5 bottom-6">
            <img src="/brand/listworx-wordmark-dark.png" alt="ListWorx" className="mb-3 h-4 w-auto" />
            <p className="br-display text-xl leading-tight text-white">The Contractor Business Playbook</p>
          </div>
        </div>
        <div>
          <span className="br-eyebrow">Featured Manual · Coming Soon</span>
          <h2 className="br-display mt-3 text-3xl leading-[1.05] text-brand-ink md:text-5xl">
            The Contractor Business Playbook
          </h2>
          <p className="mt-3 text-lg text-brand-ink/75">
            A complete guide to starting, running, and growing a profitable contracting business. It is
            being written now and is not available to buy yet.
          </p>
          <Link href="#newsletter" className="br-btn-primary mt-6">
            Get Notified at Launch <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <ul className="space-y-3 border-brand-line lg:border-l lg:pl-10">
          <li className="text-sm font-bold uppercase tracking-wider text-brand-ink/60">What it will include</li>
          {planned.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[16px] text-brand-ink">
              <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
