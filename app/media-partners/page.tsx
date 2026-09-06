'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, ArrowRight, MapPin } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';
import { Reveal } from '@/components/motion';
import { Button } from '@/components/ui/button';
import MediaPartnerRequestButton from '@/components/site/MediaPartnerRequestButton';

interface MediaPartner {
  id: string;
  company_name: string;
  profile_slug: string | null;
  logo_url: string | null;
  blurb: string;
  years_in_business: number | null;
  counties: string[];
  trades: string[];
}

const FILTERS: { label: string; match: (t: string) => boolean }[] = [
  { label: 'All', match: () => true },
  { label: 'Photography', match: (t) => /photograph/i.test(t) },
  { label: 'Video', match: (t) => /video|videograph/i.test(t) },
  { label: 'Drone / Aerial', match: (t) => /drone|aerial/i.test(t) },
  { label: '3D / Virtual', match: (t) => /3d|matterport|virtual|floor plan/i.test(t) },
];

export default function MediaPartnersPage() {
  const [partners, setPartners] = useState<MediaPartner[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState(0);

  useEffect(() => {
    fetch('/api/media-partners')
      .then((r) => r.json())
      .then((d) => setPartners(Array.isArray(d.partners) ? d.partners : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const shown = partners.filter((p) =>
    filter === 0 ? true : p.trades.some((t) => FILTERS[filter].match(t)),
  );

  return (
    <PageShell surface="marketing">
      <Navigation variant="light" />

      <section className="border-b border-zinc-200 bg-white">
        <div className="container mx-auto max-w-3xl px-4 py-16 text-center md:py-20">
          <Reveal>
            <p className="lw-label-lg mb-3 !text-lw-rust">
              <span className="inline-flex items-center gap-2">
                <Camera className="h-4 w-4" /> Listing media
              </span>
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-mkt-ink md:text-5xl">
              Vetted photographers, videographers, and drone operators.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-mkt-ink/70">
              Every media partner is in the ListWorx network. Send a request in-platform — no phone
              tag — and they confirm or decline.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-8 flex flex-wrap gap-2">
          {FILTERS.map((f, i) => (
            <button
              key={f.label}
              onClick={() => setFilter(i)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === i
                  ? 'border-lw-rust bg-lw-rust/10 text-lw-rust'
                  : 'border-zinc-300 text-mkt-ink/60 hover:text-mkt-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!loaded ? (
          <p className="py-16 text-center text-mkt-ink/50">Loading…</p>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
            <p className="text-mkt-ink/70">
              {partners.length === 0
                ? 'No media partners are listed yet — check back soon.'
                : 'No media partners match that filter.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p, i) => (
              <Reveal
                key={p.id}
                delay={i * 50}
                className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {p.logo_url ? (
                    <img
                      src={p.logo_url}
                      alt={p.company_name}
                      className="h-12 w-12 rounded-lg border border-zinc-200 object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                      <Camera className="h-5 w-5 text-mkt-ink/40" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-mkt-ink">{p.company_name}</h3>
                    {p.years_in_business ? (
                      <p className="text-xs text-mkt-ink/50">{p.years_in_business} yrs in business</p>
                    ) : null}
                  </div>
                </div>

                {p.blurb ? (
                  <p className="mt-3 line-clamp-3 text-sm text-mkt-ink/70">{p.blurb}</p>
                ) : null}

                {p.trades.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.trades.slice(0, 4).map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-lw-rust/10 px-2 py-0.5 text-xs text-lw-rust"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {p.counties.length > 0 && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-mkt-ink/50">
                    <MapPin className="h-3.5 w-3.5" />
                    {p.counties.slice(0, 3).join(', ')}
                    {p.counties.length > 3 ? ` +${p.counties.length - 3}` : ''}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <MediaPartnerRequestButton
                    mediaPartnerId={p.id}
                    companyName={p.company_name}
                    size="sm"
                  />
                  {p.profile_slug && (
                    <Link href={`/contractors/${p.profile_slug}`}>
                      <Button variant="outline" size="sm">
                        Profile
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
