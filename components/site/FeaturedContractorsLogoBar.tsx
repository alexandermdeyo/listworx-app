'use client';

import { useEffect, useState } from 'react';

interface FeaturedContractor {
  id: string;
  company_name: string;
  logo_url: string;
}

export default function FeaturedContractorsLogoBar() {
  const [featuredContractors, setFeaturedContractors] = useState([] as FeaturedContractor[]);

  useEffect(() => {
    fetch('/api/featured-contractors')
      .then(r => r.json())
      .then(d => setFeaturedContractors(d.contractors || []))
      .catch((_e) => {});
  }, []);

  if (featuredContractors.length === 0) return null;

  return (
    <section className="py-8 md:py-10 bg-lw-surface-card border-y border-lw-border-light">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          Trusted by vetted local contractors
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
          {featuredContractors.map(c => (
            <img
              key={c.id}
              src={c.logo_url}
              alt={c.company_name}
              className="h-12 md:h-16 w-auto max-w-[160px] object-contain opacity-80 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
