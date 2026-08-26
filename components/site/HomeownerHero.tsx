'use client';

import { useRef, useState } from 'react';
import { Shield } from 'lucide-react';
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
      <section className="relative overflow-hidden py-24 text-center md:py-32">
        <img
          src="/Hero_Handshake.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <div
          className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, #FFFFFF 100%)' }}
          aria-hidden="true"
        />
        <div className="relative z-10 container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <Reveal immediate delay={0}>
              <div className="mb-6 inline-flex items-center rounded-full border border-lw-rust/40 bg-lw-rust/15 px-4 py-2 text-sm font-semibold text-lw-rust">
                <Shield className="mr-2 h-4 w-4" />
                IronClad Verified Contractors
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
                Find the Right Contractor. Every Time.
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg md:text-xl text-white/80 leading-relaxed">
                Every pro on ListWorx is IronClad Verified — licensed, insured, and held to real standards.
              </p>
            </Reveal>
            <Reveal immediate delay={120}>
              <div ref={widgetRef}>
                <JobRequestWidget category={category} onCategoryChange={setCategory} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <Reveal as="h2" className="mb-8 text-center text-2xl md:text-3xl font-bold text-mkt-ink">
          Popular Categories
        </Reveal>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {SERVICE_CATEGORIES.map((cat, index) => {
            const Icon = cat.icon;
            return (
              <Reveal key={cat.value} delay={index * 40}>
                <button
                  type="button"
                  onClick={() => handleCategoryTileClick(cat.value)}
                  className="lw-hover-lift flex w-full flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-center transition-colors hover:border-lw-rust"
                >
                  <Icon className="h-7 w-7 text-lw-rust" />
                  <span className="text-sm font-medium text-mkt-ink">{cat.label}</span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
