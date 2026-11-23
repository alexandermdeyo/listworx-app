import Link from 'next/link';
import { ArrowRight, CircleCheck as CheckCircle, Home, Camera, Megaphone } from 'lucide-react';
import Navigation from '@/components/Navigation';
import MembershipComparison from '@/components/membership/MembershipComparison';
import { MEDIA_PACKAGES, MEDIA_SERVICES, formatUsd } from '@/lib/media/catalog';
import Brushstroke from '@/components/brand/Brushstroke';
import HeroPhoto from '@/components/brand/HeroPhoto';
import PhotoStrip from '@/components/brand/PhotoStrip';
import IronCladCallout from '@/components/brand/IronCladCallout';
import { LIB } from '@/lib/brand/photos';

const FAQ = [
  {
    q: 'Do paid plans get more referrals?',
    a: "No. Network, Growth, and Business Pro members all get the same shot at a referral. Paying more gets you business tools and member pricing on media. It never buys placement, approval, or IronClad Certification.",
  },
  {
    q: 'Is there a contract?',
    a: "No. Plans are month to month and you can cancel anytime. If you cancel a paid plan, it stays active until the end of the month you paid for, and then you move to Network for free.",
  },
  {
    q: 'Do you charge per lead?',
    a: "Never. You pay your monthly plan and that's it, no matter how many referrals come your way.",
  },
  {
    q: 'Do homeowners or realtors pay anything?',
    a: "No. Sending a request is free. Realtors only pay if they choose a Listing Studio marketing plan or book a photo or video shoot.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-mkt-ink mkt-scope">
      <Navigation variant="light" />

      <section className="relative isolate overflow-hidden bg-brand-navy text-white">
        <HeroPhoto src={LIB.contractorVan.src} position="25% 35%" />
        <Brushstroke variant="corner" className="pointer-events-none absolute left-0 top-0 z-10 w-[110px] md:w-[180px]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-12 md:pb-16 md:pt-16">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-lw-rust">Pricing</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">Straightforward pricing. No per-lead fees.</h1>
        <p className="mt-5 max-w-xl text-lg text-white/85">
          Here&apos;s everything ListWorx charges for, all on one page. If you&apos;re a homeowner or a realtor looking for a contractor, it costs you
          nothing.
        </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 md:py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Home, title: 'Homeowners and realtors', price: 'Free', body: 'Send a request and get up to three approved local contractors to choose from.', href: '/request', cta: 'Find a contractor' },
            { icon: Megaphone, title: 'Contractors', price: '$0 to $299/mo', body: 'Join the network free, or add business resources and member pricing.', href: '#memberships', cta: 'See memberships' },
            { icon: Camera, title: 'Photo and video', price: `From ${formatUsd(Math.min(...MEDIA_SERVICES.map((s) => s.priceCents), ...MEDIA_PACKAGES.map((p) => p.priceCents)))}`, body: 'Jobsite, branding, real estate, and drone photography plus short video.', href: '#media', cta: 'See media pricing' },
          ].map((c) => (
            <div key={c.title} className="flex flex-col rounded-2xl border border-mkt-ink/10 p-6">
              <c.icon className="h-6 w-6 text-lw-rust" />
              <p className="mt-4 text-sm font-semibold text-mkt-ink/60">{c.title}</p>
              <p className="mt-1 text-3xl font-bold">{c.price}</p>
              <p className="mt-2 flex-1 text-sm text-mkt-ink/70">{c.body}</p>
              <Link href={c.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lw-rust hover:underline">
                {c.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="memberships" className="scroll-mt-24 bg-mailer-black py-16 text-white md:py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold md:text-4xl">Contractor memberships</h2>
          <p className="mb-10 mt-3 max-w-2xl text-white/65">
            Every contractor is reviewed by ListWorx before getting referrals. Pick the plan that fits where your business is today. You can change it
            anytime.
          </p>
          <MembershipComparison
            ctaFor={(id) => ({ href: '/apply', label: id === 'network' ? 'Join free' : id === 'growth' ? 'Apply for Growth' : 'Apply for Business Pro' })}
          />
          <IronCladCallout
            tone="dark"
            className="mt-10"
            title="Every plan, same IronClad Standards"
            body="Network, Growth, and Business Pro members all agree to the IronClad Standards and are reviewed before approval. Paying more never buys referral placement, approval, or IronClad Certification."
          />
        </div>
      </section>

      <section id="media" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-12 md:py-14">
        <h2 className="text-3xl font-bold md:text-4xl">ListWorx Media Services</h2>
        <p className="mt-3 max-w-2xl text-mkt-ink/70">
          Paid up front when you book. Growth members save 5% and Business Pro members save 10%, applied automatically when you&apos;re signed in.
        </p>
        <PhotoStrip
          className="mt-8"
          photos={[
            { ...LIB.videoCrew, caption: 'Branding and short-form video' },
            { ...LIB.photographer, caption: 'Real estate photography' },
            { ...LIB.drone, caption: 'Drone photography' },
            { ...LIB.kitchenWhite, caption: 'Finished-project photos' },
          ]}
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-mkt-ink/10 p-6">
            <p className="font-bold">Contractor packages</p>
            <ul className="mt-4 space-y-3 text-sm">
              {MEDIA_PACKAGES.map((p) => (
                <li key={p.code} className="flex items-start justify-between gap-4">
                  <span>
                    <span className="font-semibold">{p.name}</span>
                    <span className="block text-mkt-ink/60">{p.includes.slice(0, 3).join(', ')}</span>
                  </span>
                  <span className="whitespace-nowrap font-bold">{formatUsd(p.priceCents)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-mkt-ink/10 p-6">
            <p className="font-bold">Single services</p>
            <ul className="mt-4 space-y-3 text-sm">
              {MEDIA_SERVICES.map((s) => (
                <li key={s.code} className="flex items-start justify-between gap-4">
                  <span className="font-semibold">{s.name}</span>
                  <span className="whitespace-nowrap font-bold">{formatUsd(s.priceCents)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-mkt-ink/55">Add-ons like drone photos, extra edited photos, a social reel, or an extra hour are added at booking.</p>
          </div>
        </div>
        <Link href="/media-services" className="mt-6 inline-flex items-center gap-2 rounded-md bg-lw-rust px-5 py-2.5 font-semibold text-white hover:bg-lw-rust-hover">
          See all media services <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="bg-mkt-ink/[0.03] py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold">For realtors: Listing Studio</h2>
          <p className="mt-2 max-w-2xl text-mkt-ink/70">
            Contractor requests are always free for agents. Listing Studio is an optional marketing tool for your listings, with its own monthly plans.
          </p>
          <Link href="/listing-studio" className="mt-4 inline-flex items-center gap-1.5 font-semibold text-lw-rust hover:underline">
            See Listing Studio plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12 md:py-14">
        <h2 className="text-2xl font-bold">Common questions</h2>
        <div className="mt-6 divide-y divide-mkt-ink/10">
          {FAQ.map((f) => (
            <div key={f.q} className="py-5">
              <p className="flex items-start gap-2 font-semibold">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-lw-rust" />
                {f.q}
              </p>
              <p className="mt-2 pl-7 text-mkt-ink/70">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
