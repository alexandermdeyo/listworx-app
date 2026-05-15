'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, Loader as Loader2, CircleAlert as AlertCircle, LogOut, Archive, Trash2, ShoppingCart, Plus, DollarSign, ChartBar as BarChart3, Pause, Play, UserX, Bell, BellOff, Send, CircleCheck as CheckCircle2, ChevronDown, ChevronUp, Shield, Briefcase, RefreshCw, Image as ImageIcon, Upload, Trash, Star, StarOff, Eye, MonitorCog, LayoutDashboard, Clock, FileText, Home, Settings, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import { PARTNER_STATUS } from '@/lib/partner-status';
import Navigation from '@/components/Navigation';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';
import Link from 'next/link';
import Image from 'next/image';
import AdminContractorDocuments from './AdminContractorDocuments';
import SubscriptionOverride from './SubscriptionOverride';

interface Contractor {
  id: string;
  user_id: string;
  company_name: string;
  owner_name: string;
  email: string;
  phone: string;
  partner_status: string;
  tier: string;
  subscription_status?: string;
  stripe_customer_id?: string;
  total_referrals_sent: number;
  jobs_completed: number;
  email_notifications_enabled: boolean;
  admin_notes: string | null;
  created_at: string;
  archived: boolean;
  logo_url: string | null;
  featured_on_homepage: boolean;
  ironclad_certified?: boolean;
  ironclad_accepted?: boolean;
  users: { email: string; phone: string } | null;
  purchases: Array<{
    id: string;
    purchase_type: string;
    item_name: string;
    quantity: number;
    price: number;
    status: string;
    purchased_at: string;
  }>;
  referral_stats: {
    total: number;
    contacted: number;
    hired: number;
  };
  counties: Array<{ id: string; name: string; state_code: string }>;
  trades: Array<{ id: string; name: string }>;
  ironclad_stats?: {
    avg_quality: string;
    avg_professionalism: string;
    would_request_again_pct: string;
    responded_24h_pct: string;
  };
}

