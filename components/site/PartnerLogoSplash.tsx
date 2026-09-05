'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion';

interface PromoPartner {
  id: string;
  name: string;
  logo_url: string;
  link_url: string | null;
  is_featured: boolean;
  display_order: number;
}

/**
 * "Trusted by local businesses across Tennessee" — an understated logo strip
 * of businesses helping promote ListWorx (flyer drop-off spots, referral
 * partners). Fully admin-managed via /admin/crm/partners.
 *
 * Renders nothing at all when there are no visible partners — no empty box.
 */
export default function PartnerLogoSplash() {
  const [partners, setPartners] = useState<PromoPartner[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/promo-partners')
      .then((r) => r.json())
      .then((d) => setPartners(Array.isArray(d.partners) ? d.partners : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || partners.length === 0) {
    return null;
  }

  return (
    <section className="border-y border-zinc-200 bg-white py-14 md:py-16">
      <div className="container mx-auto px-4">
        <Reveal>
          <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-mkt-ink/50">
            Trusted by local businesses across Tennessee
          </p>
        </Reveal>

        <Reveal className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-14">
          {partners.map((p) => {
            const img = (
              <img
                src={p.logo_url}
                alt={p.name}
                loading="lazy"
                className={cn(
                  'w-auto object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0',
                  p.is_featured ? 'h-12 max-w-[190px] md:h-16' : 'h-10 max-w-[160px] md:h-12',
                )}
              />
            );

            if (p.link_url) {
              return (
                <a
                  key={p.id}
                  href={p.link_url}
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                  className="inline-flex"
                  aria-label={p.name}
                >
                  {img}
                </a>
              );
            }

            return (
              <span key={p.id} className="inline-flex">
                {img}
              </span>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
