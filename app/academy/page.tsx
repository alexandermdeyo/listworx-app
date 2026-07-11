'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Shield,
  Calculator,
  HardHat,
  TrendingUp,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';

const COURSE_CATEGORIES = [
  {
    icon: GraduationCap,
    title: 'Licensing and Exam Prep',
    description: 'State contractor license prep for all 50 states — powered by ACES, the national standard for contractor licensing and exam preparation.',
    status: 'Available Now',
    poweredByAces: true,
  },
  {
    icon: Shield,
    title: 'Insurance Essentials',
    description: 'Understanding COI, liability coverage, and requirements',
    status: 'Coming Soon',
  },
  {
    icon: Calculator,
    title: 'Accounting and Bookkeeping',
    description: 'Job costing, invoicing, and managing contractor finances',
    status: 'Coming Soon',
  },
  {
    icon: HardHat,
    title: 'OSHA and Jobsite Safety',
    description: 'Safety compliance, OSHA 10/30 prep, and site protocols',
    status: 'Coming Soon',
  },
  {
    icon: TrendingUp,
    title: 'Marketing and Business Growth',
    description: 'Building your brand, getting reviews, and growing referrals',
    status: 'Coming Soon',
  },
  {
    icon: FileText,
    title: 'Legal and Contracts',
    description: 'Contract basics, lien rights, and protecting your business',
    status: 'Coming Soon',
  },
];

export default function AcademyPage() {
  return (
    <PageShell surface="dark">
      <Navigation />

      {/* SECTION 1 — HERO */}
      <section className="bg-lw-dark py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">We&apos;re Committed to Making You a Better Contractor.</h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            ListWorx isn&apos;t just a referral network. We&apos;re building something bigger — a platform where American tradespeople get the resources, credentials, and connections they need to build a business that lasts. ListWorx Academy is part of that commitment.
          </p>
        </div>
      </section>

      {/* SECTION 2 — FEATURED PARTNER */}
      <section className="bg-white py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto rounded-2xl border-2 border-lw-rust bg-orange-50/40 p-8 md:p-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-lw-rust mb-6">Official Licensing Partner</p>
            <img src="/aces-logo.jpg" alt="American Contractors Exam Services" className="h-14 w-auto mx-auto mb-8 rounded-md bg-white p-1.5 border border-lw-rust/20" />
            <p className="text-lg text-lw-text/80 leading-relaxed max-w-2xl mx-auto mb-8">
              Getting licensed is the foundation of a professional contracting career. American Contractors Exam Services has spent 25 years helping contractors pass their state licensing exams — across all 50 states, with a 95% pass rate and 60,000+ contractors served. We partnered with ACES because we believe your license isn&apos;t just a requirement. It&apos;s your credential. It&apos;s what separates you from the guy who just shows up with a truck.
              <br /><br />
              When you get licensed through ACES and IronClad certified through ListWorx, you don&apos;t chase work anymore. Work finds you.
            </p>
            <a href="https://examprep.org" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="text-base px-8 py-6 mb-6">
                Visit ACES
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <p className="text-sm text-lw-text/50">
              ListWorx members get access to ACES courses directly inside their contractor dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — COURSE CATEGORIES */}
      <section className="bg-white pb-20 md:pb-28">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-lw-text text-center mb-16">
            What You Will Learn
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {COURSE_CATEGORIES.map((category) => (
              <div
                key={category.title}
                className={`rounded-xl border p-6 flex flex-col ${
                  category.poweredByAces ? 'border-lw-rust border-2 bg-orange-50/30' : 'border-lw-border-light bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-white border border-lw-border-light">
                    <category.icon className="h-6 w-6 text-lw-rust" />
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      category.status === 'Available Now'
                        ? 'bg-lw-rust text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {category.status}
                  </span>
                </div>

                {category.poweredByAces && (
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-lw-rust mb-1.5">
                    Powered by ACES
                  </span>
                )}

                <h3 className="font-bold text-lw-text mb-2">{category.title}</h3>
                <p className="text-sm text-lw-text/60 flex-1">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — CTA */}
      <section className="bg-lw-dark py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
            Your License Is the Start. We Help You Build the Rest.
          </h2>
          <Link href="/apply">
            <Button size="lg" className="text-base px-8 py-6">
              Apply to Join
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-zinc-500 mt-6">
            Already a ListWorx member? Access Academy from your contractor dashboard.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
