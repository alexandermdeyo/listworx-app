'use client';

import {
  CircleCheck as CheckCircle,
  Shield,
  Clock,
  ShieldCheck,
  ArrowRight,
  Chrome as Home,
  CircleAlert as AlertCircle,
  Users,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui/button';
import IroncladBadge from '@/components/site/IroncladBadge';
import CountUp from '@/components/site/CountUp';
import FaqSection from '@/components/site/FaqSection';

const differentiators = [
  {
    icon: Clock,
    title: 'Stop cold-calling contractors',
    body: 'One request, up to three vetted matches. No calling around, no waiting on callbacks from someone who may not show.',
  },
  {
    icon: Shield,
    title: 'Every contractor is verified',
    body: 'Licensed, insured, and actively held to IronClad Standards — checked before approval, monitored after. Refer them knowing your name is covered.',
  },
  {
    icon: ShieldCheck,
    title: 'You stay in control',
    body: 'You get the matches. You decide who to contact. No contractor sees your client’s information until you choose to share it.',
  },
  {
    icon: Clock,
    title: 'Keep the deal on schedule',
    body: 'Pre-sale prep, post-inspection repairs, move-in work — matched pros commit to a 24-hour response so timelines don’t slip.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Submit the request',
    body: 'Property location, the work needed, your timeline. Under two minutes from your phone between showings. Free.',
  },
  {
    n: '02',
    title: 'Get up to three matches',
    body: 'In about 30 seconds you see matched contractors on screen — plus an email and a copy saved to your dashboard. No bidding war, no junk list.',
  },
  {
    n: '03',
    title: 'Choose who to contact',
    body: 'Review the matches, reach out to whoever fits, and get it scheduled. Contractors must respond within 24 hours.',
  },
];

const ironcladPoints = [
  ['License verified', 'State trade license confirmed and tracked.'],
  ['Insurance current', 'Active general liability and workers-comp required.'],
  ['24-hour response', 'Every referral acknowledged within a day.'],
  ['Standards enforced', 'Fall below the standard and they’re out of the network.'],
];

const useCases = [
  {
    icon: Home,
    title: 'Pre-sale preparation',
    items: ['Flooring repair & refinishing', 'Interior / exterior painting', 'Kitchen & bath cosmetic updates', 'Landscaping & curb appeal'],
  },
  {
    icon: AlertCircle,
    title: 'Post-inspection repairs',
    items: ['HVAC repair & replacement', 'Plumbing fixes & code corrections', 'Electrical work & panel upgrades', 'Roof, flashing & gutter work'],
  },
  {
    icon: Users,
    title: 'Buyer move-in services',
    items: ['Deep & carpet cleaning', 'Lock rekeying & security', 'Appliance install & hookup', 'Touch-ups & minor repairs'],
  },
  {
    icon: Shield,
    title: 'Emergencies',
    items: ['Water damage & mold', 'Emergency plumbing & leaks', 'Electrical outages', 'Storm & structural damage'],
  },
];

const realtorFaqs = [
  {
    q: 'Does it cost realtors anything?',
    a: 'No. ListWorx is free for realtors and homeowners — no fees, no per-request charges. Contractors pay a monthly subscription to be in the network.',
  },
  {
    q: 'Will my client get spammed?',
    a: 'No. Contractors never receive your client’s name, phone, or email. They see the service type, county, and a summary. You get the matches and decide who to contact.',
  },
  {
    q: 'What areas do you cover?',
    a: 'We’re building coverage market by market across Tennessee, starting in Middle Tennessee. If a trade isn’t covered in your county yet, submit anyway — we follow up as coverage fills in.',
  },
  {
    q: 'Can I build a list of contractors I trust?',
    a: 'Your dashboard keeps every contractor you’ve worked through ListWorx, so you can go back to the ones who delivered. A preferred-contractor feature for realtors is on the way.',
  },
  {
    q: 'How is this different from a referral marketplace?',
    a: 'Marketplaces sell your contact info to everyone. Directories just hand you names. ListWorx gives you a short, vetted list that’s already been approved and is ready to respond.',
  },
];

export default function RealtorsPage() {
  return (
    <PageShell surface="marketing">
      <Navigation variant="light" />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-lw-rust/[0.07] blur-3xl"
        />
        <div className="container relative mx-auto grid items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <Reveal immediate delay={0}>
              <p className="lw-label-lg mb-3 !text-lw-rust">For real estate pros</p>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-mkt-ink md:text-6xl">
                Refer contractors without
                <span className="block text-lw-rust">putting your name on the line.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-mkt-ink/70 md:text-xl">
                One request, up to three IronClad-verified contractors, and you choose who to
                contact. Free for agents. Your client&apos;s information stays private until you
                share it.
              </p>
            </Reveal>

            <Reveal immediate delay={120}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/request">
                  <Button size="lg" className="bg-lw-rust text-white hover:bg-lw-rust-hover">
                    Request a contractor — free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/ironclad">
                  <Button size="lg" variant="outlineOrange">
                    See the standard
                  </Button>
                </Link>
              </div>
            </Reveal>

            <Reveal immediate delay={200}>
              <div className="mt-12 flex flex-wrap gap-x-10 gap-y-6 border-t border-zinc-200 pt-8">
                <div>
                  <div className="text-3xl font-bold text-lw-rust md:text-4xl">Free</div>
                  <div className="text-xs uppercase tracking-widest text-mkt-ink/50">
                    For agents — always
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-lw-rust md:text-4xl">
                    <CountUp value={3} />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-mkt-ink/50">
                    Matches, max
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-lw-rust md:text-4xl">
                    <CountUp value={24} suffix="hr" />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-mkt-ink/50">
                    Response commitment
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal immediate delay={200} className="relative hidden lg:block">
            <div className="lw-figure-zoom relative ml-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-zinc-200 shadow-[0_40px_80px_-40px_rgba(31,31,31,0.5)]">
              <img
                src="/images/redesign/realtor_couple-consultation-laptop.webp"
                alt="A real estate agent reviewing contractor options with clients at a kitchen table"
                className="block h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= NOT A DIRECTORY — copy left, points right ================= */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="lw-label-lg mb-3 !text-lw-rust">The difference</p>
            <h2 className="text-3xl font-bold tracking-tight text-mkt-ink md:text-4xl">
              Not a directory. Not a referral marketplace.
            </h2>
            <p className="mt-4 max-w-md text-lg text-mkt-ink/70">
              Directories hand you names. Referral platforms hand everyone your contact info.
              ListWorx hands you a short list of vetted pros who&apos;ve already been approved and
              are ready to respond.
            </p>
            <div className="mt-8">
              <Link href="/request">
                <Button variant="outlineOrange">
                  Send a request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2">
            {differentiators.map((d, i) => {
              const Icon = d.icon;
              return (
                <Reveal
                  key={d.title}
                  delay={i * 70}
                  className="lw-hover-lift rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <Icon className="h-6 w-6 text-lw-rust" />
                  <h3 className="mt-3 font-bold text-mkt-ink">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mkt-ink/70">{d.body}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS — numbered rows ================= */}
      <section className="border-y border-zinc-200 bg-lw-light-bg py-20 md:py-28">
        <div className="container mx-auto px-4">
          <Reveal className="mb-12 max-w-2xl">
            <p className="lw-label-lg mb-3 !text-lw-rust">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight text-mkt-ink md:text-5xl">
              Simple enough to do between appointments.
            </h2>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal
                key={s.n}
                delay={i * 80}
                className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm"
              >
                <span className="text-5xl font-bold text-lw-rust/25">{s.n}</span>
                <h3 className="mt-3 text-xl font-bold text-mkt-ink">{s.title}</h3>
                <p className="mt-2 text-mkt-ink/70">{s.body}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12">
            <Link href="/request">
              <Button size="lg" className="bg-lw-rust text-white hover:bg-lw-rust-hover">
                Submit a request now — free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================= WHY IRONCLAD — one dark band ================= */}
      <section className="overflow-hidden bg-mailer-black py-20 text-white md:py-28">
        <div className="h-1 w-full bg-lw-rust" />
        <div className="container mx-auto grid items-center gap-12 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal className="flex justify-center lg:justify-start">
            <IroncladBadge variant="standards" reveal className="h-52 md:h-64" href="/ironclad" />
          </Reveal>
          <div>
            <Reveal>
              <p className="lw-label-lg mb-3">What the badge means for you</p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Refer an IronClad Partner and you&apos;re not guessing.
              </h2>
              <p className="mt-4 max-w-xl text-white/65 md:text-lg">
                You know exactly what standard they&apos;ve agreed to — and what gets them removed
                for breaking it.
              </p>
            </Reveal>
            <div className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {ironcladPoints.map(([title, body], i) => (
                <Reveal key={title} delay={i * 70} className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lw-rust" />
                  <div>
                    <h3 className="font-bold text-white">{title}</h3>
                    <p className="mt-1 text-sm text-white/60">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={200} className="mt-8">
              <Link href="/ironclad">
                <Button
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  Read the full standard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= LISTING MEDIA — magazine spread, two photos ================= */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <Reveal className="mb-12 max-w-2xl">
          <p className="lw-label-lg mb-3 !text-lw-rust">Listing media</p>
          <h2 className="text-3xl font-bold tracking-tight text-mkt-ink md:text-5xl">
            The same network — for the people who make your listings look good.
          </h2>
          <p className="mt-4 text-lg text-mkt-ink/70">
            Photographers and drone operators are their own kind of contractor. ListWorx connects
            you with vetted listing-media pros the same way it connects you with the trades — one
            request, verified matches, your call on who to book.
          </p>
        </Reveal>

        {/* Row 1 — photo left, copy right */}
        <Reveal className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
          <div className="lw-figure-zoom aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
            <img
              src="/images/redesign/realtor_photographer-listing-shoot.webp"
              alt="A real estate photographer shooting a living room for a listing"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-mkt-ink">Listing photography</h3>
            <p className="mt-3 text-mkt-ink/70">
              Interior and exterior photographers who shoot for real estate — staged rooms, natural
              light, fast turnaround so the listing goes live on schedule. Booked through the same
              request flow, matched to your area and timeline.
            </p>
          </div>
        </Reveal>

        {/* Row 2 — copy left, photo right */}
        <Reveal className="mt-16 grid items-center gap-10 md:grid-cols-2 lg:gap-16">
          <div className="order-2 md:order-1">
            <h3 className="text-2xl font-bold tracking-tight text-mkt-ink">Aerial & drone</h3>
            <p className="mt-3 text-mkt-ink/70">
              Licensed drone operators for aerial stills and video — lot lines, acreage, roof
              condition, the view from the deck. The pros who make a bigger property actually read
              as bigger.
            </p>
          </div>
          <div className="lw-figure-zoom order-1 aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 shadow-sm md:order-2">
            <img
              src="/images/redesign/realtor_drone-operator-listing-shoot.webp"
              alt="A drone operator capturing aerial footage of a property for a listing"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </Reveal>
      </section>

      {/* ================= LISTING STUDIO — copy left, art right ================= */}
      <section className="border-y border-zinc-200 bg-lw-light-bg py-20 md:py-28">
        <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="lw-label-lg mb-3 !text-lw-rust">
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Listing Studio
              </span>
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-mkt-ink md:text-4xl">
              We built you something else.
            </h2>
            <div className="mt-4 space-y-4 text-mkt-ink/70">
              <p>
                You&apos;ve been writing captions at 10pm and tweaking templates between showings
                forever. That&apos;s done. Listing Studio is built into your ListWorx account.
              </p>
              <p>
                Put in a property and walk away with Instagram captions, Facebook posts, a LinkedIn
                update, your email campaign, an open-house announcement, and a rewritten property
                description — in about 30 seconds. It also builds a clean, branded listing page for
                every property.
              </p>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                'Full content packages — every caption, post, and email for a listing in one shot',
                'Branded landing pages — a real URL for every listing, same day it goes live',
                'PDF listing and open-house flyers, built from your data',
                'Your name, photo, colors, and contact info on everything',
              ].map((line, i) => (
                <Reveal as="li" key={line} delay={i * 60} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-lw-rust" />
                  <span className="text-mkt-ink/70">{line}</span>
                </Reveal>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/listing-studio">
                <Button size="lg" className="bg-lw-rust text-white hover:bg-lw-rust-hover">
                  See what&apos;s included
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120} className="lw-figure-zoom overflow-hidden rounded-2xl border border-zinc-200 shadow-[0_30px_60px_-40px_rgba(31,31,31,0.5)]">
            <img
              src="/images/redesign/jobrequest_laptop-screenshot-woman-kitchen.webp"
              alt="An agent working on listing marketing from a laptop"
              className="block w-full object-cover"
              loading="lazy"
            />
          </Reveal>
        </div>
      </section>

      {/* ================= USE CASES ================= */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <Reveal className="mb-12 max-w-2xl">
          <p className="lw-label-lg mb-3 !text-lw-rust">Every stage of the deal</p>
          <h2 className="text-3xl font-bold tracking-tight text-mkt-ink md:text-5xl">
            When realtors reach for ListWorx.
          </h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {useCases.map((u, i) => {
            const Icon = u.icon;
            return (
              <Reveal
                key={u.title}
                delay={i * 60}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <h3 className="flex items-center gap-2 font-bold text-mkt-ink">
                  <Icon className="h-5 w-5 text-lw-rust" />
                  {u.title}
                </h3>
                <ul className="mt-3 space-y-1.5 text-sm text-mkt-ink/70">
                  {u.items.map((it) => (
                    <li key={it}>• {it}</li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <FaqSection
        items={realtorFaqs}
        tone="light"
        title="What agents ask us."
        intro="The questions that come up most from real estate pros."
        className="border-t border-zinc-200"
      />

      {/* ================= BOTTOM CTA ================= */}
      <section className="bg-lw-rust py-20">
        <div className="container mx-auto px-4">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              It&apos;s free. Start using it today.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
              No membership fees. No per-request charges. Contractors pay to be in the network — you
              get vetted matches at zero cost, every request, every time.
            </p>
            <Link href="/request" className="mt-8 inline-block">
              <Button size="lg" className="bg-white text-lw-rust hover:bg-white/90">
                Submit your first request — free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
