'use client';

import { useEffect, useState } from 'react';
import { Reveal } from '@/components/motion';

interface LogoItem {
  id: string;
  name: string;
  logo_url: string;
  link_url: string | null;
}

/**
 * Two auto-scrolling logo rows near the top of the homepage:
 *   1. Companies ListWorx partners / markets with  (admin: /admin/crm/partners)
 *   2. Contractors in the network an admin has chosen to feature
 *      (admin: /admin/crm/contractors → "Feature on Homepage")
 *
 * Each row is a CSS marquee (pauses on hover, falls back to a static wrap for
 * reduced motion — see .lw-marquee in globals.css). A row is hidden when it has
 * no logos; the whole section is hidden when both are empty.
 */
export default function HomepageTrustBars() {
  const [partners, setPartners] = useState<LogoItem[]>([]);
  const [pros, setPros] = useState<LogoItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/promo-partners').then((r) => r.json()),
      fetch('/api/featured-contractors').then((r) => r.json()),
    ]).then(([p, c]) => {
      if (p.status === 'fulfilled' && Array.isArray(p.value?.partners)) {
        setPartners(
          p.value.partners.map((x: any) => ({
            id: String(x.id),
            name: x.name ?? '',
            logo_url: x.logo_url,
            link_url: x.link_url ?? null,
          })),
        );
      }
      if (c.status === 'fulfilled' && Array.isArray(c.value?.contractors)) {
        setPros(
          c.value.contractors.map((x: any) => ({
            id: String(x.id),
            name: x.company_name ?? '',
            logo_url: x.logo_url,
            link_url: x.link_url ?? null,
          })),
        );
      }
      setLoaded(true);
    });
  }, []);

  if (!loaded || (partners.length === 0 && pros.length === 0)) {
    return null;
  }

  return (
    <section className="border-b border-zinc-200 bg-white py-12 md:py-16">
      <div className="container mx-auto px-4">
        {partners.length > 0 && (
          <Reveal className={pros.length > 0 ? 'mb-12' : ''}>
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-mkt-ink/50">
              Companies we partner with
            </p>
            <LogoMarquee items={partners} durationSeconds={Math.max(24, partners.length * 6)} />
          </Reveal>
        )}

        {pros.length > 0 && (
          <Reveal>
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-mkt-ink/50">
              Contractors in the ListWorx network
            </p>
            <LogoMarquee items={pros} durationSeconds={Math.max(24, pros.length * 6)} />
          </Reveal>
        )}
      </div>
    </section>
  );
}

function LogoMarquee({
  items,
  durationSeconds,
}: {
  items: LogoItem[];
  durationSeconds: number;
}) {
  const group = (clone: boolean) => (
    <div
      className="lw-marquee__group"
      {...(clone ? { 'data-clone': '', 'aria-hidden': true } : {})}
    >
      {items.map((it, i) => {
        const img = (
          <img
            src={it.logo_url}
            alt={it.name}
            loading="lazy"
            className="h-10 w-auto max-w-[150px] object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 md:h-12 md:max-w-[180px]"
          />
        );
        const key = `${clone ? 'c' : 'o'}-${it.id}-${i}`;
        return it.link_url ? (
          <a
            key={key}
            href={it.link_url}
            target="_blank"
            rel="noreferrer noopener nofollow"
            className="inline-flex shrink-0"
            aria-label={it.name}
          >
            {img}
          </a>
        ) : (
          <span key={key} className="inline-flex shrink-0">
            {img}
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="lw-marquee">
      <div
        className="lw-marquee__track"
        style={{ ['--lw-marquee-duration' as string]: `${durationSeconds}s` }}
      >
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
