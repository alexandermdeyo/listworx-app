'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  CircleCheck as CheckCircle,
  Circle as XCircle,
  Clock,
  Shield,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CircleAlert as AlertCircle,
  Loader as Loader2,
  Users,
  Ban,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import { PARTNER_STATUS } from '@/lib/partner-status';
import Navigation from '@/components/Navigation';

interface ContractorProfile {
  id: string;
  user_id: string;
  company_name: string;
  owner_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  bio: string | null;
  service_area_state: string | null;
  license_number: string | null;
  license_expiration_date: string | null;
  insurance_expiration_date: string | null;
  partner_status: string;
  created_at: string;
  agreed_to_standards: boolean;
  agreed_to_communications: boolean;
  agreed_to_privacy_policy: boolean;
  counties: Array<{ name: string }>;
  categories: Array<{ name: string }>;
}

export default function ApplicationsPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [profiles, setProfiles] = useState<ContractorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<{ [key: string]: string }>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const result = await checkAdminAuth();

    if (!result.ok) {
      if (result.reason === 'not_admin') {
        setAccessDenied(true);
        setIsAuthenticated(false);
      } else {
        router.push('/login?redirect=/admin/crm/applications');
      }
      return;
    }

    setIsAuthenticated(true);
    setAccessDenied(false);
    loadProfiles();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      setLoading(true);

      const { data: profilesData, error } = await supabase
        .from('contractor_profiles')
        .select('id, user_id, company_name, owner_name, email, phone, website, bio, service_area_state, license_number, license_expiration_date, insurance_expiration_date, partner_status, created_at, agreed_to_standards, agreed_to_communications, agreed_to_privacy_policy')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const profileIds = (profilesData || []).map((p) => p.id);

      let countyMap = new Map<string, { name: string }[]>();
      let categoryMap = new Map<string, { name: string }[]>();

      if (profileIds.length > 0) {
        const [countyRows, categoryRows] = await Promise.all([
          supabase
            .from('contractor_counties')
            .select('contractor_id, counties(name)')
            .in('contractor_id', profileIds),
          supabase
            .from('contractor_categories')
            .select('contractor_id, categories(name)')
            .in('contractor_id', profileIds),
        ]);

        for (const row of (countyRows.data || []) as any[]) {
          if (!row.counties) continue;
          if (!countyMap.has(row.contractor_id)) countyMap.set(row.contractor_id, []);
          countyMap.get(row.contractor_id)!.push({ name: row.counties.name });
        }

        for (const row of (categoryRows.data || []) as any[]) {
          if (!row.categories) continue;
          if (!categoryMap.has(row.contractor_id)) categoryMap.set(row.contractor_id, []);
          categoryMap.get(row.contractor_id)!.push({ name: row.categories.name });
        }
      }

      const enriched = (profilesData || []).map((p) => ({
        ...p,
        counties: countyMap.get(p.id) || [],
        categories: categoryMap.get(p.id) || [],
      })) as ContractorProfile[];

      setProfiles(enriched);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveApplication = async (profile: ContractorProfile) => {
    if (!confirm(`Approve ${profile.company_name}?\n\nThis will set their status to APPROVED and send an approval email.`)) {
      return;
    }

    try {
      setProcessing(profile.id);

      const response = await fetch('/api/approve-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorProfileId: profile.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      if (data.emailError) {
        alert(`Application approved!\n\nNote: Approval email could not be sent.\nError: ${data.emailError}`);
      } else {
        alert('Application approved! Approval email sent successfully.');
      }

      await loadProfiles();
    } catch (error: any) {
      alert(`Failed to approve: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const rejectApplication = async (profile: ContractorProfile) => {
    const reason = declineReason[profile.id];
    if (!reason || reason.trim() === '') {
      alert('Please provide a reason for rejecting this application.');
      return;
    }

    if (!confirm(`Reject ${profile.company_name}? This will set their status to REJECTED.`)) {
      return;
    }

    try {
      setProcessing(profile.id);

      const { error: updateError } = await supabase
        .from('contractor_profiles')
        .update({ partner_status: PARTNER_STATUS.REJECTED })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contractor-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              type: 'application_declined',
              to: profile.email,
              contractorName: profile.owner_name,
              reason,
            }),
          }
        );
      } catch (emailErr) {
        console.warn('Rejection email failed:', emailErr);
      }

      alert('Application rejected.');
      await loadProfiles();
      setDeclineReason({ ...declineReason, [profile.id]: '' });
    } catch (error: any) {
      alert(`Failed to reject: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const resendApprovalEmail = async (profile: ContractorProfile) => {
    try {
      setProcessing(profile.id);

      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contractor-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            type: 'application_approved',
            to: profile.email,
            contractorName: profile.owner_name,
            companyName: profile.company_name,
          }),
        }
      );

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        alert(`Failed to send email: ${errorData.error || 'Unknown error'}`);
      } else {
        alert('Approval email resent successfully.');
      }
    } catch (error: any) {
      alert(`Failed to send email: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const appliedProfiles = profiles.filter((p) => p.partner_status === PARTNER_STATUS.APPLIED);
  const approvedProfiles = profiles.filter((p) => p.partner_status === PARTNER_STATUS.APPROVED);
  const activeProfiles = profiles.filter((p) => p.partner_status === PARTNER_STATUS.ACTIVE);
  const pausedProfiles = profiles.filter((p) => p.partner_status === PARTNER_STATUS.PAUSED);
  const rejectedProfiles = profiles.filter((p) => p.partner_status === PARTNER_STATUS.REJECTED);

  const renderProfileCard = (profile: ContractorProfile, showApprovalButtons: boolean = false) => (
    <Card key={profile.id} className="p-6 bg-lw-dark-card border-lw-dark-border">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {profile.company_name || '(No company name)'}
              </h3>
              <p className="text-lg text-zinc-400">
                {profile.owner_name || '(No owner name)'}
              </p>
            </div>
            <Badge
              variant={
                profile.partner_status === PARTNER_STATUS.ACTIVE
                  ? 'default'
                  : profile.partner_status === PARTNER_STATUS.APPROVED
                  ? 'secondary'
                  : profile.partner_status === PARTNER_STATUS.REJECTED
                  ? 'destructive'
                  : 'outline'
              }
            >
              {profile.partner_status === PARTNER_STATUS.APPLIED ? 'Applied' :
               profile.partner_status === PARTNER_STATUS.APPROVED ? 'Approved' :
               profile.partner_status === PARTNER_STATUS.ACTIVE ? 'Active' :
               profile.partner_status === PARTNER_STATUS.PAUSED ? 'Paused' :
               profile.partner_status === PARTNER_STATUS.REJECTED ? 'Rejected' :
               profile.partner_status}
            </Badge>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-zinc-500" />
              <a href={`mailto:${profile.email}`} className="text-lw-rust hover:underline">
                {profile.email}
              </a>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-zinc-500" />
                <a href={`tel:${profile.phone}`} className="text-lw-rust hover:underline">
                  {profile.phone}
                </a>
              </div>
            )}
            {profile.service_area_state && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-zinc-500" />
                <span className="text-zinc-400">{profile.service_area_state}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-zinc-500" />
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lw-rust hover:underline"
                >
                  {profile.website}
                </a>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-white">
                <Shield className="h-4 w-4 text-zinc-400" />
                License & Insurance
              </h4>
              <div className="space-y-1 text-sm text-zinc-300">
                {profile.license_number && <p>License: {profile.license_number}</p>}
                {profile.license_expiration_date && (
                  <p>License Expires: {new Date(profile.license_expiration_date).toLocaleDateString()}</p>
                )}
                {profile.insurance_expiration_date && (
                  <p>Insurance Expires: {new Date(profile.insurance_expiration_date).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            {profile.bio && (
              <div>
                <h4 className="font-semibold mb-2 text-white">Business Description</h4>
                <p className="text-sm text-zinc-400">{profile.bio}</p>
              </div>
            )}

            <div className="text-xs text-zinc-500 pt-2 border-t border-lw-dark-border/60">
              Applied: {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-white">Service Counties</h4>
            <div className="flex flex-wrap gap-2">
              {profile.counties.length > 0 ? (
                profile.counties.map((county, i) => (
                  <Badge key={i} variant="outline" className="border-lw-dark-border text-zinc-300">{county.name}</Badge>
                ))
              ) : (
                <p className="text-sm text-zinc-400">No counties selected</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-white">Trade Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {profile.categories.length > 0 ? (
                <>
                  {profile.categories.slice(0, 8).map((cat, i) => (
                    <Badge key={i} variant="secondary" className="bg-lw-dark-surface text-zinc-300">{cat.name}</Badge>
                  ))}
                  {profile.categories.length > 8 && (
                    <Badge variant="secondary" className="bg-lw-dark-surface text-zinc-300">+{profile.categories.length - 8} more</Badge>
                  )}
                </>
              ) : (
                <p className="text-sm text-zinc-400">No trades selected</p>
              )}
            </div>
          </div>

          <div className="border-t border-lw-dark-border/60 pt-6 space-y-3">
            {showApprovalButtons && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block text-zinc-300">
                    Rejection Reason (required to reject)
                  </label>
                  <Textarea
                    placeholder="Provide a clear reason for rejecting this application..."
                    value={declineReason[profile.id] || ''}
                    onChange={(e) =>
                      setDeclineReason({ ...declineReason, [profile.id]: e.target.value })
                    }
                    className="mb-3"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => approveApplication(profile)}
                    disabled={processing === profile.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing === profile.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={() => rejectApplication(profile)}
                    disabled={processing === profile.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {processing === profile.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              </>
            )}

            {profile.partner_status === PARTNER_STATUS.APPROVED && (
              <Button
                onClick={() => resendApprovalEmail(profile)}
                disabled={processing === profile.id}
                variant="outline"
                className="w-full border-lw-dark-border text-zinc-100 bg-lw-dark-surface hover:bg-lw-rust hover:text-white"
              >
                {processing === profile.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Resend Approval Email
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-lw-dark flex items-center justify-center">
        <Card className="p-8 max-w-md text-center bg-lw-dark-card border-lw-dark-border">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-red-950/30 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Access Denied</h2>
          <p className="text-zinc-400 mb-6">Admin privileges required.</p>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/')} variant="outline" className="flex-1 border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
              Go Home
            </Button>
            <Button onClick={handleSignOut} className="flex-1 bg-lw-rust hover:bg-lw-rust-hover text-white">
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-lw-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-lw-rust mx-auto mb-4" />
          <p className="text-zinc-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lw-dark">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin/crm">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Contractor Applications</h1>
            <p className="text-zinc-400">
              Review and approve contractor applications to join the ListWorx network
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2 border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="applied" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="applied">
              <Clock className="h-4 w-4 mr-2" />
              Applied ({appliedProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved ({approvedProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              <Users className="h-4 w-4 mr-2" />
              Active ({activeProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="paused">
              <Ban className="h-4 w-4 mr-2" />
              Paused ({pausedProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <XCircle className="h-4 w-4 mr-2" />
              Rejected ({rejectedProfiles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applied">
            {appliedProfiles.length === 0 ? (
              <Card className="p-12 text-center bg-lw-dark-card border-lw-dark-border">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-lw-dark-surface flex items-center justify-center">
                    <Clock className="h-8 w-8 text-zinc-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">No Pending Applications</h3>
                <p className="text-zinc-400">All applications have been reviewed</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {appliedProfiles.map((p) => renderProfileCard(p, true))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedProfiles.length === 0 ? (
              <Card className="p-12 text-center bg-lw-dark-card border-lw-dark-border">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-lw-dark-surface flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-zinc-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">No Approved Contractors</h3>
                <p className="text-zinc-400">Contractors awaiting subscription will appear here</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {approvedProfiles.map((p) => renderProfileCard(p))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeProfiles.length === 0 ? (
              <Card className="p-12 text-center bg-lw-dark-card border-lw-dark-border">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-lw-dark-surface flex items-center justify-center">
                    <Users className="h-8 w-8 text-zinc-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">No Active Contractors</h3>
                <p className="text-zinc-400">Active, paying contractors will appear here</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {activeProfiles.map((p) => renderProfileCard(p))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paused">
            {pausedProfiles.length === 0 ? (
              <Card className="p-12 text-center bg-lw-dark-card border-lw-dark-border">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-lw-dark-surface flex items-center justify-center">
                    <Ban className="h-8 w-8 text-zinc-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">No Paused Contractors</h3>
                <p className="text-zinc-400">Paused contractors will appear here</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {pausedProfiles.map((p) => renderProfileCard(p))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejectedProfiles.length === 0 ? (
              <Card className="p-12 text-center bg-lw-dark-card border-lw-dark-border">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-lw-dark-surface flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-zinc-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">No Rejected Applications</h3>
                <p className="text-zinc-400">Rejected applications will appear here</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {rejectedProfiles.map((p) => renderProfileCard(p))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
