'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CircleCheck as CheckCircle,
  Shield,
  TrendingUp,
  Award,
  Briefcase,
  FileText,
  Clock,
  Target,
  CheckCheck,
  CircleAlert as AlertCircle,
  ArrowRight,
  Lock,
  Star,
  MapPin,
  Layers,
  SlidersHorizontal,
  Camera,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';
import { Reveal } from '@/components/motion';
import PhotoDark from '@/components/site/PhotoDark';
import IroncladBadge from '@/components/site/IroncladBadge';
import { useAcademyEnabled } from '@/lib/useAcademyEnabled';
import MembershipComparison from '@/components/membership/MembershipComparison';
import FaqSection from '@/components/site/FaqSection';
import Brushstroke from '@/components/brand/Brushstroke';

const CONTRACTOR_FAQS = [
  {
    q: 'How is this different from a lead-gen service?',
    a: "You're not buying leads or bidding against ten other contractors. Referrals are routed to you by trade, county, and availability, and every member gets equal consideration for a match regardless of tier. What you pay for is growth support, not better odds at a referral.",
  },
  {
    q: 'What does it cost?',
    a: 'Network is free. Growth is $199/month. Business Pro is $299/month. No per-lead fees on any tier, ever.',
  },
  {
    q: 'Do paid tiers get more referrals than the free tier?',
    a: "No. Every member, on every tier, gets equal consideration for a referral match, as long as they meet IronClad Standards. Growth and Business Pro add business resources, member pricing on ListWorx Media Services, and (on Business Pro) custom social posts and the full Flyer Builder. They don't buy priority access to referrals.",
  },
  {
    q: 'Does joining mean I’m automatically IronClad Certified?',
    a: "No. Membership gets your business reviewed against IronClad Standards (licensing, insurance, and business practices) before you can take a referral. Certification itself is a separate, trade-specific review the ListWorx owner signs off on, not something that comes automatically with a subscription tier.",
  },
  {
    q: 'How does verification work?',
    a: "We confirm your business is legitimate, entity, license, and insurance, before you take a referral. It's business-level verification, not a review of every job or employee. Lose your license or coverage and your referrals pause until it's current.",
  },
  {
    q: 'Can I pause when I’m slammed?',
    a: 'Anytime. Turn your availability on or off, and control your service counties and trade categories yourself. No penalty for pausing.',
  },
  {
    q: 'How long until I’m approved?',
    a: 'Applications are reviewed within 72 hours.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    icon: FileText,
    title: 'Apply & Get Verified',
    desc: "Submit your application. We confirm your business is legitimate: entity, license, and insurance. This is business-level verification, not a review of every job, every employee, or every trade you touch.",
  },
  {
    step: '2',
    icon: Layers,
    title: 'Choose Your Tier',
    desc: "Network, Growth, or Business Pro. Pick the tier that fits your business. Every tier gets equal consideration for a referral match, not a spot in someone else's bidding war.",
  },
  {
    step: '3',
    icon: Target,
    title: 'Receive Qualified Referrals',
    desc: "When a homeowner's request matches your service area, trade category, and availability, we route it to you. You're not one of fifteen contractors bidding on a lead. You're matched because you're a fit.",
  },
  {
    step: '4',
    icon: Star,
    title: 'Build Your Reputation',
    desc: "Finish the job, and the homeowner leaves a verified review through ListWorx, tied to a confirmed project, not an anonymous post from who-knows-where. Your reputation builds on real work, not gamed ratings.",
  },
  {
    step: '5',
    icon: SlidersHorizontal,
    title: 'Grow on Your Terms',
    desc: "Turn your availability on or off whenever you need to. Control your service counties and categories yourself. No penalty for pausing. It's your business, not ours.",
  },
];

/**
 * A mid-page prompt to create an account — orange button, white text. Two
 * layouts (a thin bordered row vs. a tinted card) so the scattered placements
 * don't all look identical.
 */
