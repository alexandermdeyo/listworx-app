'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  ShieldCheck,
  ListChecks,
  Users,
  TrendingUp,
  CircleCheck as CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';

const PATHWAY_STEPS = [
  {
    icon: GraduationCap,
    title: 'Get Licensed',
    description: 'Pass your state contractor exam with ACES — the national standard for contractor licensing prep in all 50 states.',
  },
  {
    icon: ShieldCheck,
    title: 'Get Verified',
    description: 'Complete IronClad certification. License confirmed. Insurance confirmed. References checked. You\'re not just licensed — you\'re verified.',
  },
  {
    icon: ListChecks,
    title: 'Get Listed',
    description: 'Your IronClad profile goes live in the ListWorx contractor network — visible to realtors, builders, investors, and property managers in your area.',
  },
  {
    icon: Users,
    title: 'Get Referred',
    description: 'When someone needs a contractor, ListWorx matches them with up to 3 IronClad certified professionals. No bidding wars. No lead auctions. Just your name in front of the right people.',
  },
  {
    icon: TrendingUp,
    title: 'Grow',
    description: 'Every job builds your reputation. Every review strengthens your profile. Every referral adds to a pipeline that compounds over time. This is how you build a business that lasts.',
  },
];

const CONTRACTOR_BENEFITS = [
  'Your IronClad badge tells realtors and builders you are verified before they even call you',
  'Get matched directly — no competing against 15 other guys for the same lead',
  'Flat monthly membership — you keep every dollar you earn',
  'The ACES Trained badge on your profile tells the world you took your license seriously',
  'ListWorx Academy gives you the tools to grow beyond just getting jobs',
];

const ACES_BENEFITS = [
  'Your courses featured inside ListWorx Academy — visible to every active contractor on the platform',
  'A referral dashboard showing exactly how many contractors came through your pipeline',
  'Commission on every active subscriber who came through ACES',
  'Co-branded materials your students can use when they join',
  'A direct pipeline to licensed professionals who are actively looking to grow',
];

export default function AcesPartnerPage() {
  return (
    <PageShell surface="dark">
      <Navigation />

      {/* SECTION 1 — HERO */}
      <section className="bg-lw-dark py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <img src="/aces-logo.jpg" alt="American Contractors Exam Services" className="h-10 w-auto mb-6 rounded-md bg-white p-1.5" />
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
                You Prepare Them to Get Licensed. We Give Them Somewhere to Put That License to Work.
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-xl">
                American Contractors Exam Services and ListWorx share the same belief — that American tradespeople deserve more than a participation trophy. They deserve credentials that mean something, a network that respects their craft, and a pipeline that rewards their professionalism.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/apply">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8 py-6">
                    Apply to Join ListWorx
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="https://examprep.org" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-6">
                    Learn About ACES
                  </Button>
                </a>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="rounded-2xl border-2 border-lw-rust bg-white p-10 md:p-14 shadow-xl">
                <img src="/aces-logo.jpg" alt="American Contractors Exam Services" className="w-full max-w-sm h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE PATHWAY */}
      <section className="bg-white py-20 md:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-lw-text text-center mb-16">
            Get Licensed. Get Verified. Get Referred.
          </h2>

          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-lw-border-light" style={{ marginLeft: '10%', marginRight: '10%' }} />

            <div className="grid gap-10 lg:grid-cols-5">
              {PATHWAY_STEPS.map((step, i) => (
                <div key={step.title} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-lw-rust text-white text-2xl font-bold shadow-md mb-5 bg-white border-4 border-lw-rust text-lw-rust">
                    {i + 1}
                  </div>
                  <step.icon className="h-6 w-6 text-lw-rust mb-3" />
                  <h3 className="font-bold text-lw-text mb-2">{step.title}</h3>
                  <p className="text-sm text-lw-text/60 max-w-[200px]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — PROMO CODE */}
      <section className="bg-lw-rust py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            ACES Graduates Get Priority Access
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
            You already did the hard work to get licensed. Use code <span className="font-semibold">ACES10</span> when you apply to ListWorx and get a discounted activation fee reserved for ACES graduates and students. Because the work you put in to get licensed should count for something.
          </p>
          <div className="inline-block rounded-full bg-lw-dark px-8 py-3 mb-8">
            <span className="text-2xl md:text-3xl font-bold text-white tracking-widest">ACES10</span>
          </div>
          <div>
            <Link href="/apply">
              <Button size="lg" className="bg-white text-lw-rust hover:bg-white/90 text-base px-8 py-6">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHAT YOU GET */}
      <section className="bg-lw-dark py-20 md:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-16">
            What This Partnership Actually Means
          </h2>

          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">What You Get</h3>
              <ul className="space-y-4">
                {CONTRACTOR_BENEFITS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-lw-rust flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-6">What ACES Gets</h3>
              <ul className="space-y-4">
                {ACES_BENEFITS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-lw-rust flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — ABOUT ACES */}
      <section className="bg-white py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <img src="/aces-logo.jpg" alt="American Contractors Exam Services" className="h-14 w-auto mx-auto mb-8" />
            <h2 className="text-3xl md:text-4xl font-bold text-lw-text mb-6">
              25 Years of Doing It Right
            </h2>
            <p className="text-lg text-lw-text/70 leading-relaxed mb-8">
              American Contractors Exam Services was founded on a simple idea — that getting a contractor&apos;s license should not be a guessing game. For 25 years they have served more than 60,000 contractors across all 50 states with classroom and online exam prep, a 95% pass rate, and a reputation built on results.
              <br /><br />
              They are based right here in Nashville, Tennessee — and they have been doing this work long before it was fashionable to care about the trades.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
              {[
                { value: '25', label: 'Years in Business' },
                { value: '50', label: 'States Served' },
                { value: '60,000+', label: 'Customers Served' },
                { value: '95%', label: 'Exam Pass Rate' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold text-lw-rust">{stat.value}</div>
                  <div className="text-xs uppercase tracking-wide text-lw-text/50 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <p className="text-sm text-lw-text/60 mb-1">5000 Linbar Drive, Suite 250, Nashville, TN 37211</p>
            <a href="https://examprep.org" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-lw-rust hover:underline">
              examprep.org
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 6 — CTA */}
      <section className="bg-lw-dark py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
            The License Is the Foundation. ListWorx Is What You Build On Top of It.
          </h2>
          <Link href="/apply">
            <Button size="lg" className="text-base px-8 py-6">
              Apply to Join ListWorx
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
