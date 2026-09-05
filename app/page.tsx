import Link from 'next/link';
import {
  ShieldCheck,
  FileCheck,
  Clock,
  Star,
  ClipboardList,
  MessageSquareText,
  ArrowRight,
  Quote,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/design-system';
import { Reveal } from '@/components/motion';
import HomeownerHero from '@/components/site/HomeownerHero';
import IroncladBadge from '@/components/site/IroncladBadge';
import TristarMark from '@/components/site/TristarMark';
import PhotoDark from '@/components/site/PhotoDark';
import CountUp from '@/components/site/CountUp';
import PartnerLogoSplash from '@/components/site/PartnerLogoSplash';

const standards = [
  {
    icon: FileCheck,
    title: 'License & entity verified',
    body: 'Business license, insurance, and legal entity confirmed before a contractor ever receives a referral.',
  },
  {
    icon: ShieldCheck,
    title: 'Insurance kept current',
    body: 'Active general liability and workers-comp are a condition of staying in the network — not a one-time check.',
  },
  {
    icon: Clock,
    title: '24-hour response',
    body: 'Every match is committed to acknowledging your request within a day. No black holes.',
  },
  {
    icon: Star,
    title: 'Rated by real homeowners',
    body: 'Reviews come only from verified homeowners after confirmed jobs. Fall below standard and you’re removed.',
  },
];

const steps = [
  {
    n: '01',
    icon: ClipboardList,
    title: 'Describe the project',
    body: 'Tell us what you need and where. Two minutes from your phone — no account required.',
  },
  {
    n: '02',
    icon: MessageSquareText,
    title: 'Get matched',
    body: 'Up to three verified contractors for your trade, area, and timeline. Your details stay private until you reach out.',
  },
  {
    n: '03',
    icon: ShieldCheck,
    title: 'Get it done',
    body: 'Call the one you like, schedule the work, and rate them when it’s finished. That rating keeps the network honest.',
  },
];

export default function LandingPage() {
  return (
    <PageShell surface="marketing">
      <Navigation variant="light" />

      <HomeownerHero />

      {/* ============================================================= */}
      {/* IRONCLAD STANDARDS — dark mailer band, no photo               */}
      {/* ============================================================= */}
      <section className="relative overflow-hidden bg-mailer-black text-white">
        <div className="h-1 w-full bg-lw-rust" />
        <TristarMark className="pointer-events-none absolute bottom-6 right-6 h-48 w-48 text-white/[0.04]" />

        <div className="container mx-auto grid gap-12 px-4 py-20 md:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal className="flex justify-center lg:justify-start">
            <IroncladBadge
              variant="standards"
              reveal
              className="h-52 md:h-64 lg:h-72"
              href="/ironclad"
            />
          </Reveal>

          <div>
            <Reveal>
              <p className="lw-label mb-3">The IronClad Standard</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                A badge only means something if it can be taken away.
              </h2>
              <p className="mt-4 max-w-xl text-white/65 md:text-lg">
                IronClad isn&apos;t a directory listing. It&apos;s a standard every
                ListWorx contractor is held to — checked up front, monitored after,
                and enforced.
              </p>
            </Reveal>

            <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {standards.map((s, i) => {
                const Icon = s.icon;
                return (
                  <Reveal key={s.title} delay={i * 80} className="flex gap-3">
                    <Icon className="mt-0.5 h-6 w-6 shrink-0 text-lw-rust" />
                    <div>
                      <h3 className="font-bold text-white">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/60">
                        {s.body}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={120}>
              <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6 border-t border-white/10 pt-8">
                <div>
                  <div className="text-3xl font-bold text-lw-rust md:text-4xl">
                    <CountUp value={100} suffix="%" />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-white/50">
                    License-verified
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-lw-rust md:text-4xl">
                    <CountUp value={24} suffix="hr" />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-white/50">
                    Response commitment
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-lw-rust md:text-4xl">
                    <CountUp value={3} />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-white/50">
                    Verified matches / request
                  </div>
                </div>
                <Link href="/ironclad" className="ml-auto">
                  <Button
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    Read the full standard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* HOW IT WORKS — asymmetric, light                             */}
      {/* ============================================================= */}
      <section id="how-it-works" className="container mx-auto scroll-mt-24 px-4 py-20 md:py-28">
        <Reveal className="mb-14 max-w-2xl">
          <p className="lw-label mb-3 !text-lw-rust">How it works</p>
          <h2 className="text-3xl font-bold tracking-tight text-mkt-ink md:text-5xl">
            Three steps. No profile scrolling.
          </h2>
        </Reveal>

        <div className="space-y-16 md:space-y-24">
          {/* Row 1 — copy left, photo right (balanced halves) */}
          <Reveal className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
            <div className="flex gap-5">
              <span className="text-5xl font-bold text-lw-rust/25">{steps[0].n}</span>
              <div>
                <h3 className="text-xl font-bold text-mkt-ink">{steps[0].title}</h3>
                <p className="mt-2 text-mkt-ink/70">{steps[0].body}</p>
              </div>
            </div>
            <div className="lw-figure-zoom aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
              <img
                src="/images/redesign/jobrequest_phone-screenshot-man-dog.webp"
                alt="A homeowner starting a job request on his phone"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </Reveal>

          {/* Row 2 — middle step, centered, carried by the numbers instead of a photo */}
          <Reveal className="border-y border-zinc-200 py-14 text-center">
            <span className="mx-auto block text-5xl font-bold text-lw-rust/25">{steps[1].n}</span>
            <h3 className="mt-2 text-xl font-bold text-mkt-ink">{steps[1].title}</h3>
            <p className="mx-auto mt-2 max-w-xl text-mkt-ink/70">{steps[1].body}</p>
            <div className="mx-auto mt-10 flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-14">
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-bold text-lw-rust md:text-7xl">
                  <CountUp value={3} />
                </span>
                <span className="max-w-[9rem] text-left text-sm font-medium uppercase tracking-widest text-mkt-ink/60">
                  verified matches, max
                </span>
              </div>
              <span className="hidden h-14 w-px bg-zinc-300 sm:block" />
              <div className="flex items-baseline gap-3">
                <span className="text-6xl font-bold text-mkt-ink md:text-7xl">
                  <CountUp value={30} prefix="<" suffix="s" />
                </span>
                <span className="max-w-[10rem] text-left text-sm font-medium uppercase tracking-widest text-mkt-ink/60">
                  to see them on screen
                </span>
              </div>
            </div>
          </Reveal>

          {/* Row 3 — photo left, copy right (mirror of row 1) */}
          <Reveal className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
            <div className="lw-figure-zoom order-2 aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 shadow-sm md:order-1">
              <img
                src="/images/redesign/results_kitchen-white-cabinets.webp"
                alt="A finished kitchen with new white cabinetry"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="order-1 flex gap-5 md:order-2">
              <span className="text-5xl font-bold text-lw-rust/25">{steps[2].n}</span>
              <div>
                <h3 className="text-xl font-bold text-mkt-ink">{steps[2].title}</h3>
                <p className="mt-2 text-mkt-ink/70">{steps[2].body}</p>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-14">
          <Link href="/request">
            <Button size="lg" className="bg-lw-rust text-white hover:bg-lw-rust-hover">
              Start a request — free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Reveal>
      </section>

      {/* ============================================================= */}
      {/* WHAT "VERIFIED" MEANS — light, photo-led, image bleeds left  */}
      {/* ============================================================= */}
      <section className="overflow-hidden border-y border-zinc-200 bg-lw-light-bg py-20 md:py-28">
        <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-2">
          <Reveal className="lw-figure-zoom relative overflow-hidden rounded-2xl border border-zinc-200 shadow-[0_30px_60px_-40px_rgba(31,31,31,0.5)]">
            <img
              src="/images/redesign/contractor_cleaning-crew.webp"
              alt="A ListWorx contractor crew working carefully inside a client's home"
              className="block w-full object-cover"
              loading="lazy"
            />
          </Reveal>

          <Reveal>
            <p className="lw-label mb-3 !text-lw-rust">What &ldquo;verified&rdquo; means</p>
            <h2 className="text-3xl font-bold tracking-tight text-mkt-ink md:text-4xl">
              It&apos;s not a badge we hand out. It&apos;s one we can pull.
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                'License, insurance, and entity checked before the first referral.',
                'Coverage monitored for as long as they’re in the network.',
                'Rated by verified homeowners after real, confirmed jobs.',
                'Slip below the standard and the referrals stop.',
              ].map((line, i) => (
                <Reveal as="li" key={line} delay={i * 70} className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lw-rust" />
                  <span className="text-mkt-ink/75">{line}</span>
                </Reveal>
              ))}
            </ul>
            <div className="mt-8 flex items-center gap-4">
              <IroncladBadge variant="standards" className="h-14" href="/ironclad" />
              <Link href="/ironclad">
                <Button variant="outlineOrange">
                  See every standard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================= */}
      {/* RESULTS — magazine spread, two offset photos                 */}
      {/* ============================================================= */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Reveal className="lw-figure-zoom overflow-hidden rounded-2xl border border-zinc-200 shadow-lg">
            <img
              src="/images/redesign/results_living-room-fireplace-lake.webp"
              alt="A finished great room with stone fireplace and lake view at sunset"
              className="block w-full object-cover"
              loading="lazy"
            />
          </Reveal>

          <div className="lg:pl-6">
            <Reveal>
              <Quote className="h-10 w-10 text-lw-rust/30" />
              <p className="mt-4 text-2xl font-bold leading-snug tracking-tight text-mkt-ink md:text-3xl">
                The job&apos;s done when you&apos;d recommend them without thinking
                twice.
              </p>
              <p className="mt-4 text-mkt-ink/65">
                Every ListWorx job ends with a verified homeowner rating. That&apos;s
                the number that decides who stays in the network — not ad spend, not
                how long they&apos;ve been listed.
              </p>
            </Reveal>

            <Reveal delay={120} className="lw-figure-zoom mt-8 overflow-hidden rounded-2xl border border-zinc-200 shadow-md sm:w-[80%] lg:ml-auto">
              <img
                src="/images/redesign/results_house-exterior-dusk.webp"
                alt="A home exterior photographed at dusk after exterior work"
                className="block w-full object-cover"
                loading="lazy"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* PARTNER LOGO SPLASH — admin-managed; renders only if populated */}
      {/* ============================================================= */}
      <PartnerLogoSplash />

      {/* ============================================================= */}
      {/* REALTORS BRIDGE — light, image right                         */}
      {/* ============================================================= */}
      <section className="overflow-hidden border-y border-zinc-200 bg-white py-20 md:py-28">
        <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <p className="lw-label mb-3 !text-lw-rust">For real estate pros</p>
            <h2 className="text-3xl font-bold tracking-tight text-mkt-ink md:text-4xl">
              Refer a contractor without putting your name on the line.
            </h2>
            <p className="mt-4 max-w-xl text-mkt-ink/70">
              Pre-listing prep, post-inspection repairs, move-in work — send one
              request and hand your client a shortlist of verified pros. Free for
              agents, and your client&apos;s info stays private until you share it.
            </p>
            <Link href="/realtors" className="mt-8 inline-block">
              <Button size="lg" variant="outlineOrange">
                How it works for agents
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Reveal>

          <Reveal className="lw-figure-zoom relative order-1 overflow-hidden rounded-2xl border border-zinc-200 shadow-[0_30px_60px_-40px_rgba(31,31,31,0.5)] lg:order-2">
            <img
              src="/images/redesign/realtor_couple-consultation-laptop.webp"
              alt="A real estate agent reviewing options with clients at a kitchen table"
              className="block w-full object-cover"
              loading="lazy"
            />
          </Reveal>
        </div>
      </section>

      {/* ============================================================= */}
      {/* CONTRACTOR BRIDGE — dark mailer hit, full-bleed photo         */}
      {/* ============================================================= */}
      <section className="relative">
        <PhotoDark
          src="/images/redesign/contractor_roofers-team-hero.webp"
          alt="A roofing crew working on a house in Middle Tennessee"
          className="lw-photo-dark--contractor min-h-[560px] md:min-h-[620px]"
          bri={0.98}
          objectPosition="center 60%"
        >
          <TristarMark className="pointer-events-none absolute right-6 top-6 h-24 w-24 text-white/10 md:right-10 md:top-10 md:h-32 md:w-32" />
          <div className="lw-photo-dark__content container mx-auto flex min-h-[560px] flex-col justify-end px-4 py-16 md:min-h-[620px] md:py-20">
            <Reveal className="max-w-2xl">
              <div className="mb-5 flex items-center gap-4">
                <p className="lw-label">For contractors</p>
                <IroncladBadge variant="partner" hover={false} className="h-11" />
              </div>
              <h2 className="text-3xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl">
                Real work. Real standards. No per-lead games.
              </h2>
              <p className="mt-4 max-w-xl text-white/75 md:text-lg">
                ListWorx is subscription-based — you pay to be in the network, not
                per lead. Founding spots in Middle Tennessee are limited, and every
                partner carries the IronClad Certified mark.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/apply">
                  <Button size="lg" className="bg-lw-rust text-white hover:bg-lw-rust-hover">
                    Apply to join
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contractors">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    Why partner with us
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </PhotoDark>
      </section>
    </PageShell>
  );
}
