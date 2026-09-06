import type { Metadata } from 'next';
import Link from 'next/link';
import { CircleCheck as CheckCircle, ArrowRight, Store } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui/button';
import PartnerInquiryForm from '@/components/site/PartnerInquiryForm';
import HomepageTrustBars from '@/components/site/HomepageTrustBars';

export const metadata: Metadata = {
  title: 'Become a Supplier Partner | ListWorx',
  description:
    'Put your business in front of every ListWorx contractor — featured placement in their dashboard, a logo on the homepage, and newsletter mentions.',
};

const WHAT_YOU_GET = [
  'Featured placement in every contractor’s dashboard — the exact audience buying what you sell',
  'Logo on the ListWorx homepage',
  'Mentions in the ListWorx newsletter',
  'Occasional promotional content, including shoots filmed at your location',
];

export default function SupplierPartnerPage() {
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
              <p className="lw-label-lg mb-3 !text-lw-rust">
                <span className="inline-flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Become a Supplier Partner
                </span>
              </p>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-mkt-ink md:text-6xl">
                Get your business in front of every ListWorx contractor
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-mkt-ink/70 md:text-xl">
                ListWorx contractors buy materials every week. Put your name where they&apos;re
                already looking.
              </p>
            </Reveal>
            <Reveal immediate delay={120}>
              <div className="mt-8">
                <Link href="#inquire">
                  <Button size="lg" className="bg-lw-rust text-white hover:bg-lw-rust-hover">
                    Get in touch
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal immediate delay={200} className="relative hidden lg:block">
            <div className="lw-figure-zoom relative ml-auto w-full max-w-[560px] overflow-hidden rounded-2xl border border-zinc-200 shadow-[0_40px_80px_-40px_rgba(31,31,31,0.5)]">
              <img
                src="/images/redesign/contractor_builder-truck-handoff-FLAGGED-logo.webp"
                alt="A contractor going over an order on site"
                className="block h-full w-full object-cover"
                style={{ objectPosition: '82% 42%' }}
                loading="eager"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= WHAT YOU GET ================= */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <p className="lw-label-lg mb-3 !text-lw-rust">What you get</p>
            <h2 className="text-3xl font-bold tracking-tight text-mkt-ink md:text-4xl">
              A direct line to the people spending the money.
            </h2>
            <ul className="mt-8 space-y-5">
              {WHAT_YOU_GET.map((line, i) => (
                <Reveal as="li" key={line} delay={i * 70} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-lw-rust" />
                  <span className="text-lg text-mkt-ink/75">{line}</span>
                </Reveal>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="lw-figure-zoom overflow-hidden rounded-2xl border border-zinc-200 shadow-[0_30px_60px_-40px_rgba(31,31,31,0.5)]">
            <img
              src="/images/redesign/contractor_hvac-crop.webp"
              alt="A contractor at work with tools and materials"
              className="block h-full w-full object-cover"
              loading="lazy"
            />
          </Reveal>
        </div>
      </section>

      {/* ================= PRICING TEASER + CONDITION ================= */}
      <section className="border-y border-zinc-200 bg-lw-light-bg py-16 md:py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <p className="text-2xl font-bold tracking-tight text-mkt-ink md:text-3xl">
              Founding Supplier pricing available for a limited number of partners.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-mkt-ink/70">
              Partners display ListWorx materials at their location — it&apos;s part of being a
              partner, not an add-on.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ================= SOCIAL PROOF (homepage splash, hides when empty) ===== */}
      <HomepageTrustBars />

      {/* ================= INQUIRY FORM ================= */}
      <section id="inquire" className="container mx-auto scroll-mt-24 px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl">
          <Reveal className="mb-8">
            <p className="lw-label-lg mb-3 !text-lw-rust">Start the conversation</p>
            <h2 className="text-3xl font-bold tracking-tight text-mkt-ink md:text-4xl">
              Tell us about your business.
            </h2>
            <p className="mt-3 text-mkt-ink/70">
              A few details and we&apos;ll follow up about Founding Supplier partnership.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <PartnerInquiryForm kind="supplier" />
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