function JoinCta({
  variant = 'bar',
  headline,
  sub,
}: {
  variant?: 'bar' | 'inline';
  headline: string;
  sub?: string;
}) {
  if (variant === 'inline') {
    return (
      <section className="overflow-hidden relative bg-mailer-black">
        <Brushstroke variant="corner" className="pointer-events-none absolute left-0 top-0 z-10 w-[110px] md:w-[180px]" />
        <div className="container mx-auto px-4">
          <Reveal className="flex flex-col items-start gap-4 border-t border-mailer-border py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg font-semibold text-white">{headline}</p>
            <Link href="/apply" className="shrink-0">
              <Button className="bg-lw-rust text-white hover:bg-lw-rust-hover">
                Join Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    );
  }
  return (
    <section className="bg-mailer-ink">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-5 rounded-2xl border border-lw-rust/30 bg-lw-rust/[0.07] p-6 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <p className="text-lg font-bold text-white">{headline}</p>
            {sub ? <p className="mt-1 text-sm text-white/60">{sub}</p> : null}
          </div>
          <Link href="/apply" className="shrink-0">
            <Button className="bg-lw-rust text-white hover:bg-lw-rust-hover">
              Join Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export default function ContractorsPage() {
  const academyEnabled = useAcademyEnabled();

  return (
    <PageShell surface="marketing" className="!bg-mailer-black !text-white">
      <Navigation variant="light" />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-mailer-black py-16 md:py-28">
        <PhotoDark
          src="/images/redesign/contractor_roofers-team-hero.webp"
          srcMobile="/images/redesign/contractor_roofers-hero-mobile.webp"
          alt=""
          className="lw-photo-dark--contractor absolute inset-0 z-0"
          bri={0.98}
          objectPosition="center 45%"
          objectPositionMobile="center 32%"
          priority
        />
        <div className="absolute inset-0 z-[1] bg-black/[0.12]" aria-hidden="true" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="mx-auto max-w-5xl text-center">
            <Reveal immediate delay={0}>
              <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
                <Badge className="border-transparent bg-lw-rust px-3.5 py-1.5 text-[0.8rem] text-white shadow-sm hover:bg-lw-rust">
                  <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                  IronClad Partner Network · Expanding Nationally
                </Badge>
                <Badge className="border-white/50 bg-black/45 px-3.5 py-1.5 text-[0.8rem] text-white shadow-sm backdrop-blur-md hover:bg-black/55">
                  <MapPin className="mr-1.5 h-3.5 w-3.5" />
                  Now Recruiting in Middle Tennessee
                </Badge>
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
                Real Work. Real Standards.<br className="hidden md:block" />{' '}
                <span className="text-lw-rust">A Partner in Your Growth.</span>
              </h1>
            </Reveal>
            <Reveal immediate delay={100}>
              <p className="mx-auto mb-4 max-w-3xl text-lg text-white/80 md:text-xl lg:text-2xl">
                You do the work. We make sure the right people know your name, everywhere we go.
              </p>
              <p className="mx-auto mb-10 max-w-3xl text-base text-white/70 md:text-lg">
                ListWorx is building the largest vetted independent contractor network in America.
                Join free, or go further with a Growth or Business Pro membership that adds marketing
                and business-growth support on top. Every member gets equal consideration for a
                referral match. What you pay for is growth support, not better odds.
              </p>
            </Reveal>

            <Reveal immediate delay={200}>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/apply">
                  <Button size="lg" className="rounded-lg bg-lw-rust px-8 py-6 text-lg text-white shadow-lg transition-all hover:bg-lw-rust-hover hover:shadow-xl">
                    <Award className="mr-2 h-5 w-5" />
                    Join Free
                  </Button>
                </Link>
                <Link href="/ironclad">
                  <Button size="lg" variant="outline" className="rounded-lg border-white/40 bg-transparent px-8 py-6 text-lg text-white hover:bg-white/10 hover:text-white">
                    <Shield className="mr-2 h-5 w-5" />
                    View IronClad Standards
                  </Button>
                </Link>
              </div>
            </Reveal>

            <Reveal immediate delay={300}>
              <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-3">
                {[
                  ['Free', 'to join: Network membership costs nothing'],
                  ['Flat', 'Rate, no per-referral fees, ever'],
                  ['National', 'Expanding market by market'],
                ].map(([big, small]) => (
                  <div key={big} className="text-center">
                    <div className="mb-2 text-4xl font-bold text-lw-rust">{big}</div>
                    <div className="text-sm text-white/70">{small}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= MEMBERSHIP TIERS (full breakdown up top) ================= */}
      <section className="relative bg-mailer-black py-16 md:py-24">
        <div className="absolute left-0 top-0 h-1 w-full bg-lw-rust" />
        <div className="container mx-auto px-4">
          <Reveal className="mb-12 max-w-3xl">
            <p className="lw-label mb-3">Membership tiers</p>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Join free. Grow at your own pace.
            </h2>
            <p className="mt-4 text-lg text-white/65">
              Every tier gets equal consideration for a referral match, as long as you meet IronClad
              Standards. Growth and Business Pro add business resources and member pricing on top.
              They don&apos;t buy priority access to referrals.
            </p>
          </Reveal>

          <MembershipComparison
            showTable={false}
            ctaFor={(id) => ({ href: '/apply', label: id === 'network' ? 'Join Free' : id === 'growth' ? 'Apply for Growth' : 'Apply for Business Pro' })}
          />
          <Reveal className="mt-8">
            <Link href="/pricing" className="inline-flex items-center gap-2 font-semibold text-lw-rust hover:underline">
              Compare every plan side by side <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================= WHY LISTWORX (photo left · points right) ================= */}
      <section className="overflow-hidden bg-mailer-ink py-16 md:py-24">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <Reveal className="min-w-0">
            <PhotoDark
              src="/images/redesign/contractor_hvac-crop.webp"
              alt="An IronClad-verified HVAC technician on a service call"
              className="lw-photo-dark--contractor min-h-[440px] rounded-2xl lg:min-h-[560px]"
              angle="to bottom"
              a1={0.65}
              a2={0.48}
              a3={0.31}
              bri={0.77}
              sat={0.51}
              objectPositionMobile="center 50%"
            />
          </Reveal>

          <div className="min-w-0">
            <Reveal>
              <Badge className="mb-4 border-amber-400/30 bg-amber-400/15 text-amber-300">
                <TrendingUp className="mr-1 h-3 w-3" />
                Building the national network
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                A partner in your growth, not just a referral source
              </h2>
              <p className="mt-4 max-w-xl text-lg text-white/65">
                Joining is free and nobody pays per lead. Every paid tier adds real
                marketing and business-growth support, not just a louder badge.
              </p>
            </Reveal>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Star,
                  title: 'Reviewed Against IronClad Standards',
                  desc: 'Every member is reviewed for licensing, insurance, and business practices before taking a referral, the same bar for every tier.',
                },
                {
                  icon: TrendingUp,
                  title: 'Equal Consideration, Every Tier',
                  desc: 'Referral matching doesn’t favor a higher-priced tier. What you pay for is growth support, not priority placement.',
                },
                {
                  icon: Shield,
                  title: 'Flat, Predictable Pricing',
                  desc: 'No per-referral fees, no bidding, no surprise charges. Network is free; Growth and Business Pro are flat monthly rates.',
                },
                {
                  icon: Briefcase,
                  title: 'Built to Grow With You',
                  desc: 'Growth adds business manuals, templates, and media discounts. Business Pro adds two custom social posts a month and the full Flyer Builder.',
                },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 70}>
                  <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-5">
                    <item.icon className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" />
                    <div>
                      <h3 className="text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm text-white/60">{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120} className="mt-8">
              <Link href="/apply" className="block sm:inline-block">
                <Button size="lg" className="w-full whitespace-normal rounded-lg bg-amber-500 px-6 py-6 text-base text-white shadow-lg hover:bg-amber-600 sm:w-auto sm:px-8 sm:text-lg">
                  <Award className="mr-2 h-5 w-5 shrink-0" />
                  Join Free
                  <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
                </Button>
              </Link>
              <p className="mt-3 text-sm text-white/50">
                Free to apply. Approved in as little as 72 hours.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS (timeline left · photo right) ================= */}
      <section id="how-it-works" className="overflow-hidden bg-mailer-black py-16 md:py-24">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="min-w-0">
            <Reveal className="mb-12">
              <p className="lw-label mb-3">How it works</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                No bidding wars. No pay-per-lead.
              </h2>
              <p className="mt-4 max-w-xl text-lg text-white/65">
                A predictable subscription, and referrals that actually fit your business.
              </p>
            </Reveal>

            <div className="relative">
              <div className="absolute bottom-2 left-7 top-2 w-px bg-mailer-border" aria-hidden="true" />
              <div className="space-y-9">
                {HOW_IT_WORKS.map((item, index) => (
                  <Reveal key={item.step} delay={index * 60}>
                    <div className="relative flex gap-6">
                      <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-lw-rust bg-mailer-black">
                        <item.icon className="h-6 w-6 text-lw-rust" />
                      </div>
                      <div className="pt-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-lw-rust">
                          Step {item.step}
                        </span>
                        <h3 className="mb-2 mt-1 text-xl font-bold text-white">{item.title}</h3>
                        <p className="leading-relaxed text-white/65">{item.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>

          <Reveal className="hidden min-w-0 lg:block lg:sticky lg:top-24">
            <PhotoDark
              src="/images/redesign/contractor_home-inspector-FLAGGED-logo.webp"
              alt="A verified contractor walking a client through a home system check"
              className="lw-photo-dark--contractor rounded-2xl lg:min-h-[620px]"
              bri={0.8}
              sat={0.58}
            />
          </Reveal>
        </div>
      </section>

      <JoinCta
        variant="inline"
        headline="Licensed, insured, and ready to work? Start your application."
      />

      {/* ================= BRAND MESSAGE (full-bleed photo band) ================= */}
      <section className="relative">
        <PhotoDark
          src="/images/redesign/contractor_cleaning-crew.webp"
          alt=""
          className="lw-photo-dark--contractor min-h-[620px] md:min-h-[640px]"
          bri={0.94}
          objectPosition="center 40%"
        >
          <div className="lw-photo-dark__content container mx-auto flex min-h-[620px] flex-col justify-end px-4 py-16 md:min-h-[640px] md:py-20">
            <Reveal className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                This isn&apos;t a lead platform. It&apos;s a network.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">
                Lead platforms make money when you fail. They charge you per contact, sell that same
                contact to fifteen other contractors, and pocket the spread while you race to
                underbid everyone. That&apos;s the business model. That&apos;s why it feels bad,
                because it is.
              </p>
              <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">
                ListWorx is built the other direction. Flat membership. Three referrals max per
                request. IronClad Standards required for everyone in the network. When a realtor or
                homeowner gets a name from us, they&apos;re getting someone who earned it.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  'No per-referral fees. Ever.',
                  'No lead auctions. You don’t bid for your own name.',
                  'Two other vetted pros, not fifteen strangers.',
                ].map((line) => (
                  <div key={line} className="rounded-lg border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                    {line}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </PhotoDark>
      </section>

      {/* ================= WHY THE NETWORK MODEL WINS (photo band · cards) ================= */}
      <section className="overflow-hidden bg-mailer-ink py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Reveal className="mb-10 max-w-3xl">
            <p className="lw-label mb-3">Why the network model wins</p>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Lead platforms extract from contractors. A network protects them.
            </h2>
          </Reveal>

          <Reveal className="mb-10">
            <PhotoDark
              src="/images/redesign/contractor_painter-wall-crop.webp"
              alt="An IronClad-verified painter rolling a fresh coat onto a wall"
              className="lw-photo-dark--contractor aspect-[16/7] w-full rounded-2xl"
              bri={0.83}
              sat={0.58}
              objectPosition="center 30%"
            />
          </Reveal>

          <div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                {
                  icon: Target,
                  title: 'High-Intent Referrals Only',
                  desc: 'Every request comes from a realtor managing an active transaction or a homeowner with a real project. No tire-kickers, no price shoppers.',
                },
                {
                  icon: Lock,
                  title: 'Max 3 Contractors Per Request',
                  desc: 'Your referral isn’t sold to 15 others. You compete against at most 2, both vetted. Higher close rates, better margins.',
                },
                {
                  icon: TrendingUp,
                  title: 'Predictable Business Costs',
                  desc: 'One flat monthly rate, no per-referral fees, no surprise charges, no bidding for priority. Budget around it.',
                },
                {
                  icon: Shield,
                  title: 'The Badge Builds Your Brand',
                  desc: 'Being an IronClad Partner signals professionalism to every realtor and homeowner, credibility built into every referral.',
                },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 70}>
                  <div className="lw-hover-lift-dark flex h-full items-start gap-4 rounded-2xl border border-mailer-border bg-mailer-card p-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lw-rust/15">
                      <item.icon className="h-5 w-5 text-lw-rust" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <p className="mt-1.5 text-sm text-white/60">{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= COMPARISON ================= */}
      <section className="bg-mailer-black py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <Reveal className="mb-12 max-w-3xl">
              <p className="lw-label mb-3">The difference</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                Stop paying for dead-end leads.
              </h2>
              <p className="mt-4 text-lg text-white/65">
                Here&apos;s what changes when you stop chasing random contacts and join a national
                network built around your reputation.
              </p>
            </Reveal>

            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              <Reveal>
                <div className="h-full rounded-2xl border-2 border-red-500/40 bg-mailer-card p-6 md:p-8">
                  <h3 className="mb-4 flex items-center text-xl font-bold text-white md:text-2xl">
                    <AlertCircle className="mr-3 h-6 w-6 shrink-0 text-red-400" />
                    Traditional Referral Platforms
                  </h3>
                  <ul className="space-y-3 text-sm text-white/65 md:text-base">
                    {[
                      'Pay $15 to $100+ per shared contact received',
                      'Same referral sold to 10 to 20 other contractors',
                      'No quality standards or credential verification',
                      'Monthly costs swing wildly with no predictability',
                      'Forced to underprice to outbid competitors',
                      'No network standards, anyone can buy a lead',
                    ].map((line) => (
                      <li key={line} className="flex items-start">
                        <span className="mr-3 font-bold text-red-400">✗</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={70}>
                <div className="h-full rounded-2xl border-2 border-lw-rust bg-lw-rust p-6 text-white shadow-lg md:p-8">
                  <h3 className="mb-4 flex items-center text-xl font-bold md:text-2xl">
                    <CheckCircle className="mr-3 h-6 w-6 shrink-0" />
                    ListWorx Network
                  </h3>
                  <ul className="space-y-3 text-sm md:text-base">
                    {[
                      'Free to join, no per-referral fees, ever',
                      'Maximum 3 contractors matched per request',
                      'IronClad Standards required for all network members',
                      'Predictable monthly cost you can budget around',
                      'Relationship-driven referrals from trusted realtors',
                      'IronClad Standards required of everyone. Your competition is qualified',
                    ].map((line) => (
                      <li key={line} className="flex items-start">
                        <span className="mr-3 font-bold">✓</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <JoinCta
        headline="Stop bidding for your own name."
        sub="Free to join, no per-lead fees, three matches max per request, and every contractor you're up against is IronClad-verified too."
      />

      {/* ================= REQUIREMENTS (badge highlight · concept) ================= */}
      <section className="bg-mailer-ink py-16 md:py-24">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal className="flex min-w-0 flex-col items-start">
            <IroncladBadge variant="standards" reveal className="h-44 md:h-56" href="/ironclad" />
            <p className="mt-6 max-w-xs text-sm text-white/55">
              IronClad Standards are requirements, not suggestions. We verify before approval and
              monitor throughout your membership.
            </p>
          </Reveal>

          <div className="min-w-0">
            <Reveal className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                What we require
              </h2>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2">
              <Reveal>
                <div className="h-full rounded-2xl border border-lw-rust/50 bg-mailer-card p-6">
                  <h3 className="mb-4 flex items-center text-lg font-bold text-white">
                    <CheckCircle className="mr-2 h-5 w-5 text-lw-rust" />
                    Required Credentials
                  </h3>
                  <ul className="space-y-3 text-sm text-white/65">
                    {[
                      'Valid state contractor license for your trade',
                      'General liability insurance ($1M minimum)',
                      'Workers’ compensation insurance',
                      'Minimum 2 years in business',
                      'Clean business and complaint history',
                    ].map((line) => (
                      <li key={line} className="flex items-start">
                        <CheckCheck className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-lw-rust" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={70}>
                <div className="h-full rounded-2xl border border-mailer-border bg-mailer-card p-6">
                  <h3 className="mb-4 flex items-center text-lg font-bold text-white">
                    <Award className="mr-2 h-5 w-5 text-lw-rust" />
                    Ongoing Standards
                  </h3>
                  <ul className="space-y-3 text-sm text-white/65">
                    {[
                      'Respond to every referral within 24 hours',
                      'Professional, timely communication on every job',
                      'Written estimates provided for jobs over $500',
                      'Show up on time and honor your commitments',
                      'Stand behind your work, or risk network removal',
                    ].map((line) => (
                      <li key={line} className="flex items-start">
                        <CheckCheck className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-lw-rust" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
            <Reveal delay={120} className="mt-6 rounded-2xl border border-mailer-border bg-mailer-card/60 p-6">
              <p className="text-sm text-white/60">
                <span className="font-semibold text-white">Standards are enforced, not just stated.</span>{' '}
                Poor performance or complaints can result in suspension or removal. IronClad Standards
                protect realtors, homeowners, and the contractors who maintain them.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= GROW YOUR BRAND (media / content help) ================= */}
      <section className="overflow-hidden bg-mailer-black py-16 md:py-24">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2 lg:items-center">
          <Reveal className="min-w-0">
            <p className="lw-label mb-3">More than referrals</p>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              We&apos;ll help you look as good online as you are on the job.
            </h2>
            <p className="mt-4 max-w-xl text-white/65">
              Great work goes unseen when the marketing doesn&apos;t keep up. ListWorx Media
              Services shoots jobsite, team, and drone photography plus short-form video for your
              business, so realtors and homeowners find a polished, active business when they look
              you up. Book directly and pay up front. Growth members save 5% and Business Pro members
              save 10%.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {['Jobsite photography', 'Drone photography', 'Short-form video'].map((chip) => (
                <span key={chip} className="inline-flex items-center gap-1.5 rounded-full border border-mailer-border bg-mailer-card px-3 py-1.5 text-xs font-semibold text-white/80">
                  <Camera className="h-3.5 w-3.5 text-lw-rust" />
                  {chip}
                </span>
              ))}
            </div>
            <Link href="/media-services" className="mt-6 inline-flex items-center gap-2 rounded-md bg-lw-rust px-5 py-2.5 text-sm font-semibold text-white hover:bg-lw-rust-hover">
              See ListWorx Media Services <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal className="min-w-0">
            <PhotoDark
              src="/images/redesign/contractor_video-crew-content-shoot.webp"
              alt="A content crew filming a contractor's work for their marketing"
              className="lw-photo-dark--contractor min-h-[380px] rounded-2xl lg:min-h-[460px]"
              bri={0.83}
              sat={0.63}
            />
          </Reveal>
        </div>
      </section>

      {/* ================= WHO THIS IS FOR ================= */}
      <section className="bg-mailer-ink py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <Reveal className="mb-12 max-w-3xl">
              <p className="lw-label mb-3">Is this the right fit?</p>
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                Built for contractors who take pride in their work.
              </h2>
              <p className="mt-4 text-lg text-white/65">Not everyone qualifies, and we&apos;re fine with that.</p>
            </Reveal>

            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              <Reveal>
                <div className="h-full rounded-2xl border-2 border-lw-rust bg-mailer-card p-6 md:p-8">
                  <CheckCircle className="mb-4 h-10 w-10 text-lw-rust" />
                  <h3 className="mb-4 text-xl font-bold text-white md:text-2xl">A good fit if you:</h3>
                  <ul className="space-y-3 text-sm text-white/65 md:text-base">
                    {[
                      'Are licensed, insured, and have a track record',
                      'Want predictable, manageable marketing costs',
                      'Respond fast and communicate professionally',
                      'Are tired of competing against 15 other contractors',
                      'Want quality work from realtors with real projects',
                      'Value your professional reputation and want to grow it',
                    ].map((line) => (
                      <li key={line} className="flex items-start">
                        <CheckCircle className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-lw-rust" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={70}>
                <div className="h-full rounded-2xl border border-mailer-border bg-mailer-card p-6 md:p-8">
                  <AlertCircle className="mb-4 h-10 w-10 text-white/40" />
                  <h3 className="mb-4 text-xl font-bold text-white md:text-2xl">Not the right fit if you:</h3>
                  <ul className="space-y-3 text-sm text-white/65 md:text-base">
                    {[
                      'Are unlicensed or don’t carry proper insurance',
                      'Want volume over quality: high-count, low-margin work',
                      'Can’t commit to 24-hour response times on referrals',
                      'Are just starting out with no verifiable history',
                      'Won’t meet professional communication or conduct standards',
                      'Prefer anonymous transactions with no accountability',
                    ].map((line) => (
                      <li key={line} className="flex items-start">
                        <span className="mr-3 font-bold text-white/40">✗</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <JoinCta
        variant="inline"
        headline="Sound like a fit? It's free to apply, and takes just a few minutes."
      />

      {/* ================= FAQ ================= */}
      <FaqSection
        items={CONTRACTOR_FAQS}
        tone="dark"
        title="Straight answers before you apply."
        intro="What contractors ask us most about the network."
      />

      {/* ================= BOTTOM CTA ================= */}
      <section className="relative overflow-hidden bg-mailer-ink py-20">
        <div className="absolute left-0 top-0 h-1 w-full bg-lw-rust" />
        <div className="container relative mx-auto px-4">
          <Reveal className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <IroncladBadge variant="partner" className="h-20" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              Join the national network.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
              Stop chasing bad leads. Build a referral pipeline inside the largest vetted contractor
              network in America, free to join, with Growth and Business Pro available when you're
              ready for more. Applications reviewed within 72 hours.
            </p>
            <Link href="/apply" className="mt-8 inline-block">
              <Button size="lg" className="rounded-lg bg-lw-rust px-8 py-6 text-lg text-white shadow-lg hover:bg-lw-rust-hover hover:shadow-xl md:px-10">
                <Award className="mr-2 h-5 w-5" />
                Join Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
