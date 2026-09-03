'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { PageShell } from '@/components/design-system';
import {
  Loader as Loader2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Briefcase,
  Shield,
  Award,
  Clock,
  ExternalLink,
  Building2,
  Star,
} from 'lucide-react';
import { Reveal } from '@/components/motion';

interface ContractorPublicProfile {
  id: string;
  company_name: string;
  owner_name: string;
  email: string;
  phone: string;
  website: string | null;
  bio: string | null;
  business_description: string | null;
  business_website: string | null;
  google_business_url: string | null;
  logo_url: string | null;
  years_in_business: number | null;
  founding_partner: boolean;
  ironclad_certified: boolean;
  ironclad_accepted: boolean;
  partner_status: string;
  tier: string | null;
  created_at: string;
  counties: Array<{ id: string; name: string; state_code: string }>;
  trades: Array<{ id: string; name: string }>;
}

function getTierLabel(tier: string | null): string | null {
  if (!tier || tier === 'none') return null;
  const t = tier.toLowerCase();
  if (t.includes('elite')) return 'Network Elite';
  if (t.includes('preferred')) return 'Network Partner';
  if (t.includes('basic')) return 'Network Member';
  return null;
}

export default function ContractorPublicProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [profile, setProfile] = useState<ContractorPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/contractor-profile?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error || !data.profile) {
          setNotFound(true);
        } else {
          setProfile(data.profile);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <PageShell surface="marketing">
        <Navigation variant="light" />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-lw-rust" />
        </div>
      </PageShell>
    );
  }

  if (notFound || !profile) {
    return (
      <PageShell surface="marketing">
        <Navigation variant="light" />
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4 text-mkt-ink">Contractor Not Found</h1>
          <p className="text-mkt-ink/70 mb-8">
            This contractor profile is not available or has not been published yet.
          </p>
          <Link href="/contractors">
            <Button>Browse All Contractors</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const displayWebsite = profile.business_website || profile.website;
  const description = profile.business_description || profile.bio;
  const tierLabel = getTierLabel(profile.tier);

  const countiesByState: Record<string, string[]> = {};
  profile.counties.forEach((c) => {
    if (!countiesByState[c.state_code]) countiesByState[c.state_code] = [];
    countiesByState[c.state_code].push(c.name);
  });

  return (
    <PageShell surface="marketing">
      <Navigation variant="light" />

      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Reveal immediate delay={0} className="flex items-start gap-6">
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt={profile.company_name}
                  className="h-20 w-20 rounded-xl border border-zinc-200 bg-white p-1.5 object-contain flex-shrink-0"
                />
              ) : (
                <div className="h-20 w-20 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-8 w-8 text-mkt-ink/50" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold text-mkt-ink">
                    {profile.company_name}
                  </h1>
                </div>

                <p className="text-mkt-ink/70 mb-3">{profile.owner_name}</p>

                <div className="flex flex-wrap gap-2">
                  {profile.ironclad_certified && (
                    <Badge className="bg-red-600/10 text-red-600 border-red-600/20 gap-1">
                      <Shield className="h-3 w-3" />
                      IronClad Certified
                    </Badge>
                  )}
                  {profile.founding_partner && (
                    <Badge className="bg-amber-600/10 text-amber-700 border-amber-600/20 gap-1">
                      <Award className="h-3 w-3" />
                      Founding Partner
                    </Badge>
                  )}
                  {tierLabel && (
                    <Badge className="bg-lw-rust/10 text-lw-rust border-lw-rust/20 gap-1">
                      <Star className="h-3 w-3" />
                      {tierLabel}
                    </Badge>
                  )}
                </div>
              </div>
            </Reveal>

            {description && (
              <Reveal delay={70}>
                <Card className="p-6 bg-white border-zinc-200 text-mkt-ink shadow-sm">
                  <h2 className="text-lg font-semibold mb-3 text-mkt-ink">About</h2>
                  <p className="text-mkt-ink/70 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </Card>
              </Reveal>
            )}

            {profile.trades.length > 0 && (
              <Reveal delay={140}>
                <Card className="p-6 bg-white border-zinc-200 text-mkt-ink shadow-sm">
                  <h2 className="text-lg font-semibold mb-3 text-mkt-ink">Trade Specialties</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.trades.map((trade) => (
                      <Badge key={trade.id} className="gap-1.5 border-zinc-200 bg-white text-mkt-ink/70">
                        <Briefcase className="h-3 w-3" />
                        {trade.name}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </Reveal>
            )}

            {Object.keys(countiesByState).length > 0 && (
              <Reveal delay={210}>
                <Card className="p-6 bg-white border-zinc-200 text-mkt-ink shadow-sm">
                  <h2 className="text-lg font-semibold mb-3 text-mkt-ink">Service Areas</h2>
                  <div className="space-y-4">
                    {Object.entries(countiesByState).map(([stateCode, counties]) => (
                      <div key={stateCode}>
                        <p className="text-sm font-medium text-mkt-ink mb-2">{stateCode}</p>
                        <div className="flex flex-wrap gap-2">
                          {counties.sort().map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-mkt-ink/70"
                            >
                              <MapPin className="h-3 w-3" />
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Reveal>
            )}
          </div>

          <div className="space-y-6">
            <Reveal immediate delay={100}>
            <Card className="p-6 bg-white border-zinc-200 text-mkt-ink shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-mkt-ink">Contact Information</h2>
              <div className="space-y-4">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-3 text-sm text-mkt-ink hover:text-lw-rust transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-lw-rust/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 text-lw-rust" />
                    </div>
                    <span>{profile.phone}</span>
                  </a>
                )}

                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-3 text-sm text-mkt-ink hover:text-lw-rust transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-lw-rust/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 text-lw-rust" />
                    </div>
                    <span className="break-all">{profile.email}</span>
                  </a>
                )}

                {displayWebsite && (
                  <a
                    href={displayWebsite.startsWith('http') ? displayWebsite : `https://${displayWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-mkt-ink hover:text-lw-rust transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-lw-rust/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="h-4 w-4 text-lw-rust" />
                    </div>
                    <span className="break-all">{displayWebsite}</span>
                  </a>
                )}

                {profile.google_business_url && (
                  <a
                    href={profile.google_business_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-mkt-ink hover:text-lw-rust transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-lw-rust/10 flex items-center justify-center flex-shrink-0">
                      <ExternalLink className="h-4 w-4 text-lw-rust" />
                    </div>
                    <span>Google Business Profile</span>
                  </a>
                )}
              </div>

              <div className="mt-6">
                <Link href="/request">
                  <Button className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white">
                    Request This Contractor
                  </Button>
                </Link>
              </div>
            </Card>
            </Reveal>

            <Reveal delay={70}>
              <Card className="p-6 bg-white border-zinc-200 text-mkt-ink shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-mkt-ink">Quick Facts</h2>
                <div className="space-y-3">
                  {profile.years_in_business != null && profile.years_in_business > 0 && (
                    <div className="flex items-center gap-3 text-sm text-mkt-ink/80">
                      <Clock className="h-4 w-4 text-mkt-ink/50" />
                      <span>{profile.years_in_business} years in business</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-mkt-ink/80">
                    <MapPin className="h-4 w-4 text-mkt-ink/50" />
                    <span>{profile.counties.length} counties served</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-mkt-ink/80">
                    <Briefcase className="h-4 w-4 text-mkt-ink/50" />
                    <span>{profile.trades.length} trade specialties</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-mkt-ink/80">
                    <Shield className="h-4 w-4 text-mkt-ink/50" />
                    <span>
                      Member since{' '}
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </Card>
            </Reveal>

            {(profile.ironclad_certified || profile.founding_partner) && (
              <Reveal delay={140}>
                <Card className="p-6 bg-white border-zinc-200 text-mkt-ink shadow-sm">
                  <h2 className="text-lg font-semibold mb-4 text-mkt-ink">Certifications</h2>
                  <div className="space-y-4">
                    {profile.ironclad_certified && (
                      <div className="flex items-center gap-3">
                        <Image
                          src="/Ironclad_Cert_Partner_Final_Logo.png"
                          alt="IronClad Certified"
                          width={48}
                          height={48}
                          className="flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-semibold text-mkt-ink">IronClad Certified</p>
                          <p className="text-xs text-mkt-ink/60">Vetted, verified, accountable</p>
                        </div>
                      </div>
                    )}
                    {profile.founding_partner && (
                      <div className="flex items-center gap-3">
                        <Image
                          src="/ironclad_founder_shield_logo.png"
                          alt="Founding Partner"
                          width={48}
                          height={48}
                          className="flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-semibold text-mkt-ink">Founding Partner</p>
                          <p className="text-xs text-mkt-ink/60">Original network member</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
