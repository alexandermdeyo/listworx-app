import type { Metadata } from 'next';
import Link from 'next/link';
import { CircleCheck as CheckCircle, ArrowRight, Building2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui/button';
import PartnerInquiryForm from '@/components/site/PartnerInquiryForm';
import HomepageTrustBars from '@/components/site/HomepageTrustBars';

export const metadata: Metadata = {
  title: 'Become a Brokerage Partner | ListWorx',
  description:
    'Get your brokerage in front of homeowners before they’ve chosen an agent — a credited interview or video on the ListWorx site and newsletter, plus a logo on the homepage.',
};

const WHAT_YOU_GET = [
  'One of your realtors featured in a short interview or video on a topic that matters to sellers (staging, pricing, timing to list)',
  'Credited to your brokerage by name, published on the ListWorx site and newsletter',
  'Logo on the ListWorx homepage',
  'This is separate from Listing Studio — your agents can use both independently',
];

const HOW_IT_WORKS = [
  { n: '01', title: 'You designate a realtor for the quarter', body: 'Pick the agent who should represent your brokerage on camera.' },
  { n: '02', title: 'ListWorx handles the shoot, interview, and production', body: 'We plan the topic, run the interview, and edit it. Minimal lift on your side.' },
  { n: '03', title: 'It goes live on our site and newsletter, credited to your brokerage', body: 'Homeowners see your brokerage name attached to genuinely useful advice.' },
];

export default function BrokeragePartnerPage() {
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
                  <Building2 className="h-4 w-4" />
                  Become a Brokerage Partner
                </span>
              </p>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-mkt-ink md:text-6xl">
                Get your brokerage in front of homeowners who haven&apos;t chosen an agent yet
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-mkt-ink/70 md:text-xl">
                ListWorx reaches homeowners directly — before they&apos;ve picked a realtor. Your
                brokerage can be the name they see first.
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
                src="/images/redesign/realtor_couple-consultation-laptop.webp"
                alt="A real estate agent meeting with homeowners"
                className="block h-full w-full object-cover"
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
              Your brokerage&apos;s name on advice sellers actually want.
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
              src="/images/redesign/realtor_photographer-listing-shoot.webp"
              alt="A media shoot in progress at a home"
              className="block h-full w-full object-cover"
              loading="lazy"
            />
          </Reveal>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="border-y border-zinc-200 bg-lw-light-bg py-20 md:py-28">
        <div className="container mx-auto px-4">
          <Reveal className="mb-12 max-w-2xl">
            <p className="lw-label-lg mb-3 !text-lw-rust">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight text-mkt-ink md:text-5xl">
              Three steps, once a quarter.
            </h2>
          </Reveal>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((s, i) => (
              <Reveal key={s.n} delay={i * 80} className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
                <span className="text-5xl font-bold text-lw-rust/25">{s.n}</span>
                <h3 className="mt-3 text-xl font-bold text-mkt-ink">{s.title}</h3>
                <p className="mt-2 text-mkt-ink/70">{s.body}</p>
              </Reveal>
            ))}
          </div>
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
              Tell us about your brokerage.
            </h2>
            <p className="mt-3 text-mkt-ink/70">
              A few details and we&apos;ll follow up about a brokerage partnership.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <PartnerInquiryForm kind="brokerage" />
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
