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
    description: 'ACES exam prep in all 50 states',
  },
  {
    icon: ShieldCheck,
    title: 'Get Verified',
    description: 'IronClad certification — license, insurance, references confirmed',
  },
  {
    icon: ListChecks,
    title: 'Get Listed',
    description: 'Your profile in the ListWorx contractor network',
  },
  {
    icon: Users,
    title: 'Get Referred',
    description: 'Realtors, builders, and investors find you directly',
  },
  {
    icon: TrendingUp,
    title: 'Grow',
    description: 'Recurring project pipeline, no per-lead fees ever',
  },
];

const CONTRACTOR_BENEFITS = [
  'IronClad Verified badge on your profile',
  'Matched with realtors, builders, and investors in your area',
  'Flat monthly rate — no per-lead fees',
  'ACES Trained badge on your ListWorx profile',
  'Access to ListWorx Academy',
];

const ACES_BENEFITS = [
  'Your courses featured inside ListWorx Academy',
  'Referral tracking dashboard',
  'Commission on every active subscriber',
  'Co-branded marketing materials',
  'Direct pipeline to licensed contractors seeking work',
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
                The Official Licensing Partner of ListWorx
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-xl">
                American Contractors Exam Services has helped 60,000+ contractors get licensed across all 50 states. Now their students have somewhere to put that license to work.
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
            ACES Students Get Priority Access
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
            Use code <span className="font-semibold">ACES10</span> when you apply to ListWorx for a discounted activation fee. Reserved for verified ACES students and graduates.
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
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">For Contractors</h3>
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
              <h3 className="text-2xl font-bold text-white mb-6">For ACES</h3>
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
              About American Contractors Exam Services
            </h2>
            <p className="text-lg text-lw-text/70 leading-relaxed mb-8">
              25 years in business, serving all 50 states, 60,000+ customers served, with a 95% exam pass rate. Based in Nashville, Tennessee.
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
            Ready to put your license to work?
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
