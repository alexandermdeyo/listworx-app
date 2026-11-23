'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { ArrowRight, Shield, Users, TrendingUp, Camera, BookOpen, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion';
import Brushstroke from '@/components/brand/Brushstroke';
import IroncladBadge from '@/components/site/IroncladBadge';
import PhotoStrip from '@/components/brand/PhotoStrip';
import { LIB } from '@/lib/brand/photos';

const STATEMENTS = [
  {
    label: 'Our Purpose',
    text: 'To honor God by serving people, strengthening businesses, and building communities with integrity, excellence, and generosity.',
  },
  {
    label: 'Our Mission',
    text: 'ListWorx connects homeowners and real estate professionals with vetted, accountable contractors, and helps good contractors become exceptional businesses through referrals, education, marketing support, and trusted partnerships.',
  },
  {
    label: 'Our Vision',
    text: "To become America's most trusted contractor network, known for raising the standard of the trades, creating real opportunity for hardworking people, and showing what a business built on Christian principles can do for the communities it serves.",
  },
];

const OFFERS = [
  {
    icon: Users,
    title: 'Free requests',
    body: 'Homeowners and realtors send one free request and get up to three approved local contractors to choose from.',
    href: '/request',
    cta: 'Find a contractor',
  },
  {
    icon: Shield,
    title: 'A free network for contractors',
    body: 'Joining is free. Every member is reviewed by ListWorx and agrees to the IronClad Standards. Nobody pays per lead.',
    href: '/contractors',
    cta: 'For contractors',
  },
  {
    icon: TrendingUp,
    title: 'Growth and Business Pro',
    body: 'Optional paid memberships with business resources, marketing support, custom social posts, and member pricing on media.',
    href: '/pricing',
    cta: 'See pricing',
  },
  {
    icon: Camera,
    title: 'ListWorx Media Services',
    body: 'Jobsite, branding, real estate, and drone photography plus short-form video, booked and paid for online.',
    href: '/media-services',
    cta: 'Book a shoot',
  },
  {
    icon: BookOpen,
    title: 'Learning Center',
    body: 'Practical guides and resources to help contractors run a better business.',
    href: '/learning-center',
    cta: 'Start learning',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-mkt-ink mkt-scope">
      <Navigation variant="light" />

      {/* HERO */}
      <section className="overflow-hidden relative bg-mailer-black pt-12 text-white md:pt-14">
        <Brushstroke variant="corner" className="pointer-events-none absolute left-0 top-0 z-10 w-[110px] md:w-[180px]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 md:grid-cols-2 md:gap-14 md:pb-20">
          <div>
            <Reveal immediate delay={0}>
              <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-lw-rust">About ListWorx</p>
              <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
                Built to fix what&apos;s broken in home services.
              </h1>
            </Reveal>
            <Reveal immediate delay={100}>
              <p className="mb-10 text-lg leading-relaxed text-white/75 md:text-xl">
                ListWorx connects homeowners and realtors with contractors who are vetted, accountable, and ready to do the job right. And
                we help good contractors grow into great businesses.
              </p>
            </Reveal>
            <Reveal immediate delay={200}>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/request">
                  <Button size="lg" className="bg-lw-rust px-8 font-semibold text-white hover:bg-lw-rust-hover">
                    Request a Contractor Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/apply">
                  <Button size="lg" variant="outlineOrange" className="px-8 font-semibold">
                    Join the Network Free
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
          <Reveal immediate delay={150}>
            <div className="relative overflow-hidden rounded-2xl border border-mailer-border">
              <img
                src="/images/redesign/about_contractor-realtor-handshake.webp"
                alt="A contractor shaking hands with a homeowner at her front door"
                className="aspect-[4/3] w-full object-cover object-[center_35%] md:aspect-square"
                width={1024}
                height={1024}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* PURPOSE, MISSION, VISION */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal as="div" className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-lw-rust">Why We Exist</p>
            <h2 className="text-3xl font-bold leading-tight md:text-4xl">What drives ListWorx</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {STATEMENTS.map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className="h-full rounded-2xl border border-mkt-ink/10 border-t-4 border-t-lw-rust p-7">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-lw-rust">{s.label}</p>
                  <p className="text-lg font-semibold leading-snug text-mkt-ink">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* THE PEOPLE WE SERVE */}
      <section className="pb-12 md:pb-14">
        <div className="mx-auto max-w-6xl px-6">
          <PhotoStrip
            photos={[
              { ...LIB.homeownerTour, caption: 'Homeowners and realtors' },
              { ...LIB.paintCrew2, caption: 'Contractors and crews' },
              { ...LIB.hvacMentor, caption: 'Skills passed down' },
              { ...LIB.homeExterior, caption: 'Homes worth caring for' },
            ]}
          />
        </div>
      </section>

      {/* FOUNDER STORY */}
      <section className="bg-mkt-ink/[0.03] py-12 md:py-16">
        <div className="mx-auto px-6" style={{ maxWidth: '760px' }}>
          <Reveal as="div">
            <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-lw-rust">The Founder</p>
            <h2 className="mb-10 text-3xl font-bold leading-tight text-mkt-ink md:text-4xl">Why I Built This</h2>
            <div className="space-y-6 text-lg leading-[1.85] text-mkt-ink/75">
              <p>I didn&apos;t build ListWorx from a boardroom. I built it from real life.</p>
              <p>
                I&apos;m Alex Deyo, an Air Force veteran, truck driver, former chef, photographer, business owner, and someone who has worked
                around homes, contractors, and real estate from more than one angle. I&apos;ve seen what happens when people don&apos;t show up,
                don&apos;t communicate, and don&apos;t take pride in their work. I&apos;ve also seen what happens when good people get overlooked
                because there&apos;s no better system in place.
              </p>
              <p>
                I&apos;ve seen contractors struggle to get steady work. I&apos;ve seen homeowners take risks and regret it. I&apos;ve seen realtors
                deal with the fallout when the wrong person gets trusted with the job.
              </p>
              <p>
                That&apos;s why I built ListWorx. I didn&apos;t want another lead marketplace or another noisy directory. I wanted a better system,
                one with real standards that rewards the people who do things right, and helps them grow.
              </p>
              <p>
                I moved to Tennessee not just for a better quality of life, but to build this company in a place where I can grow it the right
                way. Nashville is the starting point. The vision is much bigger. I want to build something here that can scale across the
                country and help people everywhere.
              </p>
              <p>ListWorx is based in Gallatin, Tennessee, and is accepting contractor applications across Middle Tennessee.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAITH AND PURPOSE */}
      <section className="bg-mailer-black py-20 text-white md:py-28">
        <div className="mx-auto px-6" style={{ maxWidth: '760px' }}>
          <Reveal as="div">
            <Heart className="mb-5 h-7 w-7 text-lw-rust" />
            <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-lw-rust">Faith and Purpose</p>
            <h2 className="mb-8 text-3xl font-bold leading-tight md:text-4xl">A Christian-owned business that serves everyone.</h2>
            <div className="space-y-5 text-lg leading-[1.85] text-white/75">
              <p>
                Our faith isn&apos;t a marketing angle. It&apos;s the reason we do business the way we do. It shows up in plain, practical ways:
                we tell the truth about what we offer, we don&apos;t sell referral priority, we don&apos;t let anyone buy a certification, and we
                treat every homeowner, realtor, and contractor with respect.
              </p>
              <p>
                You don&apos;t have to share our faith to work with us. Faith never affects contractor eligibility, referral placement, or
                certification.
              </p>
            </div>
            <blockquote className="mt-8 border-l-4 border-lw-rust pl-5 text-lg italic text-white/90">
              &ldquo;A good name is more desirable than great riches.&rdquo;
              <span className="mt-1 block text-sm not-italic text-white/55">Proverbs 22:1, World English Bible</span>
            </blockquote>
            <div className="mt-10">
              <Link href="/faith-and-purpose">
                <Button variant="outlineOrange">
                  Read about our faith and purpose
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STANDARDS */}
      <section className="py-12 md:py-16">
        <div className="mx-auto px-6" style={{ maxWidth: '760px' }}>
          <Reveal as="div">
            <IroncladBadge variant="standards" href="/ironclad" reveal className="mb-5 h-28 md:h-32" />
            <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-lw-rust">The Standard</p>
            <h2 className="mb-8 text-3xl font-bold leading-tight text-mkt-ink md:text-4xl">A better system. Real standards.</h2>
            <div className="space-y-5 text-lg leading-[1.85] text-mkt-ink/75">
              <p>
                The home services industry runs on trust, but it&apos;s built on almost none. Contractors disappear. Reviews get gamed. Nobody&apos;s
                accountable after the check clears.
              </p>
              <p>
                ListWorx exists to change that. Every contractor in our network is reviewed by ListWorx before they can be referred. Where a
                trade requires a license, we check it against state records, and we review each contractor&apos;s insurance documents.
              </p>
              <p>
                IronClad Standards is the framework that makes it real. It defines what we expect, how performance is measured, and what happens
                when those standards aren&apos;t met. Contractors who keep the standard stay in the network. Those who don&apos;t are removed.
                Nobody pays their way to the top.
              </p>
            </div>
            <div className="mt-10">
              <Link href="/ironclad">
                <Button variant="outlineOrange">
                  <Shield className="mr-2 h-4 w-4" />
                  Read the IronClad Standards
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* WHAT WE OFFER */}
      <section className="bg-mkt-navy py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal as="div" className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-lw-rust">What ListWorx Offers Today</p>
            <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl">More than referrals.</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {OFFERS.map((o, i) => (
              <Reveal key={o.title} delay={i * 60}>
                <div className="lw-hover-lift lw-card-dark-mkt flex h-full flex-col p-7">
                  <o.icon className="mb-4 h-6 w-6 text-lw-rust" />
                  <h3 className="mb-3 text-lg font-bold text-white">{o.title}</h3>
                  <p className="mb-6 flex-1 text-base leading-relaxed text-white/70">{o.body}</p>
                  <Link href={o.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-lw-rust hover:underline">
                    {o.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-14 md:py-16">
        <div className="mx-auto px-6 text-center" style={{ maxWidth: '680px' }}>
          <Reveal as="div">
            <h2 className="mb-6 text-3xl font-bold leading-tight tracking-tight text-mkt-ink md:text-5xl">Want to be part of it?</h2>
            <p className="mb-10 text-lg leading-relaxed text-mkt-ink/70">
              If you&apos;re a contractor tired of chasing leads, or a homeowner tired of guessing, this is for you.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/apply">
                <Button size="lg" className="bg-lw-rust px-8 font-semibold text-white hover:bg-lw-rust-hover">
                  Join the Network Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/request">
                <Button size="lg" variant="outlineOrange" className="px-8 font-semibold">
                  Request a Contractor Free
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
