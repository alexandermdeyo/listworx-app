'use client';

import { useRef, useState } from 'react';
import { Shield, MapPin, MoveRight } from 'lucide-react';
import { Reveal } from '@/components/motion';
import JobRequestWidget from './JobRequestWidget';
import { SERVICE_CATEGORIES } from './categories';

export default function HomeownerHero() {
  const [category, setCategory] = useState('');
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleCategoryTileClick = (value: string) => {
    setCategory(value);
    widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      {/* ---------- HERO ---------------------------------------------------- */}
      <section className="relative overflow-hidden border-b border-zinc-200 bg-white">
        {/* warm wash bottom-left, keeps it from feeling clinical */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-lw-rust/[0.07] blur-3xl"
        />

        <div className="container relative mx-auto grid items-center gap-12 px-4 py-16 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          {/* left: copy + live widget */}
          <div className="max-w-2xl">
            <Reveal immediate delay={0}>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-lw-rust/40 bg-lw-rust/10 px-4 py-2 text-sm font-semibold text-lw-rust">
                  <Shield className="mr-2 h-4 w-4" />
                  IronClad Verified Contractors
                </span>
                <span className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-mkt-ink/80">
                  <MapPin className="mr-2 h-4 w-4 text-lw-rust" />
                  Now serving Middle Tennessee
                </span>
              </div>
              <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-mkt-ink md:text-6xl">
                Find the right contractor.
                <span className="block text-lw-rust">Every time.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-mkt-ink/70 md:text-xl">
                Every pro on ListWorx is IronClad Verified — licensed, insured, and
                held to real standards. Describe the job, get matched with up to
                three, and pick who you call.
              </p>
            </Reveal>

            <Reveal immediate delay={120}>
              <div ref={widgetRef} className="mt-8">
                <JobRequestWidget
                  category={category}
                  onCategoryChange={setCategory}
                  className="!mx-0 border border-zinc-200 shadow-[0_18px_40px_-24px_rgba(31,31,31,0.35)]"
                />
                <p className="mt-3 text-sm text-mkt-ink/55">
                  Free for homeowners. No account needed to get matched.
                </p>
              </div>
            </Reveal>
          </div>

          {/* right: the actual product */}
          <Reveal
            immediate
            delay={200}
            className="relative hidden lg:block"
          >
            <div className="lw-figure-zoom relative ml-auto w-full max-w-[600px] overflow-hidden rounded-2xl border border-zinc-200 shadow-[0_40px_80px_-40px_rgba(31,31,31,0.5)]">
              <img
                src="/images/redesign/jobrequest_laptop-screenshot-woman-kitchen.webp"
                alt="A homeowner submitting a job request on ListWorx from her kitchen"
                className="block h-full w-full object-cover"
                loading="eager"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- BROWSE BY TRADE -------------------------------------- */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[0.85fr_1.6fr] md:items-start">
          <Reveal>
            <p className="lw-label mb-3 !text-lw-rust">Browse by trade</p>
            <h2 className="text-2xl font-bold text-mkt-ink md:text-3xl">
              Start with what you need done.
            </h2>
            <p className="mt-3 text-mkt-ink/65">
              Pick a trade to prefill your request — or just describe the project
              in your own words in the box above. Either way you&apos;re matched
              with verified pros only.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SERVICE_CATEGORIES.map((cat, index) => {
              const Icon = cat.icon;
              return (
                <Reveal key={cat.value} delay={index * 35}>
                  <button
                    type="button"
                    onClick={() => handleCategoryTileClick(cat.value)}
                    className="lw-hover-lift group flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-4 text-left transition-colors hover:border-lw-rust"
                  >
                    <Icon className="h-6 w-6 shrink-0 text-lw-rust" />
                    <span className="text-sm font-semibold text-mkt-ink">
                      {cat.label}
                    </span>
                    <MoveRight className="ml-auto h-4 w-4 shrink-0 text-mkt-ink/0 transition-colors group-hover:text-lw-rust" />
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