export default function ContractorsPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [purchaseType, setPurchaseType] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [purchaseStatus, setPurchaseStatus] = useState('pending');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [adminNotesDraft, setAdminNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [logoUploading, setLogoUploading] = useState<string | null>(null);
  const [logoPreviewContractorId, setLogoPreviewContractorId] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState('');

  const logoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  const checkAuth = async () => {
    const result = await checkAdminAuth();
    if (!result.ok) {
      if (result.reason === 'not_admin') setAccessDenied(true);
      else router.push('/login?redirect=/admin/crm/contractors');
      return;
    }
    if (result.user?.id) setAdminUserId(result.user.id);
    setIsAuthenticated(true);
    loadContractors();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const loadContractors = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('contractor_profiles')
        .select('*, users(email, phone)')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (!data) return;

      const enriched = await Promise.all(
        data.map(async (c) => {
          const [purchasesRes, referralStatsRes, countiesRes, tradesRes, feedbackRes] = await Promise.all([
            supabase
              .from('contractor_purchases')
              .select('*')
              .eq('contractor_id', c.id)
              .order('purchased_at', { ascending: false }),
            supabase
              .from('referrals')
              .select('status')
              .eq('contractor_id', c.id),
            supabase
              .from('contractor_counties')
              .select('county_id, counties(id, name, state_code)')
              .eq('contractor_id', c.id),
            supabase
              .from('contractor_categories')
              .select('category_id, categories(id, name)')
              .eq('contractor_id', c.id),
            supabase
              .from('job_feedback')
              .select('ironclad_quality_rating, ironclad_professionalism_rating, ironclad_would_request_again, ironclad_responded_24h')
              .eq('contractor_id', c.id),
          ]);

          const refs = referralStatsRes.data || [];
          const contacted = refs.filter(r => ['CONTACTED', 'COMPLETED'].includes(r.status)).length;
          const hired = refs.filter(r => r.status === 'COMPLETED').length;

          const counties = (countiesRes.data || []).map((row: any) => row.counties).filter(Boolean);
          const trades = (tradesRes.data || []).map((row: any) => row.categories).filter(Boolean);

          const feedbackRows = feedbackRes.data || [];
          let ironclad_stats: Contractor['ironclad_stats'];
          if (feedbackRows.length > 0) {
            const qualityNums = feedbackRows.map(r => r.ironclad_quality_rating).filter((v): v is number => v != null);
            const profNums = feedbackRows.map(r => r.ironclad_professionalism_rating).filter((v): v is number => v != null);
            const againRows = feedbackRows.filter(r => r.ironclad_would_request_again != null);
            const respondedRows = feedbackRows.filter(r => r.ironclad_responded_24h != null);

            const avgQ = qualityNums.length > 0
              ? (qualityNums.reduce((a, b) => a + b, 0) / qualityNums.length).toFixed(1) + ' / 5'
              : '–';
            const avgP = profNums.length > 0
              ? (profNums.reduce((a, b) => a + b, 0) / profNums.length).toFixed(1) + ' / 5'
              : '–';
            const againPct = againRows.length > 0
              ? Math.round(againRows.filter(r => r.ironclad_would_request_again === 'yes').length / againRows.length * 100) + '%'
              : '–';
            const respondedPct = respondedRows.length > 0
              ? Math.round(respondedRows.filter(r => r.ironclad_responded_24h === 'yes').length / respondedRows.length * 100) + '%'
              : '–';

            ironclad_stats = {
              avg_quality: avgQ,
              avg_professionalism: avgP,
              would_request_again_pct: againPct,
              responded_24h_pct: respondedPct,
            };
          }

          return {
            ...c,
            purchases: purchasesRes.data || [],
            referral_stats: { total: refs.length, contacted, hired },
            counties,
            trades,
            ironclad_stats,
          } as Contractor;
        })
      );

      setContractors(enriched);
    } catch (err) {
      console.error('Error loading contractors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusAction = async (contractorId: string, action: string) => {
    const labels: Record<string, string> = {
      pause: 'Pause this contractor? They will stop receiving referrals.',
      activate: 'Activate this contractor?',
      remove: 'Remove this contractor from the system? This cannot be easily undone.',
    };
    if (labels[action] && !confirm(labels[action])) return;

    try {
      setProcessing(contractorId);
      const res = await fetch('/api/admin/contractor-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorId, action }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast('Status updated successfully');
      await loadContractors();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setProcessing(null);
    }
  };


  const handleToggleIronClad = async (contractor: Contractor) => {
    const next = !contractor.ironclad_certified;
    if (!confirm(`${next ? 'Mark' : 'Remove'} IronClad certification for ${contractor.company_name}?`)) return;

    try {
      setProcessing(contractor.id + '-ironclad');
      const { error } = await supabase
        .from('contractor_profiles')
        .update({ ironclad_certified: next })
        .eq('id', contractor.id);
      if (error) throw error;
      showToast(next ? 'IronClad certification marked compliant' : 'IronClad certification removed');
      await loadContractors();
    } catch (err: any) {
      showToast(err.message || 'Failed to update IronClad status', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleEmails = async (contractor: Contractor) => {
    try {
      setProcessing(contractor.id);
      const res = await fetch('/api/admin/contractor-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorId: contractor.id, action: 'toggle_emails' }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const newState = !contractor.email_notifications_enabled;
      showToast(`Email notifications ${newState ? 'enabled' : 'disabled'}`);
      await loadContractors();
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle emails', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleResendEmail = async (contractorId: string, type: string) => {
    try {
      setProcessing(contractorId + '-email-' + type);
      const res = await fetch('/api/admin/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorId, type }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast(`${type} email sent`);
    } catch (err: any) {
      showToast(err.message || 'Email send failed', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const openPurchaseDialog = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setPurchaseType('');
    setItemName('');
    setQuantity(1);
    setPrice(0);
    setPurchaseStatus('pending');
    setPurchaseNotes('');
    setPurchaseDialogOpen(true);
  };

  const addPurchase = async () => {
    if (!selectedContractor || !purchaseType || !itemName) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    try {
      setProcessing(selectedContractor.id);
      const { error } = await supabase.from('contractor_purchases').insert({
        contractor_id: selectedContractor.id,
        purchase_type: purchaseType,
        item_name: itemName,
        quantity,
        price,
        status: purchaseStatus,
        notes: purchaseNotes,
      });
      if (error) throw error;
      setPurchaseDialogOpen(false);
      showToast('Purchase added');
      await loadContractors();
    } catch (err: any) {
      showToast(err.message || 'Failed to add purchase', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const openNotesDialog = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setAdminNotesDraft(contractor.admin_notes || '');
    setNotesDialogOpen(true);
  };

  const saveAdminNotes = async () => {
    if (!selectedContractor) return;
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('contractor_profiles')
        .update({ admin_notes: adminNotesDraft })
        .eq('id', selectedContractor.id);
      if (error) throw error;
      showToast('Notes saved');
      setNotesDialogOpen(false);
      await loadContractors();
    } catch (err: any) {
      showToast(err.message || 'Failed to save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const archiveContractor = async (contractorId: string) => {
    if (!confirm('Archive this contractor?')) return;
    try {
      setProcessing(contractorId);
      await supabase.from('contractor_profiles').update({ archived: true }).eq('id', contractorId);
      await loadContractors();
    } catch (err) {
      console.error('Error archiving:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleLogoUpload = async (contractor: Contractor, file: File) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Only JPG, PNG, or WebP images are allowed', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('File must be under 5MB', 'error');
      return;
    }

    try {
      setLogoUploading(contractor.id);
      const ext = file.name.split('.').pop();
      const path = `contractor-logos/${contractor.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('contractor_profiles')
        .update({ logo_url: publicUrl })
        .eq('id', contractor.id);

      if (updateError) throw updateError;

      showToast('Logo uploaded successfully');
      await loadContractors();
    } catch (err: any) {
      showToast(err.message || 'Logo upload failed', 'error');
    } finally {
      setLogoUploading(null);
    }
  };

  const handleLogoDelete = async (contractor: Contractor) => {
    if (!confirm('Delete this contractor logo? This will also remove it from the homepage if featured.')) return;
    try {
      setLogoUploading(contractor.id);
      const { error: updateError } = await supabase
        .from('contractor_profiles')
        .update({ logo_url: null, featured_on_homepage: false })
        .eq('id', contractor.id);

      if (updateError) throw updateError;
      showToast('Logo deleted');
      await loadContractors();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete logo', 'error');
    } finally {
      setLogoUploading(null);
    }
  };

  const handleToggleFeatured = async (contractor: Contractor) => {
    if (!contractor.logo_url && !contractor.featured_on_homepage) {
      showToast('Upload a logo before featuring this contractor', 'error');
      return;
    }
    const next = !contractor.featured_on_homepage;
    try {
      setProcessing(contractor.id + '-featured');
      const { error } = await supabase
        .from('contractor_profiles')
        .update({ featured_on_homepage: next })
        .eq('id', contractor.id);
      if (error) throw error;
      showToast(next ? 'Contractor featured on homepage' : 'Removed from homepage');
      await loadContractors();
    } catch (err: any) {
      showToast(err.message || 'Failed to update featured status', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const filtered = contractors.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || c.company_name?.toLowerCase().includes(q) ||
      c.owner_name?.toLowerCase().includes(q) ||
      (c.users?.email || c.email)?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || c.partner_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusBadgeVariant = (s: string) =>
    s === 'active' ? 'default' : s === 'approved' ? 'secondary' : s === 'paused' ? 'outline' : 'outline';

  const conversionRate = (c: Contractor) => {
    if (!c.total_referrals_sent) return '0%';
    return `${Math.round((c.jobs_completed / c.total_referrals_sent) * 100)}%`;
  };

  const adminNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/crm' },
    { id: 'site-editor', label: 'Site Editor', icon: MonitorCog, href: '/admin/crm/site-editor' },
    { id: 'contractors', label: 'Contractors', icon: Users, href: '/admin/crm/contractors' },
    { id: 'applications', label: 'Applications', icon: Clock, href: '/admin/crm/applications' },
    { id: 'job-requests', label: 'Job Requests', icon: FileText, href: '/admin/crm/job-requests' },
    { id: 'realtors', label: 'Realtors', icon: Home, href: '/admin/crm/realtors' },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, href: '/admin/crm/newsletter' },
    { id: 'settings', label: 'Settings', icon: Settings, disabled: true },
  ];

  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-md text-center p-8 rounded-xl border border-gray-200">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-gray-900">Access Denied</h2>
          <Button onClick={handleSignOut} className="mt-4 text-white" style={{ backgroundColor: '#E8621A' }}>Sign Out</Button>
        </div>
      </div>
    );
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-lw-rust" />
      </div>
    );
  }

  return (
    <DashboardLayout
      userName="Admin"
      pageTitle="CONTRACTORS"
      navItems={adminNavItems}
      activeNavId="contractors"
      onLogout={handleSignOut}
      hasNotifications={false}
    >
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="p-6 max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} of {contractors.length} contractors</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Input
            placeholder="Search by name, company, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-xs bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-white border-gray-300 text-gray-900">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 text-gray-900">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadContractors} className="border-gray-300 text-gray-600 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-14 text-center bg-white border-gray-200 shadow-sm">
            <p className="text-gray-400 text-lg">No contractors match your filters.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(contractor => {
              const email = contractor.users?.email || contractor.email;
              const phone = contractor.users?.phone || contractor.phone;
              const isExpanded = expandedId === contractor.id;
              const convRate = parseFloat(conversionRate(contractor));

              return (
                <Card key={contractor.id} className="bg-white border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          {contractor.logo_url && (
                            <div className="w-8 h-8 rounded-md overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0">
                              <img
                                src={contractor.logo_url}
                                alt={contractor.company_name}
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                          )}
                          <h3 className="text-lg font-bold text-gray-900 truncate">{contractor.company_name || '(No name)'}</h3>
                          <Badge variant={statusBadgeVariant(contractor.partner_status)} className="capitalize text-xs">
                            {contractor.partner_status}
                          </Badge>
                          {contractor.tier && contractor.tier !== 'none' && (
                            <Badge variant="outline" className="text-lw-rust border-lw-rust/40 bg-lw-rust/10 text-xs capitalize">
                              {contractor.tier}
                            </Badge>
                          )}
                          {contractor.subscription_status && (
                            <Badge variant="outline" className={`text-xs capitalize ${
                              contractor.subscription_status === 'active'
                                ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                                : 'text-gray-500 border-gray-200 bg-gray-50'
                            }`}>
                              Billing: {contractor.subscription_status}
                            </Badge>
                          )}
                          {contractor.stripe_customer_id && (
                            <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50 text-xs">
                              Stripe
                            </Badge>
                          )}
                          {contractor.featured_on_homepage && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">
                              <Star className="h-3 w-3 mr-1 fill-amber-500" /> Featured
                            </Badge>
                          )}
                          {!contractor.email_notifications_enabled && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">
                              <BellOff className="h-3 w-3 mr-1" /> Emails Off
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${contractor.ironclad_certified ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-red-600 border-red-200 bg-red-50'}`}>
                            <Shield className="h-3 w-3 mr-1" /> {contractor.ironclad_certified ? 'IronClad' : 'IronClad Review'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{contractor.owner_name}</p>

                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                          <a href={`mailto:${email}`} className="text-xs text-gray-400 hover:text-lw-rust flex items-center gap-1 transition-colors">
                            <Mail className="h-3.5 w-3.5" /> {email}
                          </a>
                          {phone && (
                            <a href={`tel:${phone}`} className="text-xs text-gray-400 hover:text-lw-rust flex items-center gap-1 transition-colors">
                              <Phone className="h-3.5 w-3.5" /> {phone}
                            </a>
                          )}
                        </div>

                        {(contractor.counties?.length > 0 || contractor.trades?.length > 0) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {contractor.trades?.slice(0, 4).map((t) => (
                              <span key={t.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-lw-rust/10 text-lw-rust border border-lw-rust/20">
                                <Briefcase className="h-3 w-3" /> {t.name}
                              </span>
                            ))}
                            {contractor.counties?.slice(0, 3).map((c) => (
                              <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
                                {c.name}, {c.state_code}
                              </span>
                            ))}
                            {(contractor.counties?.length > 3 || contractor.trades?.length > 4) && (
                              <span className="text-xs text-gray-400 px-1">+more</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <p className="text-xs text-gray-400 mb-0.5">Referrals</p>
                            <p className="text-base font-bold text-gray-900">{contractor.total_referrals_sent}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <p className="text-xs text-gray-400 mb-0.5">Completed</p>
                            <p className="text-base font-bold text-emerald-600">{contractor.jobs_completed}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <p className="text-xs text-gray-400 mb-0.5">Conv. Rate</p>
                            <p className={`text-base font-bold ${convRate >= 50 ? 'text-emerald-600' : convRate >= 25 ? 'text-amber-500' : 'text-gray-400'}`}>
                              {conversionRate(contractor)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : contractor.id)}
                          className="text-gray-400 hover:text-gray-700 transition-colors p-1"
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50/50 p-5 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5" /> Performance
                          </h4>
                          <div className="space-y-2">
                            {[
                              { label: 'Total Referrals Received', value: contractor.referral_stats.total },
                              { label: 'Client Contacted Contractor', value: contractor.referral_stats.contacted },
                              { label: 'Jobs Hired/Completed', value: contractor.referral_stats.hired },
                              { label: 'Conversion Rate', value: conversionRate(contractor) },
                              { label: 'Avg Quality Rating', value: contractor.ironclad_stats?.avg_quality ?? '–' },
                              { label: 'Avg Professionalism', value: contractor.ironclad_stats?.avg_professionalism ?? '–' },
                              { label: 'Would Request Again', value: contractor.ironclad_stats?.would_request_again_pct ?? '–' },
                              { label: 'Responded Within 24h', value: contractor.ironclad_stats?.responded_24h_pct ?? '–' },
                            ].map(item => (
                              <div key={item.label} className="flex justify-between text-sm">
                                <span className="text-gray-500">{item.label}</span>
                                <span className="font-medium text-gray-900">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5" /> Status Controls
                          </h4>
                          <div className="space-y-2">
                            <Button
                              onClick={() => handleToggleIronClad(contractor)}
                              disabled={!!processing}
                              variant="outline"
                              size="sm"
                              className="w-full border-lw-rust/40 text-lw-rust hover:bg-lw-rust/10"
                            >
                              <Shield className="h-3.5 w-3.5 mr-2" />
                              {contractor.ironclad_certified ? 'Remove IronClad Compliance' : 'Mark IronClad Compliant'}
                            </Button>
                            {contractor.partner_status !== 'paused' && (
                              <Button
                                onClick={() => handleStatusAction(contractor.id, 'pause')}
                                disabled={!!processing}
                                variant="outline"
                                size="sm"
                                className="w-full border-amber-300 text-amber-600 hover:bg-amber-50"
                              >
                                <Pause className="h-3.5 w-3.5 mr-2" /> Pause Contractor
                              </Button>
                            )}
                            {contractor.partner_status !== 'active' && (
                              <Button
                                onClick={() => handleStatusAction(contractor.id, 'activate')}
                                disabled={!!processing}
                                variant="outline"
                                size="sm"
                                className="w-full border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                              >
                                <Play className="h-3.5 w-3.5 mr-2" /> Activate Contractor
                              </Button>
                            )}
                            <Button
                              onClick={() => handleStatusAction(contractor.id, 'remove')}
                              disabled={!!processing}
                              variant="outline"
                              size="sm"
                              className="w-full border-red-200 text-red-500 hover:bg-red-50"
                            >
                              <UserX className="h-3.5 w-3.5 mr-2" /> Remove Contractor
                            </Button>
                            <Button
                              onClick={() => archiveContractor(contractor.id)}
                              disabled={!!processing}
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-300 text-gray-500 hover:bg-gray-50"
                            >
                              <Archive className="h-3.5 w-3.5 mr-2" /> Archive
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* LOGO MANAGEMENT */}
                      <div className="border border-gray-200 rounded-xl p-4 bg-white">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4 flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5" /> Logo & Homepage Feature
                        </h4>

                        <div className="flex flex-wrap items-start gap-5">
                          <div className="flex-shrink-0">
                            {contractor.logo_url ? (
                              <div className="relative group">
                                <div className="w-24 h-16 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                                  <img
                                    src={contractor.logo_url}
                                    alt={contractor.company_name}
                                    className="max-w-full max-h-full object-contain p-1"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                                        '<div class="text-gray-400 text-xs text-center p-2">Image error</div>';
                                    }}
                                  />
                                </div>
                                <div className="flex gap-1.5 mt-2">
                                  <button
                                    onClick={() => setLogoPreviewContractorId(
                                      logoPreviewContractorId === contractor.id ? null : contractor.id
                                    )}
                                    className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors px-2 py-1 rounded border border-gray-200 hover:border-gray-400"
                                  >
                                    <Eye className="h-3 w-3" /> Preview
                                  </button>
                                  <button
                                    onClick={() => handleLogoDelete(contractor)}
                                    disabled={logoUploading === contractor.id}
                                    className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded border border-red-200 hover:border-red-300"
                                  >
                                    <Trash className="h-3 w-3" /> Delete
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="w-24 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-300" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                className="hidden"
                                ref={el => { logoInputRefs.current[contractor.id] = el; }}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handleLogoUpload(contractor, file);
                                  e.target.value = '';
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={logoUploading === contractor.id}
                                onClick={() => logoInputRefs.current[contractor.id]?.click()}
                                className="border-gray-300 text-gray-600 hover:bg-gray-50"
                              >
                                {logoUploading === contractor.id ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                {contractor.logo_url ? 'Replace Logo' : 'Upload Logo'}
                              </Button>
                              <p className="text-xs text-gray-400 mt-1.5">JPG, PNG, or WebP — max 5MB</p>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleToggleFeatured(contractor)}
                                disabled={processing === contractor.id + '-featured'}
                                className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition-all ${
                                  contractor.featured_on_homepage
                                    ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                              >
                                {processing === contractor.id + '-featured' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : contractor.featured_on_homepage ? (
                                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                                ) : (
                                  <StarOff className="h-3.5 w-3.5" />
                                )}
                                {contractor.featured_on_homepage ? 'Featured on Homepage' : 'Feature on Homepage'}
                              </button>

                              {contractor.featured_on_homepage && !contractor.logo_url && (
                                <span className="text-xs text-amber-500 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> No logo — upload one to show on homepage
                                </span>
                              )}

                              {contractor.featured_on_homepage && contractor.partner_status !== 'active' && (
                                <span className="text-xs text-amber-500 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> Status not active — won't appear on homepage
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {logoPreviewContractorId === contractor.id && contractor.logo_url && (
                          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-400 mb-3 font-medium">Homepage preview (on white background)</p>
                            <div className="flex items-center gap-8 overflow-x-auto pb-2">
                              <img
                                src={contractor.logo_url}
                                alt={contractor.company_name}
                                className="h-10 w-auto max-w-[160px] object-contain opacity-70 hover:opacity-100 transition-opacity"
                                onError={(e) => { (e.target as HTMLImageElement).alt = 'Image failed to load'; }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-1.5">
                            <Bell className="h-3.5 w-3.5" /> Email Controls
                          </h4>
                          <div className="space-y-2">
                            <Button
                              onClick={() => handleToggleEmails(contractor)}
                              disabled={!!processing}
                              variant="outline"
                              size="sm"
                              className={`w-full ${contractor.email_notifications_enabled
                                ? 'border-amber-300 text-amber-600 hover:bg-amber-50'
                                : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}`}
                            >
                              {contractor.email_notifications_enabled ? (
                                <><BellOff className="h-3.5 w-3.5 mr-2" /> Disable Email Notifications</>
                              ) : (
                                <><Bell className="h-3.5 w-3.5 mr-2" /> Enable Email Notifications</>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleResendEmail(contractor.id, 'approval')}
                              disabled={processing?.startsWith(contractor.id + '-email')}
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                              {processing === contractor.id + '-email-approval'
                                ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                : <Send className="h-3.5 w-3.5 mr-2" />}
                              Resend Approval Email
                            </Button>
                            <Button
                              onClick={() => handleResendEmail(contractor.id, 'welcome')}
                              disabled={processing?.startsWith(contractor.id + '-email')}
                              variant="outline"
                              size="sm"
                              className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                            >
                              {processing === contractor.id + '-email-welcome'
                                ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                : <Send className="h-3.5 w-3.5 mr-2" />}
                              Resend Welcome Email
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Admin Notes</h4>
                          {contractor.admin_notes ? (
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-2 referraling-relaxed border border-gray-200">
                              {contractor.admin_notes}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 mb-2">No notes yet.</p>
                          )}
                          <Button
                            onClick={() => openNotesDialog(contractor)}
                            variant="outline"
                            size="sm"
                            className="border-gray-300 text-gray-600 hover:bg-gray-50"
                          >
                            Edit Notes
                          </Button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
                            <ShoppingCart className="h-3.5 w-3.5" /> Purchases ({contractor.purchases.length})
                          </h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPurchaseDialog(contractor)}
                            className="border-gray-300 text-gray-600 hover:bg-gray-50"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add
                          </Button>
                        </div>
                        {contractor.purchases.length === 0 ? (
                          <p className="text-sm text-gray-400">No purchases recorded.</p>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-2">
                            {contractor.purchases.slice(0, 6).map(p => (
                              <div key={p.id} className="p-3 rounded-lg bg-white border border-gray-200 text-sm">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-gray-900">{p.item_name}</span>
                                  <Badge variant="outline" className="text-xs">{p.status}</Badge>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>Qty: {p.quantity}</span>
                                  <span>${p.price.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <AdminContractorDocuments contractorId={contractor.id} />
                      </div>

                      <SubscriptionOverride
                        contractorId={contractor.id}
                        contractorName={contractor.company_name}
                        currentStatus={contractor.partner_status}
                        currentTier={contractor.tier || null}
                        adminUserId={adminUserId}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add Purchase — {selectedContractor?.company_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">Purchase Type *</label>
              <Select value={purchaseType} onValueChange={setPurchaseType}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-gray-900">
                  <SelectItem value="badge">Badge</SelectItem>
                  <SelectItem value="decal">Decal</SelectItem>
                  <SelectItem value="marketing_kit">Marketing Kit</SelectItem>
                  <SelectItem value="business_cards">Business Cards</SelectItem>
                  <SelectItem value="yard_sign">Yard Sign</SelectItem>
                  <SelectItem value="vehicle_magnet">Vehicle Magnet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">Item Name *</label>
              <Input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g., IronClad Certified Badge" className="bg-white border-gray-300 text-gray-900" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">Quantity</label>
                <Input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="bg-white border-gray-300 text-gray-900" />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">Price ($)</label>
                <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} className="bg-white border-gray-300 text-gray-900" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">Status</label>
              <Select value={purchaseStatus} onValueChange={setPurchaseStatus}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-gray-900">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-2 block">Notes</label>
              <Textarea value={purchaseNotes} onChange={e => setPurchaseNotes(e.target.value)} rows={3} className="bg-white border-gray-300 text-gray-900" />
            </div>
            <Button onClick={addPurchase} disabled={!!processing} className="w-full text-white" style={{ backgroundColor: '#E8621A' }}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Purchase
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Admin Notes — {selectedContractor?.company_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={adminNotesDraft}
              onChange={e => setAdminNotesDraft(e.target.value)}
              rows={6}
              placeholder="Internal notes about this contractor (not visible to them)..."
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
            />
            <Button onClick={saveAdminNotes} disabled={savingNotes} className="w-full text-white" style={{ backgroundColor: '#E8621A' }}>
              {savingNotes ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Save Notes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
