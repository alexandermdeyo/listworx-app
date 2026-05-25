'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase-browser';
import {
  Loader2,
  Plus,
  ClipboardList,
  User as User2,
  Users,
  Settings,
  LayoutDashboard,
  Mail,
  Phone,
  Building2,
  Send,
  UserPlus,
  Briefcase,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type VendorInvitation = {
  id: string;
  status: string;
  sent_at: string;
  expires_at: string;
  accepted_at: string | null;
};

type Vendor = {
  id: string;
  name: string;
  business_name: string | null;
  email: string;
  trade: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  vendor_invitations: VendorInvitation[];
};

// ── Constants ────────────────────────────────────────────────────────────────

const TRADES = [
  'Plumber',
  'Electrician',
  'HVAC',
  'Painter',
  'Landscaper',
  'Cleaner',
  'Photographer',
  'Roofer',
  'Flooring',
  'Handyman',
  'Other',
];

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/requestor-dashboard' },
  { id: 'submit', label: 'Submit Request', icon: Plus, href: '/request' },
  { id: 'requests', label: 'My Requests', icon: ClipboardList, href: '/requestor-dashboard' },
  { id: 'vendors', label: 'My Vendors', icon: Users, href: '/requestor-dashboard/vendors' },
  { id: 'profile', label: 'Profile', icon: User2, disabled: true },
  { id: 'settings', label: 'Settings', icon: Settings, disabled: true },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function getVendorStatus(vendor: Vendor): {
  label: string;
  color: string;
  date?: string;
} {
  const invites = vendor.vendor_invitations ?? [];
  const accepted = invites.find((i) => i.status === 'ACCEPTED');
  if (accepted) {
    return {
      label: 'Joined ListWorx',
      color: 'bg-green-100 text-green-700',
      date: accepted.accepted_at ? formatDate(accepted.accepted_at) : undefined,
    };
  }
  const latest = invites.sort(
    (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  )[0];
  if (latest) {
    return {
      label: 'Invited',
      color: 'bg-yellow-100 text-yellow-700',
      date: formatDate(latest.sent_at),
    };
  }
  return { label: 'Not Invited', color: 'bg-gray-100 text-gray-600' };
}

// ── Page Component ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  business_name: '',
  email: '',
  trade: '',
  phone: '',
  notes: '',
};

export default function VendorsPage() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [userName, setUserName] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Resend invite state: vendorId → loading
  const [resending, setResending] = useState<Record<string, boolean>>({});

  // ── Auth check ─────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setUserName(user.email?.split('@')[0] ?? 'User');
    });
  }, [supabase, router]);

  // ── Load vendors ───────────────────────────────────────────────────────────
  const loadVendors = useCallback(async () => {
    setLoadingVendors(true);
    setLoadError('');
    try {
      const res = await fetch('/api/realtor/vendors');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load vendors.');
      setVendors(data.vendors ?? []);
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoadingVendors(false);
    }
  }, []);

  useEffect(() => {
    void loadVendors();
  }, [loadVendors]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  async function handleLogout() {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // Redirect regardless
    }
    window.location.href = '/login';
  }

  // ── Form handlers ──────────────────────────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(sendInvite: boolean) {
    setSaveError('');
    setSaveSuccess('');

    if (!form.name.trim()) {
      setSaveError('Vendor name is required.');
      return;
    }
    if (!form.email.trim()) {
      setSaveError('Email is required.');
      return;
    }
    if (!form.trade) {
      setSaveError('Please select a trade.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/realtor/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          business_name: form.business_name.trim() || undefined,
          email: form.email.trim(),
          trade: form.trade,
          phone: form.phone.trim() || undefined,
          notes: form.notes.trim() || undefined,
          send_invite: sendInvite,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save vendor.');

      setForm(EMPTY_FORM);
      setSaveSuccess(
        sendInvite
          ? `${form.name} saved and invite sent to ${form.email}.`
          : `${form.name} added to your vendor list.`
      );
      await loadVendors();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Resend invite ──────────────────────────────────────────────────────────
  async function handleResendInvite(vendor: Vendor) {
    setResending((prev) => ({ ...prev, [vendor.id]: true }));
    try {
      const res = await fetch('/api/realtor/vendors/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor.id }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to resend invite.');
      }
      await loadVendors();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResending((prev) => ({ ...prev, [vendor.id]: false }));
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      userName={userName || 'User'}
      pageTitle="MY VENDORS"
      navItems={NAV_ITEMS}
      activeNavId="vendors"
      onLogout={handleLogout}
      hasNotifications={false}
    >
      <div className="p-6 max-w-4xl mx-auto">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
          >
            My Contractor Network
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Invite contractors you trust and keep them organized in one place. When they
            join ListWorx, you'll be their first connection.
          </p>
        </div>

        {/* ── Add Vendor Form ───────────────────────────────────────────────── */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="h-5 w-5 text-lw-rust" />
            <h3 className="text-lg font-semibold text-gray-900">Add a Vendor</h3>
          </div>

          {saveError && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">{saveError}</AlertDescription>
            </Alert>
          )}
          {saveSuccess && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {saveSuccess}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Smith"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust"
              />
            </div>

            {/* Business name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                name="business_name"
                value={form.business_name}
                onChange={handleChange}
                placeholder="Smith Plumbing LLC"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@smithplumbing.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust"
              />
            </div>

            {/* Trade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade <span className="text-red-500">*</span>
              </label>
              <select
                name="trade"
                value={form.trade}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust bg-white"
              >
                <option value="">Select a trade...</option>
                {TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(555) 000-0000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Great for kitchen remodels, fast response..."
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Save to My List
                </>
              )}
            </Button>

            <Button
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="text-white font-semibold"
              style={{ backgroundColor: '#E8621A' }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Save and Send Invite
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* ── Vendor List ───────────────────────────────────────────────────── */}
        <div>
          <h3
            className="text-lg font-semibold text-gray-900 mb-4"
            style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
          >
            Your Vendors ({vendors.length})
          </h3>

          {loadError && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">{loadError}</AlertDescription>
            </Alert>
          )}

          {loadingVendors ? (
            <Card className="p-10">
              <div className="flex items-center justify-center text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading vendors...
              </div>
            </Card>
          ) : vendors.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">No vendors yet.</p>
              <p className="text-sm text-gray-400">
                Add contractors you trust and invite them to join your network.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendors.map((vendor) => {
                const status = getVendorStatus(vendor);
                const invites = vendor.vendor_invitations ?? [];
                const latestInvite = invites.sort(
                  (a, b) =>
                    new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
                )[0];
                const canResend =
                  latestInvite &&
                  latestInvite.status !== 'ACCEPTED' &&
                  daysSince(latestInvite.sent_at) >= 7;
                const hasInvite = invites.length > 0;
                const accepted = invites.some((i) => i.status === 'ACCEPTED');

                return (
                  <Card key={vendor.id} className="p-5">
                    {/* Name + status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{vendor.name}</p>
                        {vendor.business_name && (
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            {vendor.business_name}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Trade badge */}
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                        <Briefcase className="h-3 w-3" />
                        {vendor.trade}
                      </span>
                    </div>

                    {/* Contact */}
                    <div className="space-y-1.5 text-sm text-gray-600 mb-3">
                      <a
                        href={`mailto:${vendor.email}`}
                        className="flex items-center gap-2 hover:text-gray-900"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        {vendor.email}
                      </a>
                      {vendor.phone && (
                        <a
                          href={`tel:${vendor.phone.replace(/[^0-9+]/g, '')}`}
                          className="flex items-center gap-2 hover:text-gray-900"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                          {vendor.phone}
                        </a>
                      )}
                    </div>

                    {/* Notes */}
                    {vendor.notes && (
                      <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">
                        {vendor.notes}
                      </p>
                    )}

                    {/* Invite status detail */}
                    {status.date && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                        <Clock className="h-3 w-3" />
                        {status.label === 'Joined ListWorx' ? 'Joined' : 'Invited'}{' '}
                        {status.date}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-1">
                      {!hasInvite && !accepted && (
                        <Button
                          size="sm"
                          onClick={() => handleResendInvite(vendor)}
                          disabled={resending[vendor.id]}
                          className="text-white text-xs"
                          style={{ backgroundColor: '#E8621A' }}
                        >
                          {resending[vendor.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5 mr-1" />
                              Send Invite
                            </>
                          )}
                        </Button>
                      )}

                      {canResend && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvite(vendor)}
                          disabled={resending[vendor.id]}
                          className="text-xs border-gray-300"
                        >
                          {resending[vendor.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5 mr-1" />
                              Resend Invite
                            </>
                          )}
                        </Button>
                      )}

                      {accepted && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active on ListWorx
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
