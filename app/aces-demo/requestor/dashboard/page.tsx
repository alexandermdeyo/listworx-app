'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Sparkles,
  User as User2,
  Palette,
  Users,
  Plus,
  ClipboardList,
  Settings,
  MapPin,
  Clock3,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import DemoDashboardShell, { type DemoNavItem } from '../../DemoDashboardShell';
import ContractorProfileModal from '../ContractorProfileModal';
import {
  DEMO_REQUESTOR_PROFILE,
  DEMO_JOB_REQUESTS,
  getDemoReferralsForJobRequest,
  getDemoContractorById,
  type DemoContractorProfile,
} from '@/lib/demo/acesDemoData';

type TabId = 'dashboard' | 'profile';

const NAV_ITEMS: DemoNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'listing-studio', label: 'Listing Studio', icon: Sparkles },
  { id: 'profile', label: 'My Profile', icon: User2 },
  { id: 'brand', label: 'My Brand', icon: Palette },
  { id: 'vendors', label: 'My Vendors', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatUrgency(value: string) {
  if (value === 'IMMEDIATE') return 'Immediate';
  if (value === 'WITHIN_WEEK') return 'Within 1 week';
  if (value === 'WITHIN_MONTH') return 'Within 1 month';
  if (value === 'FLEXIBLE') return 'Flexible';
  return value;
}

export default function RequestorDemoDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [profileModalContractor, setProfileModalContractor] = useState<DemoContractorProfile | null>(null);

  const profile = DEMO_REQUESTOR_PROFILE;
  const myRequests = DEMO_JOB_REQUESTS.filter((r) => r.requester_email === profile.email).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalRequests = myRequests.length;
  const activeRequests = myRequests.filter((r) => r.status !== 'CLOSED').length;
  const contractorsContacted = myRequests.reduce(
    (sum, r) => sum + getDemoReferralsForJobRequest(r.id).filter((ref) => ref.status !== 'PENDING').length,
    0
  );
  const jobsCompleted = myRequests.filter((r) => r.status === 'CLOSED').length;

  function showDemoToast() {
    toast({ title: 'Demo Mode', description: 'This is a visual-only demo — no changes were saved.' });
  }

  function handleNavSelect(id: string) {
    if (id === 'dashboard' || id === 'profile') {
      setActiveTab(id as TabId);
      return;
    }
    showDemoToast();
  }

  return (
    <DemoDashboardShell
      userName={profile.full_name}
      pageTitle={activeTab === 'profile' ? 'MY PROFILE' : 'DASHBOARD'}
      navItems={NAV_ITEMS}
      activeNavId={activeTab}
      onNavSelect={handleNavSelect}
    >
      <div className="p-6 max-w-5xl mx-auto">
        {activeTab === 'dashboard' && (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}>
                  Relationship Dashboard
                </h2>
                <p className="text-sm text-gray-500 mt-1">Your clients trust you. We help protect that trust.</p>
              </div>
              <Link href="/aces-demo/requestor">
                <Button className="text-white font-semibold" style={{ backgroundColor: '#E8621A' }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Requests Submitted', value: totalRequests },
                { label: 'Active Matches', value: activeRequests },
                { label: 'Contractors Contacted', value: contractorsContacted },
                { label: 'Jobs Completed', value: jobsCompleted },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2">{stat.label}</p>
                  <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF3ED' }}>
                  <Sparkles className="h-6 w-6" style={{ color: '#E8621A' }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Listing Studio</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Generate captions, emails, and property descriptions for any listing.</p>
                </div>
              </div>
              <Button onClick={showDemoToast} className="text-white font-semibold w-full sm:w-auto" style={{ backgroundColor: '#E8621A' }}>
                <Sparkles className="h-4 w-4 mr-2" />
                Open Listing Studio
              </Button>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Request History</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Organize referrals, track outcomes, and keep every project tied to the right relationship.
                </p>
              </div>

              {myRequests.map((job) => {
                const jobReferrals = getDemoReferralsForJobRequest(job.id);

                return (
                  <div key={job.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2 break-words">
                          {job.property_address}, {job.property_city}, {job.property_state}
                        </h2>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <ClipboardList className="h-4 w-4" /> {job.job_description.slice(0, 40)}...
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> {job.property_county}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-4 w-4" /> {formatUrgency(job.urgency)}
                          </span>
                          <Badge variant="secondary" className="bg-lw-rust/10 text-lw-rust border border-lw-rust/20">
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">{formatDate(job.created_at)}</div>
                    </div>

                    <div className="mb-5">
                      <p className="text-sm uppercase tracking-wide text-gray-400 mb-2">Job Description</p>
                      <p className="text-gray-700 whitespace-pre-line">{job.job_description}</p>
                    </div>

                    <div>
                      <p className="text-sm uppercase tracking-wide text-gray-400 mb-3">Referred Contractors</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {jobReferrals.map((referral, index) => {
                          const contractor = getDemoContractorById(referral.contractor_id);
                          if (!contractor) return null;

                          return (
                            <div key={referral.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50 hover:shadow-md transition">
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="text-sm font-semibold text-gray-900 break-words">{contractor.company_name}</span>
                                <span className="text-[11px] px-2 py-1 rounded-full bg-lw-rust/10 text-lw-rust whitespace-nowrap">
                                  Match {index + 1}
                                </span>
                              </div>

                              <div className="space-y-2 text-sm text-gray-500">
                                <div className="inline-flex items-center gap-1">
                                  <ShieldCheck className="h-4 w-4 shrink-0" />
                                  {contractor.ironclad_accepted ? 'IronClad Verified' : 'Trust status in review'}
                                </div>
                                <div className="inline-flex items-center gap-1">
                                  <Building2 className="h-4 w-4 shrink-0" /> {contractor.owner_name}
                                </div>
                                <div className="inline-flex items-center gap-1 break-all">
                                  <Mail className="h-4 w-4 shrink-0" /> {contractor.email}
                                </div>
                                <div className="inline-flex items-center gap-1">
                                  <Phone className="h-4 w-4 shrink-0" /> {contractor.phone}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-2 mt-4">
                                <Button
                                  onClick={() => setProfileModalContractor(contractor)}
                                  className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white"
                                >
                                  View Profile
                                </Button>
                                <Button onClick={showDemoToast} variant="outline" className="w-full border-lw-rust/30 text-gray-700 hover:bg-lw-rust/10">
                                  Save Contractor
                                </Button>
                                {referral.status !== 'HIRED' && referral.status !== 'CLOSED' && (
                                  <Button onClick={showDemoToast} variant="outline" className="w-full border-lw-rust/30 text-gray-700 hover:bg-lw-rust/10">
                                    I Picked This One
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Account Details</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500">Full Name</span>
                <span className="font-semibold text-gray-900">{profile.full_name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500">Email</span>
                <span className="font-semibold text-gray-900">{profile.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500">Phone</span>
                <span className="font-semibold text-gray-900">{profile.phone}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500">Role</span>
                <span className="font-semibold text-gray-900">Realtor</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-gray-500">Brokerage</span>
                <span className="font-semibold text-gray-900">{profile.brokerage}</span>
              </div>
            </div>
            <Button onClick={showDemoToast} className="mt-6 w-full bg-lw-rust hover:bg-lw-rust-hover text-white">
              Edit Profile
            </Button>
          </div>
        )}
      </div>

      <ContractorProfileModal
        contractor={profileModalContractor}
        open={!!profileModalContractor}
        onOpenChange={(open) => !open && setProfileModalContractor(null)}
      />
      <Toaster />
    </DemoDashboardShell>
  );
}
