'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageShell } from '@/components/design-system';
import {
  Loader as Loader2,
  Plus,
  MapPin,
  Clock3,
  User as User2,
  Building2,
  Mail,
  Phone,
  Globe,
} from 'lucide-react';

type JobRequest = {
  id: string;
  requestor_profile_id: string | null;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requester_type: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_county: string | null;
  job_description: string | null;
  urgency: string | null;
  status: string | null;
  created_at: string | null;
};

type Contractor = {
  id: string;
  company_name: string | null;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  bio: string | null;
};

type Referral = {
  id: string;
  job_request_id: string;
  contractor_id: string;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  contractor: Contractor | null;
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

export default function RequestorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/requestor-dashboard', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load dashboard.');
      }

      setJobRequests(Array.isArray(data?.requests) ? data.requests : []);
      setReferrals(Array.isArray(data?.referrals) ? data.referrals : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }

  const referralsByRequest = useMemo(() => {
    const map = new Map<string, Referral[]>();

    for (const referral of referrals) {
      const existing = map.get(referral.job_request_id) || [];
      existing.push(referral);
      map.set(referral.job_request_id, existing);
    }

    return map;
  }, [referrals]);

  const totalRequests = jobRequests.length;

  const activeRequests = jobRequests.filter(
    (r) => r.status && !['COMPLETED', 'CANCELLED', 'CLOSED'].includes(r.status.toUpperCase())
  ).length;

  const contractorSelected = jobRequests.filter(
    (r) => (referralsByRequest.get(r.id) || []).length > 0
  ).length;

  function formatUrgency(value: string | null) {
    if (!value) return '';
    if (value === 'IMMEDIATE') return 'Immediate';
    if (value === 'WITHIN_WEEK') return 'Within 1 week';
    if (value === 'WITHIN_MONTH') return 'Within 1 month';
    if (value === 'FLEXIBLE') return 'Flexible';
    return value;
  }

  return (
    <PageShell surface="dark">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
                Requestor Dashboard
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
                My Requests
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                View your contractor referrals and request history.
              </p>
            </div>

            <Link href="/request" className="w-full md:w-auto">
              <Button className="w-full md:w-auto bg-lw-rust hover:bg-lw-rust-hover text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </Link>
          </div>

          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Total Requests</div>
              <div className="text-5xl font-bold text-foreground">{totalRequests}</div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Active</div>
              <div className="text-5xl font-bold text-foreground">{activeRequests}</div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-muted-foreground mb-2">Contractor Matches</div>
              <div className="text-5xl font-bold text-foreground">{contractorSelected}</div>
            </Card>
          </div>

          {loading ? (
            <Card className="p-10">
              <div className="flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading requests...
              </div>
            </Card>
          ) : jobRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-6">No requests yet.</p>
              <Link href="/request">
                <Button className="bg-lw-rust hover:bg-lw-rust-hover text-white">
                  Request a Contractor
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-6">
              {jobRequests.map((job) => {
                const jobReferrals = referralsByRequest.get(job.id) || [];

                return (
                  <Card key={job.id} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground mb-2 break-words">
                          {job.property_address}, {job.property_city}, {job.property_state}
                        </h2>

                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.property_county}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-4 w-4" />
                            {formatUrgency(job.urgency)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <User2 className="h-4 w-4" />
                            {job.requester_type}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {job.created_at
                          ? new Date(job.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : ''}
                      </div>
                    </div>

                    <div className="mb-5">
                      <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                        Job Description
                      </p>
                      <p className="text-foreground/80 whitespace-pre-line">
                        {job.job_description}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
                        Matched Contractors
                      </p>

                      {jobReferrals.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border p-4 text-muted-foreground">
                          Your request is saved. No referrals have been attached yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {jobReferrals.map((referral, index) => {
                            const contractor = referral.contractor;
                            const profileHref = contractor?.id
                              ? `/contractors/${contractor.id}`
                              : '#';

                            return (
                              <div
                                key={referral.id}
                                className="rounded-xl border border-border p-4 bg-muted/30 hover:shadow-md transition"
                              >
                                <div className="flex items-center justify-between gap-2 mb-3">
                                  {contractor?.id ? (
                                    <Link
                                      href={profileHref}
                                      className="text-sm font-semibold text-foreground hover:underline break-words"
                                    >
                                      {contractor.company_name || 'Contractor'}
                                    </Link>
                                  ) : (
                                    <div className="text-sm font-semibold text-foreground break-words">
                                      {contractor?.company_name || 'Contractor'}
                                    </div>
                                  )}

                                  <div className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                                    Match {index + 1}
                                  </div>
                                </div>

                                <div className="space-y-2 text-sm text-muted-foreground">
                                  {contractor?.owner_name && (
                                    <div className="inline-flex items-center gap-1">
                                      <Building2 className="h-4 w-4 shrink-0" />
                                      <span className="break-words">{contractor.owner_name}</span>
                                    </div>
                                  )}

                                  {contractor?.email && (
                                    <a
                                      href={`mailto:${contractor.email}`}
                                      className="flex items-start gap-2 break-all hover:text-foreground"
                                    >
                                      <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                                      <span>{contractor.email}</span>
                                    </a>
                                  )}

                                  {contractor?.phone && (
                                    <a
                                      href={normalizePhoneHref(contractor.phone)}
                                      className="flex items-start gap-2 hover:text-foreground"
                                    >
                                      <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                                      <span>{contractor.phone}</span>
                                    </a>
                                  )}

                                  {contractor?.website && (
                                    <a
                                      href={normalizeWebsiteUrl(contractor.website)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-start gap-2 break-all hover:text-foreground"
                                    >
                                      <Globe className="h-4 w-4 mt-0.5 shrink-0" />
                                      <span>{contractor.website}</span>
                                    </a>
                                  )}

                                  {contractor?.bio && (
                                    <p className="pt-2 text-xs text-muted-foreground whitespace-pre-line">
                                      {contractor.bio}
                                    </p>
                                  )}
                                </div>

                                {contractor?.id && (
                                  <Link href={profileHref} className="block mt-4">
                                    <Button className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white">
                                      View Full Profile
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}