'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase-browser';
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
  ShieldCheck,
  Crown,
  Heart,
  MessageSquare,
  BookmarkCheck,
  ClipboardList,
  Home,
  Users,
  ExternalLink,
  Star,
  LayoutDashboard,
  Settings,
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
  feedback_token?: string | null;
  trade_type?: string | null;
  service_type?: string | null;
  categories?: string[] | null;
};

type Contractor = {
  id: string;
  company_name: string | null;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  bio: string | null;
  service_area_state?: string | null;
  service_area_counties?: string[] | null;
  ironclad_accepted?: boolean | null;
  founder_status?: boolean | null;
  founding_partner_badge?: boolean | null;
  years_in_business?: number | null;
  response_time?: string | null;
  trade?: string | null;
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

function formatDate(value: string | null) {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/requestor-dashboard' },
  { id: 'submit', label: 'Submit Request', icon: Plus, href: '/request' },
  { id: 'requests', label: 'My Requests', icon: ClipboardList, href: '/requestor-dashboard' },
  { id: 'profile', label: 'Profile', icon: User2, disabled: true },
  { id: 'settings', label: 'Settings', icon: Settings, disabled: true },
];


export default function RequestorDashboardPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobRequests, setJobRequests] = useState([] as JobRequest[]);
  const [referrals, setReferrals] = useState([] as Referral[]);
  const [userName, setUserName] = useState('');

  const loadUser = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setUserName(user.email.split('@')[0]);
    } catch {
      // User display name is non-critical for dashboard rendering.
    }
  }, [supabase]);

  const loadDashboard = useCallback(async () => {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    void loadUser();
  }, [loadDashboard, loadUser]);

  async function handleLogout() {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // Continue redirecting even if the remote sign-out call fails.
    }
    window.location.href = '/login';
  }

  const referralsByRequest = useMemo(() => {
    const map = new Map() as Map<string, Referral[]>;

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

  function getProjectType(job: JobRequest) {
    if (job.trade_type) return job.trade_type;
    if (job.service_type) return job.service_type;
    if (Array.isArray(job.categories) && job.categories.length > 0) return job.categories[0];
    return 'General home service request';
  }

  function getServiceArea(contractor: Contractor | null) {
    if (!contractor) return 'Service area pending';
    if (Array.isArray(contractor.service_area_counties) && contractor.service_area_counties.length > 0) {
      const counties = contractor.service_area_counties;
      const base = counties.slice(0, 2).join(', ');
      const suffix = counties.length > 2 ? ' +' : '';
      return base + suffix;
    }
    if (contractor.service_area_state) return contractor.service_area_state;
    return 'Service area shared after connection';
  }

  return (
    <DashboardLayout
      userName={userName || 'User'}
      pageTitle="DASHBOARD"
      navItems={NAV_ITEMS}
      activeNavId="dashboard"
      onLogout={handleLogout}
      hasNotifications={false}
    >
      <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}>
            Relationship Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Your clients trust you. We help protect that trust.
          </p>
        </div>

        <Link href="/request">
          <Button className="text-white font-semibold" style={{ backgroundColor: '#E8621A' }}>
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

      {/* Stat cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Requests Submitted', value: totalRequests },
          { label: 'Active Matches', value: activeRequests },
          { label: 'Contractors Contacted', value: contractorSelected },
          { label: 'Jobs Completed', value: jobRequests.filter(r => r.status?.toUpperCase() === 'COMPLETED').length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">{stat.label}</p>
            <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
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
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Request History</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Organize referrals, track outcomes, and keep every project tied to the right relationship.
            </p>
          </div>
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
                        <ClipboardList className="h-4 w-4" />
                        {getProjectType(job)}
                      </span>
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
                      <Badge variant="secondary" className="bg-lw-rust/10 text-lw-rust border border-lw-rust/20">
                        {job.status || 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {formatDate(job.created_at)}
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
                    Referred Contractors
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
                              <div className="inline-flex items-center gap-1">
                                <ClipboardList className="h-4 w-4 shrink-0" />
                                <span>{getProjectType(job)}</span>
                              </div>
                              <div className="inline-flex items-center gap-1">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span>{getServiceArea(contractor)}</span>
                              </div>
                              <div className="inline-flex items-center gap-1">
                                <ShieldCheck className="h-4 w-4 shrink-0" />
                                <span>
                                  {contractor?.ironclad_accepted ? 'IronClad Verified' : 'Trust status in review'}
                                </span>
                              </div>
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
                              <div className="grid grid-cols-1 gap-2 mt-4">
                                <Link href={profileHref} className="block">
                                  <Button className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white">
                                    View Profile
                                  </Button>
                                </Link>
                                <Button variant="outline" className="w-full border-lw-rust/30 text-foreground hover:bg-lw-rust/10">
                                  <BookmarkCheck className="h-4 w-4 mr-2" />
                                  Save Contractor
                                </Button>
                                {job.feedback_token ? (
                                  <Link href={`/feedback/${job.feedback_token}`} className="block">
                                    <Button variant="outline" className="w-full border-lw-rust/30 text-foreground hover:bg-lw-rust/10">
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Give Feedback
                                    </Button>
                                  </Link>
                                ) : (
                                  <Button variant="outline" className="w-full border-lw-rust/20 text-muted-foreground" disabled>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Give Feedback (Coming Soon)
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-5 flex justify-end">
                  <Button variant="outline" className="border-lw-rust/30 text-foreground hover:bg-lw-rust/10">
                    View Request Details
                  </Button>
                </div>
              </Card>
            );
          })}

          <div className="grid lg:grid-cols-2 gap-6 pt-4">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Saved Contractors</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep your trusted pros organized for faster repeat requests.
                  </p>
                </div>
                <Heart className="h-5 w-5 text-lw-rust" />
              </div>
              <div className="rounded-xl border border-dashed border-border p-4 bg-muted/20">
                <p className="text-sm text-muted-foreground mb-3">
                  No saved contractors yet.
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  TODO: Wire this section to persisted favorites once backend support is available.
                </p>
                <Button variant="outline" className="border-lw-rust/30 text-foreground hover:bg-lw-rust/10">
                  Request Again
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Feedback</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track who followed through so future referrals get even stronger.
                  </p>
                </div>
                <Star className="h-5 w-5 text-lw-rust" />
              </div>
              <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" disabled className="accent-lw-rust" />
                  Contacted me
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" disabled className="accent-lw-rust" />
                  Showed up
                </label>
                <div>
                  <p className="text-sm text-foreground mb-1">Communication rating</p>
                  <div className="text-xs text-muted-foreground">TODO: Add rating control + backend wiring.</div>
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" disabled className="accent-lw-rust" />
                  Would recommend
                </label>
                <div>
                  <p className="text-sm text-foreground mb-1">Private notes</p>
                  <div className="rounded-md border border-border bg-background p-2 text-xs text-muted-foreground">
                    TODO: Save private requestor notes for this contractor/referral.
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Invite a Contractor You Trust</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Invite the contractors you already trust and help strengthen the ListWorx network.
                </p>
              </div>
              <Link href="/apply">
                <Button className="bg-lw-rust hover:bg-lw-rust-hover text-white w-full md:w-auto">
                  <Users className="h-4 w-4 mr-2" />
                  Share Contractor Invite
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-1">Listing Prep Tools</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ready-to-use checklists to coordinate projects and protect your client experience.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Pre-listing repair checklist',
                'Inspection repair checklist',
                'Seller prep checklist',
                'Property manager turnover checklist',
              ].map((resource) => (
                <div key={resource} className="rounded-xl border border-border p-4 bg-muted/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <Home className="h-4 w-4 mt-0.5 text-lw-rust" />
                      <p className="text-sm text-foreground">{resource}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
