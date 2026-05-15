'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Star } from 'lucide-react';

interface FeaturedContractor {
  id: string;
  company_name: string;
  logo_url: string;
  owner_name?: string;
  business_description?: string;
  years_in_business?: number;
  ironclad_certified?: boolean;
  founding_partner?: boolean;
  service_area_counties?: string[];
}

export default function ContractorOfTheWeek() {
  const [contractor, setContractor] = useState<FeaturedContractor | null>(null);

  useEffect(() => {
    fetch('/api/featured-contractors')
      .then(r => r.json())
      .then(d => {
        const list: FeaturedContractor[] = d.contractors || [];
        if (list.length > 0) setContractor(list[0]);
      })
      .catch(() => {});
  }, []);

  if (!contractor) return null;

  const description = contractor.business_description
    ? contractor.business_description.length > 200
      ? contractor.business_description.slice(0, 197) + '...'
      : contractor.business_description
    : null;

  const county = contractor.service_area_counties?.[0];

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white">Contractor of the Week</h2>
        <p className="mt-2 text-zinc-400">Hand-picked from our vetted network</p>
      </div>

      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="bg-[#1a1a1a] px-6 py-5 flex items-center gap-4">
          {contractor.logo_url && (
            <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-zinc-700">
              <Image src={contractor.logo_url} alt={contractor.company_name} fill style={{ objectFit: 'contain' }} />
            </div>
          )}
          <div>
            <h3 className="text-xl font-bold text-white">{contractor.company_name}</h3>
            {contractor.owner_name && (
              <p className="text-sm text-zinc-400">{contractor.owner_name}</p>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {contractor.ironclad_certified && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8621A]/15 border border-[#E8621A]/30 px-3 py-1 text-xs font-semibold text-[#E8621A]">
                <Shield className="h-3 w-3" /> IronClad Certified
              </span>
            )}
            {contractor.founding_partner && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-400">
                <Star className="h-3 w-3" /> Founding Partner
              </span>
            )}
          </div>

          {county && (
            <p className="text-sm text-zinc-400">
              Serving <span className="text-zinc-200">{county}</span>
              {contractor.service_area_counties && contractor.service_area_counties.length > 1 && (
                <span className="text-zinc-500"> +{contractor.service_area_counties.length - 1} more</span>
              )}
            </p>
          )}

          {contractor.years_in_business && (
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-200">{contractor.years_in_business} years</span> in business
            </p>
          )}

          {description && (
            <p className="text-sm text-zinc-300 leading-relaxed">{description}</p>
          )}

          <div className="pt-2">
            <Link href={`/contractor/${contractor.id}`}
              className="inline-flex items-center justify-center rounded-lg bg-[#E8621A] hover:bg-[#d45516] px-5 py-2.5 text-sm font-semibold text-white transition-colors w-full">
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
