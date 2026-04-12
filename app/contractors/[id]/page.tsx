'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageShell } from '@/components/design-system';
import {
  Loader as Loader2,
  Mail,
  Phone,
  Globe,
  Building2,
  ArrowLeft,
  MapPin,
} from 'lucide-react';

type ContractorProfile = {
  id: string;
  company_name?: string | null;
  owner_name?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  bio?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  service_area_state?: string | null;
  partner_status?: string | null;
};

function normalizeWebsiteUrl(website: string) {
  if (!website) return '#';
  return website.startsWith('http://') || website.startsWith('https://')
    ? website
    : `https://${website}`;
}

function normalizePhoneHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, '')}`;
}

export default function ContractorProfilePage() {
  const params = useParams();
  const contractorId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contractor, setContractor] = useState<ContractorProfile | null>(null);

  useEffect(() => {
    if (contractorId) {
      void loadContractor();
    }
  }, [contractorId]);

  async function loadContractor() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/contractors/${contractorId}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load contractor profile.');
      }

      setContractor(data?.contractor || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load contractor profile.');
    } finally {
      setLoading(false);
    }
  }

  const locationLine = [
    contractor?.city,
    contractor?.state || contractor?.service_area_state,
    contractor?.zip_code,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <PageShell surface="dark">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/requestor-dashboard">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>

            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
              Contractor Profile
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {contractor?.company_name || 'Contractor'}
            </h1>
          </div>

          {loading ? (
            <Card className="p-10">
              <div className="flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading contractor profile...
              </div>
            </Card>
          ) : error ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          ) : !contractor ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">
                Contractor not found.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  About
                </h2>

                {contractor.bio ? (
                  <p className="text-muted-foreground whitespace-pre-line leading-7">
                    {contractor.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    No company description has been added yet.
                  </p>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Contact
                </h2>

                <div className="space-y-4 text-sm">
                  {contractor.owner_name && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{contractor.owner_name}</span>
                    </div>
                  )}

                  {contractor.email && (
                    <a
                      href={`mailto:${contractor.email}`}
                      className="flex items-start gap-2 text-muted-foreground hover:text-foreground break-all"
                    >
                      <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{contractor.email}</span>
                    </a>
                  )}

                  {contractor.phone && (
                    <a
                      href={normalizePhoneHref(contractor.phone)}
                      className="flex items-start gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{contractor.phone}</span>
                    </a>
                  )}

                  {contractor.website && (
                    <a
                      href={normalizeWebsiteUrl(contractor.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-muted-foreground hover:text-foreground break-all"
                    >
                      <Globe className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{contractor.website}</span>
                    </a>
                  )}

                  {locationLine && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{locationLine}</span>
                    </div>
                  )}

                  {contractor.partner_status && (
                    <div className="pt-2">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        {contractor.partner_status}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}