'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
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
  Send,
  UserPlus,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string };

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
  vendor_invitations?: VendorInvitation[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard, href: '/requestor-dashboard' },
  { id: 'submit',    label: 'Submit Request',  icon: Plus,            href: '/request' },
  { id: 'requests',  label: 'My Requests',     icon: ClipboardList,   href: '/requestor-dashboard' },
  { id: 'vendors',   label: 'My Vendors',      icon: Users,           href: '/requestor-dashboard/vendors' },
  { id: 'profile',   label: 'Profile',         icon: User2,           disabled: true },
  { id: 'settings',  label: 'Settings',        icon: Settings,        disabled: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  colorClass: string;
  date?: string;
} {
  const invites = vendor.vendor_invitations ?? [];
  const accepted = invites.find((i) => i.status === 'ACCEPTED');
  if (accepted) {
    return {
      label: 'Joined ListWorx',
      colorClass: 'bg-green-900/50 text-green-400',
      date: accepted.accepted_at ? formatDate(accepted.accepted_at) : undefined,
    };
  }
  const latest = [...invites].sort(
    (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  )[0];
  if (latest) {
    return {
      label: 'Invited',
      colorClass: 'bg-yellow-900/50 text-yellow-400',
      date: formatDate(latest.sent_at),
    };
  }
  return { label: 'Not Invited', colorClass: 'bg-zinc-700 text-zinc-400' };
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Table state
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'name' | 'trade' | 'status'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
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

  // ── Load categories from Supabase ──────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, [supabase]);

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

    if (!form.name.trim()) { setSaveError('Vendor name is required.'); return; }
    if (!form.email.trim()) { setSaveError('Email is required.'); return; }
    if (!form.trade) { setSaveError('Please select a trade.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/realtor/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          form.name.trim(),
          business_name: form.business_name.trim() || undefined,
          email:         form.email.trim(),
          trade:         form.trade,
          phone:         form.phone.trim() || undefined,
          notes:         form.notes.trim() || undefined,
          send_invite:   sendInvite,
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
  async function handleResendInvite(e: React.MouseEvent, vendor: Vendor) {
    e.stopPropagation(); // don't toggle row expansion
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

  // ── Sort ───────────────────────────────────────────────────────────────────
  function handleSort(key: 'name' | 'trade' | 'status') {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sortedVendors = useMemo(() => {
    return [...vendors].sort((a, b) => {
      let aVal = '';
      let bVal = '';
      if (sortKey === 'name')       { aVal = a.name;                        bVal = b.name; }
      else if (sortKey === 'trade') { aVal = a.trade;                       bVal = b.trade; }
      else                          { aVal = getVendorStatus(a).label;      bVal = getVendorStatus(b).label; }
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [vendors, sortKey, sortDir]);

  // ── Sort icon helper ───────────────────────────────────────────────────────
  function SortIcon({ col }: { col: 'name' | 'trade' | 'status' }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-zinc-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-lw-rust" />
      : <ChevronDown className="h-3 w-3 text-lw-rust" />;
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
      <div className="p-6 max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <h2
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
          >
            My Contractor Network
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Your contractors already do great work. Help them get found by more clients — and
            make sure there is always a vetted backup when your first call is unavailable.
          </p>
        </div>

        {/* ── Add Vendor Form ─────────────────────────────────────────────── */}
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="h-5 w-5 text-lw-rust" />
            <h3 className="text-base font-semibold text-white">Add a Vendor</h3>
          </div>

          {saveError && (
            <Alert className="mb-4 bg-red-950/50 border-red-800">
              <AlertDescription className="text-red-400">{saveError}</AlertDescription>
            </Alert>
          )}
          {saveSuccess && (
            <Alert className="mb-4 bg-green-950/50 border-green-800">
              <AlertDescription className="text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {saveSuccess}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Smith"
                className="w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust placeholder:text-zinc-500"
              />
            </div>

            {/* Business name */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Business Name
              </label>
              <input
                type="text"
                name="business_name"
                value={form.business_name}
                onChange={handleChange}
                placeholder="Smith Plumbing LLC"
                className="w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust placeholder:text-zinc-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jane@smithplumbing.com"
                className="w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust placeholder:text-zinc-500"
              />
            </div>

            {/* Trade — dynamic from Supabase categories */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Trade <span className="text-red-400">*</span>
              </label>
              <select
                name="trade"
                value={form.trade}
                onChange={handleChange}
                className="w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust"
              >
                <option value="">Select a trade...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(555) 000-0000"
                className="w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust placeholder:text-zinc-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Great for kitchen remodels, fast response..."
                rows={2}
                className="w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust resize-none placeholder:text-zinc-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-5">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="border border-zinc-500 text-white bg-zinc-700 hover:bg-zinc-600"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" />Save to My List</>
              )}
            </Button>

            <Button
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="text-white font-semibold"
              style={{ backgroundColor: '#E8621A' }}
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Save and Send Invite</>
              )}
            </Button>
          </div>
        </div>

        {/* ── Vendor Table ────────────────────────────────────────────────── */}
        <div>
          <h3
            className="text-base font-semibold text-gray-900 mb-3"
            style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
          >
            Your Vendors ({vendors.length})
          </h3>

          {loadError && (
            <Alert className="mb-4 bg-red-950/50 border-red-800">
              <AlertDescription className="text-red-400">{loadError}</AlertDescription>
            </Alert>
          )}

          {loadingVendors ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-10 flex items-center justify-center text-zinc-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading vendors...
            </div>
          ) : vendors.length === 0 ? (
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-12 text-center">
              <Users className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium mb-1">No vendors yet.</p>
              <p className="text-sm text-zinc-500">
                Add contractors you trust and invite them to join your network.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-zinc-700 overflow-hidden">

              {/* Table header */}
              <div className="hidden md:grid grid-cols-[minmax(0,1.5fr)_110px_minmax(0,1fr)_120px_120px_160px] gap-3 px-4 py-2.5 bg-zinc-900 border-b border-zinc-700">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-300 text-left"
                >
                  Name <SortIcon col="name" />
                </button>
                <button
                  onClick={() => handleSort('trade')}
                  className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-300 text-left"
                >
                  Trade <SortIcon col="trade" />
                </button>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</span>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</span>
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-300 text-left"
                >
                  Status <SortIcon col="status" />
                </button>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Actions</span>
              </div>

              {/* Table rows */}
              {sortedVendors.map((vendor) => {
                const status = getVendorStatus(vendor);
                const invites = vendor.vendor_invitations ?? [];
                const latestInvite = [...invites].sort(
                  (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
                )[0];
                const canResend =
                  latestInvite &&
                  latestInvite.status !== 'ACCEPTED' &&
                  daysSince(latestInvite.sent_at) >= 7;
                const hasInvite = invites.length > 0;
                const accepted = invites.some((i) => i.status === 'ACCEPTED');
                const isExpanded = expandedVendorId === vendor.id;

                return (
                  <div key={vendor.id}>
                    {/* Main row */}
                    <div
                      onClick={() =>
                        setExpandedVendorId(isExpanded ? null : vendor.id)
                      }
                      className="grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_110px_minmax(0,1fr)_120px_120px_160px] gap-3 px-4 py-3.5 bg-zinc-800/50 border-b border-zinc-700 hover:bg-zinc-700/50 cursor-pointer transition-colors"
                    >
                      {/* Name + business */}
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{vendor.name}</p>
                        {vendor.business_name && (
                          <p className="text-zinc-300 text-xs truncate mt-0.5">{vendor.business_name}</p>
                        )}
                      </div>

                      {/* Trade badge */}
                      <div className="flex items-start">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-lw-rust/20 text-lw-rust border border-lw-rust/30 whitespace-nowrap">
                          {vendor.trade}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="flex items-center min-w-0">
                        <a
                          href={`mailto:${vendor.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-zinc-400 text-sm hover:text-zinc-200 truncate"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{vendor.email}</span>
                        </a>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center">
                        {vendor.phone ? (
                          <a
                            href={`tel:${vendor.phone.replace(/[^0-9+]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-zinc-400 text-sm hover:text-zinc-200"
                          >
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {vendor.phone}
                          </a>
                        ) : (
                          <span className="text-zinc-600 text-sm">—</span>
                        )}
                      </div>

                      {/* Status badge */}
                      <div className="flex items-center">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${status.colorClass}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {!hasInvite && !accepted && (
                          <Button
                            size="sm"
                            onClick={(e) => handleResendInvite(e, vendor)}
                            disabled={resending[vendor.id]}
                            className="text-white text-xs h-7 px-2.5"
                            style={{ backgroundColor: '#E8621A' }}
                          >
                            {resending[vendor.id] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <><Send className="h-3 w-3 mr-1" />Send Invite</>
                            )}
                          </Button>
                        )}
                        {canResend && (
                          <Button
                            size="sm"
                            onClick={(e) => handleResendInvite(e, vendor)}
                            disabled={resending[vendor.id]}
                            className="text-xs h-7 px-2.5 border border-zinc-500 text-zinc-300 bg-zinc-700 hover:bg-zinc-600"
                          >
                            {resending[vendor.id] ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <><Send className="h-3 w-3 mr-1" />Resend</>
                            )}
                          </Button>
                        )}
                        {accepted && (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        )}
                        {/* Expand indicator — needs its own handler because parent stops propagation */}
                        <span
                          className="ml-auto text-zinc-600 cursor-pointer hover:text-zinc-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedVendorId(isExpanded ? null : vendor.id);
                          }}
                        >
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4" />
                            : <ChevronDown className="h-4 w-4" />}
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <div className="px-4 py-3 bg-zinc-900/60 border-b border-zinc-700 grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1">
                            Notes
                          </p>
                          <p className="text-sm text-zinc-300">
                            {vendor.notes || <span className="text-zinc-600 italic">No notes added.</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 mb-1">
                            Invite Status
                          </p>
                          {status.date ? (
                            <p className="text-sm text-zinc-300 flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-zinc-500" />
                              {status.label === 'Joined ListWorx' ? 'Joined' : 'Invited'} {status.date}
                            </p>
                          ) : (
                            <p className="text-sm text-zinc-600 italic">No invite sent yet.</p>
                          )}
                          <p className="text-xs text-zinc-500 mt-1">
                            Added {formatDate(vendor.created_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
