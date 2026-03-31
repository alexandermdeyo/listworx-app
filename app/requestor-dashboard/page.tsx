'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader as Loader2, Plus, MapPin, Clock3, User as User2, Building2 } from 'lucide-react';

type JobRequest = {
  id: string;
  realtor_id: string | null;
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

type ContractorProfile = {
  id: string;
  company_name: string | null;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
};

type Referral = {
  id: string;
  job_request_id: string;
  contractor_id: string;
  status: string | null;
  tier_at_referral: string | null;
  contractor_profiles: ContractorProfile | ContractorProfile[] | null;
};

export default function RequestorDashboardPage() {
  const supabase = createClient();

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
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user?.id) {
        throw new Error('You must be logged in.');
      }

      const userId = session.user.id;

      const { data: realtorProfile } = await supabase
        .from('realtor_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!realtorProfile) {
        setJobRequests([]);
        setReferrals([]);
        return;
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from('job_requests')
        .select('*')
        .eq('realtor_id', realtorProfile.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      const requests: JobRequest[] = (requestsData ?? []).map((row: any) => ({
        id: row.id,
        realtor_id: row.realtor_id ?? null,
        requester_name: row.requester_name ?? null,
        requester_email: row.requester_email ?? null,
        requester_phone: row.requester_phone ?? null,
        requester_type: row.requester_type ?? null,
        property_address: row.property_address ?? null,
        property_city: row.property_city ?? null,
        property_state: row.property_state ?? null,
        property_county: row.property_county ?? null,
        job_description: row.job_description ?? null,
        urgency: row.urgency ?? null,
        status: row.status ?? null,
        created_at: row.created_at ?? null,
      }));

      setJobRequests(requests);

      if (requests.length === 0) {
        setReferrals([]);
        return;
      }

      const requestIds = requests.map((r) => r.id);

      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          job_request_id,
          contractor_id,
          status,
          tier_at_referral,
          contractor_profiles (
            id,
            company_name,
            owner_name,
            email,
            phone
          )
        `)
        .in('job_request_id', requestIds)
        .order('created_at', { ascending: true });

      if (referralsError) throw referralsError;

      const normalizedReferrals: Referral[] = (referralsData ?? []).map((row: any) => ({
        id: row.id,
        job_request_id: row.job_request_id,
        contractor_id: row.contractor_id,
        status: row.status ?? null,
        tier_at_referral: row.tier_at_referral ?? null,
        contractor_profiles: row.contractor_profiles ?? null,
      }));

      setReferrals(normalizedReferrals);
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

  const contractorSelected = jobRequests.filter((r) =>
    (referralsByRequest.get(r.id) || []).some((ref) =>
      ['ACCEPTED', 'CONTACTED', 'COMPLETED'].includes((ref.status || '').toUpperCase())
    )
  ).length;

  function getContractorProfile(
    contractorProfiles: ContractorProfile | ContractorProfile[] | null
  ): ContractorProfile | null {
    if (!contractorProfiles) return null;
    if (Array.isArray(contractorProfiles)) {
      return contractorProfiles[0] || null;
    }
    return contractorProfiles;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-2">
                Requestor Dashboard
              </p>
              <h1 className="text-5xl font-bold text-foreground mb-3">My Requests</h1>
              <p className="text-muted-foreground text-lg">
                View your contractor referrals and request history.
              </p>
            </div>

            <Link href="/request">
              <Button className="bg-lw-rust hover:bg-lw-rust-hover text-white">
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
              <div className="text-sm text-muted-foreground mb-2">Contractor Selected</div>
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
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                          {job.property_address}, {job.property_city}, {job.property_state}
                        </h2>

                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.property_county}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-4 w-4" />
                            {job.urgency}
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
                      <p className="text-foreground/80">{job.job_description}</p>
                    </div>

                    <div>
                      <p className="text-sm uppercase tracking-wide text-muted-foreground mb-3">
                        Matched Contractors
                      </p>

                      {jobReferrals.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border p-4 text-muted-foreground">
                          We're expanding in your area. Your request has been received and we'll
                          connect you as contractors become available.
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-3 gap-4">
                          {jobReferrals.map((referral) => {
                            const contractor = getContractorProfile(referral.contractor_profiles);

                            return (
                              <div
                                key={referral.id}
                                className="rounded-xl border border-border p-4 bg-muted/30"
                              >
                                <div className="flex items-center justify-between gap-2 mb-3">
                                  <div className="text-sm font-semibold text-foreground">
                                    {contractor?.company_name || 'Contractor'}
                                  </div>
                                  <div className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary">
                                    {referral.tier_at_referral || 'match'}
                                  </div>
                                </div>

                                <div className="space-y-1 text-sm text-muted-foreground">
                                  {contractor?.owner_name && (
                                    <div className="inline-flex items-center gap-1">
                                      <Building2 className="h-4 w-4" />
                                      {contractor.owner_name}
                                    </div>
                                  )}
                                  {contractor?.email && <div>{contractor.email}</div>}
                                  {contractor?.phone && <div>{contractor.phone}</div>}
                                </div>
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
    </div>
  );
}
