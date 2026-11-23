import Link from 'next/link';
import { ArrowRight, Camera, CircleCheck as CheckCircle, Clock, CreditCard, CalendarCheck } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { pageMetadata } from '@/lib/seo';
import { MEDIA_ADDONS, MEDIA_PACKAGES, MEDIA_SERVICES, formatUsd } from '@/lib/media/catalog';
import Brushstroke from '@/components/brand/Brushstroke';
import HeroPhoto from '@/components/brand/HeroPhoto';
import PhotoStrip from '@/components/brand/PhotoStrip';
import { LIB } from '@/lib/brand/photos';

export const metadata = pageMetadata({
  title: 'ListWorx Media Services: Contractor and Real Estate Photography and Video',
  description:
    'Professional jobsite, branding, real estate, and drone photography plus short-form video for contractors and realtors in Middle Tennessee. Clear package pricing, member discounts, and online booking.',
  path: '/media-services',
});

const STEPS = [
  { icon: Camera, title: 'Pick a service', desc: 'Choose a package or a single service, plus any add-ons.' },
  { icon: Clock, title: 'Request a time', desc: 'Pick an open date and start time from our calendar.' },
  { icon: CreditCard, title: 'Pay up front', desc: 'Secure checkout through Stripe. Members see their discount before paying.' },
  { icon: CalendarCheck, title: 'Get confirmed', desc: 'We confirm your appointment by email or suggest another time.' },
];

export default function MediaServicesPage() {
  return (
    <div className="min-h-screen bg-mailer-black text-white">
      <Navigation />

      <section className="relative isolate overflow-hidden bg-mailer-black pb-14 pt-12 md:pb-16 md:pt-16">
        <HeroPhoto src={LIB.videoCrew.src} position="60% 40%" />
        <Brushstroke variant="corner" className="pointer-events-none absolute left-0 top-0 z-10 w-[110px] md:w-[180px]" />
        <div className="absolute left-0 top-0 h-1 w-full bg-lw-rust" />
        <div className="container mx-auto max-w-5xl px-4">
          <p className="lw-label mb-3">ListWorx Media Services</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Look as good online as you are on the job.</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">
            Jobsite, branding, real estate, and drone photography plus short-form video for contractors and realtors. Clear prices,
            online booking, and member discounts.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/media-services/book" className="inline-flex items-center gap-2 rounded-md bg-lw-rust px-6 py-3 font-semibold text-white hover:bg-lw-rust-hover">
              Book a shoot <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="mailto:adeyo@listworx.co?subject=Custom%20media%20quote"
              className="inline-flex items-center gap-2 rounded-md border-2 border-lw-rust px-6 py-3 font-semibold text-white hover:bg-lw-rust/10"
            >
              Request a custom quote
            </a>
          </div>
          <p className="mt-6 text-sm text-white/55">
            ListWorx members save on every eligible service: <strong className="text-white">Growth 5%</strong>,{' '}
            <strong className="text-white">Business Pro 10%</strong>. Discounts are applied automatically when you&apos;re signed in.
          </p>
        </div>
      </section>

      <section className="bg-mailer-black pb-12 md:pb-14">
        <div className="container mx-auto max-w-6xl px-4">
          <PhotoStrip
            photos={[
              { ...LIB.photographer, caption: 'Real estate photography' },
              { ...LIB.drone, caption: 'Drone photography' },
              { ...LIB.paintCrew1, caption: 'Contractor branding' },
              { ...LIB.kitchenDark, caption: 'Finished-project photos' },
            ]}
          />
        </div>
      </section>

      <section className="bg-mailer-ink py-12 md:py-14">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold md:text-4xl">Contractor packages</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {MEDIA_PACKAGES.map((p, i) => (
              <div key={p.code} className={`flex flex-col rounded-2xl border bg-mailer-card p-7 ${i === 1 ? 'border-lw-rust' : 'border-mailer-border'}`}>
                <h3 className="text-lg font-bold">{p.name}</h3>
                <div className="mt-3 text-4xl font-bold">{formatUsd(p.priceCents)}</div>
                <p className="mt-3 text-sm text-white/65">{p.summary}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-white/75">
                  {p.includes.map((line) => (
                    <li key={line} className="flex items-start gap-2.5">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-lw-rust" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/media-services/book?service=${p.code}`} className="mt-6 block rounded-md bg-lw-rust px-4 py-2.5 text-center text-sm font-semibold hover:bg-lw-rust-hover">
                  Book {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-mailer-black py-12 md:py-14">
        <div className="container mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">À la carte services</h2>
            <p className="mt-2 text-sm text-white/55">For contractors and realtors. Book on its own.</p>
            <ul className="mt-6 divide-y divide-mailer-border rounded-2xl border border-mailer-border bg-mailer-card">
              {MEDIA_SERVICES.map((s) => (
                <li key={s.code} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-white/60">{s.summary}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">{formatUsd(s.priceCents)}</span>
                    <Link href={`/media-services/book?service=${s.code}`} className="whitespace-nowrap rounded-md border-2 border-lw-rust px-4 py-1.5 text-sm font-semibold hover:bg-lw-rust/10">
                      Book
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-bold">Add-ons</h2>
            <p className="mt-2 text-sm text-white/55">Added to a package or service at booking. Not sold on their own.</p>
            <ul className="mt-6 divide-y divide-mailer-border rounded-2xl border border-mailer-border bg-mailer-card">
              {MEDIA_ADDONS.map((a) => (
                <li key={a.code} className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-sm text-white/60">{a.summary}</p>
                  </div>
                  <span className="text-lg font-bold">{formatUsd(a.priceCents)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-mailer-border bg-mailer-card/60 p-5 text-sm text-white/65">
              <p className="font-semibold text-white">Need something else?</p>
              <p className="mt-1">
                Multiple locations, larger projects, or real estate listing shoots outside these packages?{' '}
                <a className="font-semibold text-lw-rust underline" href="mailto:adeyo@listworx.co?subject=Custom%20media%20quote">
                  Request a custom quote
                </a>
                .
              </p>
              <p className="mt-3 text-white/50">Matterport 3D scanning is not available yet.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-mailer-ink py-12 md:py-14">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold">How booking works</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-mailer-border bg-mailer-card p-6">
                <s.icon className="h-6 w-6 text-lw-rust" />
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white/40">Step {i + 1}</p>
                <p className="mt-1 font-semibold">{s.title}</p>
                <p className="mt-1 text-sm text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-sm text-white/55">
            All media services are paid 100% up front. Your requested time is held for you while you check out, and it is not final until we
            confirm it. Drone work happens only where it is legally permitted and operationally feasible. If we can&apos;t find a time that works for
            you, we&apos;ll cancel and refund your order.
          </p>
          <p className="mt-3 text-sm text-white/55">
            Already booked?{' '}
            <Link href="/media-services/orders" className="font-semibold text-lw-rust underline">
              See your orders
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
