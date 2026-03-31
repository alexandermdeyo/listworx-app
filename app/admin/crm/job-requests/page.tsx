'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Mail, Phone, MapPin, Loader as Loader2, CircleAlert as AlertCircle, LogOut,
  Archive, Trash2, Users, Send, ChevronDown, ChevronUp, CircleCheck as CheckCircle2,
  RefreshCw, Calendar, Briefcase, PhoneCall, Trophy,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

interface ReferralRow {
  id: string;
  slot_position: number;
  tier_at_referral: string;
  status: string;
  email_sent: boolean;
  email_sent_at: string | null;
  requester_contacted: boolean;
  created_at: string;
  contractor_profiles: {
    id: string;
    company_name: string;
    owner_name: string;
    email: string;
    phone: string;
  } | null;
}

interface JobRequest {
  id: string;
  created_at: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  requester_type: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_county: string;
  property_zip: string;
  job_description: string;
  urgency: string;
  status: string;
  feedback_token: string | null;
  feedback_requested_at: string | null;
  archived: boolean;
  referrals: ReferralRow[];
  categories: Array<{ name: string }>;
}

const REFERRAL_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'text-zinc-400' },
  { value: 'ACCEPTED', label: 'Accepted', color: 'text-blue-400' },
  { value: 'DECLINED', label: 'Declined', color: 'text-red-400' },
  { value: 'CONTACTED', label: 'Client Contacted', color: 'text-emerald-400' },
  { value: 'COMPLETED', label: 'Hired / Complete', color: 'text-green-400' },
];

const statusColors: Record<string, string> = {
  PENDING: 'text-zinc-400 bg-lw-dark-surface/40 border-lw-dark-border/40',
  ACCEPTED: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
  DECLINED: 'text-red-400 bg-red-950/40 border-red-800/40',
  CONTACTED: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
  COMPLETED: 'text-green-400 bg-green-950/40 border-green-800/40',
};

export default function JobRequestsPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<JobRequest | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const router = useRouter();

  useEffect(() => { checkAuth(); }, []);

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
      else router.push('/login?redirect=/admin/crm/job-requests');
      return;
    }
    setIsAuthenticated(true);
    loadJobRequests();
  };

  const handleSignOut = async () => { await signOut(); router.push('/login'); };

  const loadJobRequests = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('job_requests')
        .select(`
          *,
          referrals (
            id,
            slot_position,
            tier_at_referral,
            status,
            email_sent,
            email_sent_at,
            requester_contacted,
            created_at,
            contractor_profiles (
              id,
              company_name,
              owner_name,
              email,
              phone
            )
          )
        `)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (!data) return;

      const withCategories = await Promise.all(
        data.map(async (req) => {
          const { data: cats } = await supabase
            .from('job_request_categories')
            .select('categories(name)')
            .eq('job_request_id', req.id);
          return {
            ...req,
            categories: cats?.map((c: any) => c.categories).filter(Boolean) || [],
            referrals: (req.referrals || []).sort((a: any, b: any) => a.slot_position - b.slot_position),
          } as JobRequest;
        })
      );

      setJobRequests(withCategories);
    } catch (err) {
      console.error('Error loading job requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateReferralStatus = async (referralId: string, status: string) => {
    try {
      setProcessing(referralId);
      const res = await fetch('/api/admin/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId, status }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast('Referral status updated');
      await loadJobRequests();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const resendReferralEmail = async (referralId: string, contractorId: string) => {
    const contractorRef = jobRequests
      .flatMap(j => j.referrals)
      .find(r => r.id === referralId);
    if (!contractorRef) return;

    try {
      setProcessing('resend-' + referralId);
      const res = await fetch('/api/admin/resend-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractorId, type: 'referral', referralId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast('Referral email resent');
      await loadJobRequests();
    } catch (err: any) {
      showToast(err.message || 'Failed to resend email', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const sendFeedbackRequest = async (requestId: string) => {
    try {
      setProcessing(requestId);
      const res = await fetch('/api/send-feedback-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobRequestId: requestId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to send');
      }
      showToast('Feedback request sent');
      await loadJobRequests();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const archiveRequest = async (requestId: string) => {
    if (!confirm('Archive this job request?')) return;
    try {
      setProcessing(requestId);
      await supabase.from('job_requests').update({ archived: true }).eq('id', requestId);
      await loadJobRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm('Permanently delete this job request? This cannot be undone.')) return;
    try {
      setProcessing(requestId);
      await supabase.from('job_requests').delete().eq('id', requestId);
      await loadJobRequests();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const openEmailDialog = (req: JobRequest) => {
    setSelectedRequest(req);
    setEmailSubject('Follow-up regarding your service request');
    setEmailMessage(`Dear ${req.requester_name},\n\n`);
    setEmailDialogOpen(true);
  };

  const sendCustomEmail = () => {
    if (!selectedRequest) return;
    window.location.href = `mailto:${selectedRequest.requester_email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
    setEmailDialogOpen(false);
  };

  const filtered = jobRequests.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      r.requester_name?.toLowerCase().includes(q) ||
      r.requester_email?.toLowerCase().includes(q) ||
      r.property_county?.toLowerCase().includes(q) ||
      r.property_city?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const jobStatusColor: Record<string, string> = {
    PENDING: 'text-amber-400 bg-amber-950/30 border-amber-800/30',
    ASSIGNED: 'text-blue-400 bg-blue-950/30 border-blue-800/30',
    IN_PROGRESS: 'text-sky-400 bg-sky-950/30 border-sky-800/30',
    COMPLETED: 'text-green-400 bg-green-950/30 border-green-800/30',
    CANCELLED: 'text-zinc-400 bg-lw-dark-surface/30 border-lw-dark-border/30',
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-lw-dark flex items-center justify-center">
        <Card className="p-8 max-w-md text-center bg-lw-dark-card border-lw-dark-border">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Access Denied</h2>
          <Button onClick={handleSignOut} className="mt-4">Sign Out</Button>
        </Card>
      </div>
    );
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-lw-dark flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-lw-rust" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lw-dark">
      <Navigation />

      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success'
            ? 'bg-emerald-900/90 border border-emerald-600/40 text-emerald-200'
            : 'bg-red-900/90 border border-red-600/40 text-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin/crm" className="text-zinc-400 hover:text-white text-sm mb-2 inline-block transition-colors">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Job Requests</h1>
            <p className="text-zinc-400 mt-1">{filtered.length} of {jobRequests.length} requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadJobRequests} className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Input
            placeholder="Search by name, email, county..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-xs bg-lw-dark-card border-lw-dark-border text-white placeholder:text-zinc-500"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-lw-dark-card border-lw-dark-border text-white">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-lw-dark-card border-lw-dark-border text-white">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card className="p-14 text-center bg-lw-dark-card border-lw-dark-border">
            <p className="text-zinc-400 text-lg">No job requests match your filters.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(req => {
              const isExpanded = expandedId === req.id;
              const totalHired = req.referrals.filter(r => r.status === 'COMPLETED').length;

              return (
                <Card key={req.id} className="bg-lw-dark-card border-lw-dark-border/60 overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white">{req.requester_name}</h3>
                          <Badge variant="outline" className="text-xs capitalize text-zinc-300 border-lw-dark-border/80">
                            {req.requester_type}
                          </Badge>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${jobStatusColor[req.status] || jobStatusColor.PENDING}`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5">
                          <a href={`mailto:${req.requester_email}`} className="text-xs text-zinc-400 hover:text-lw-rust flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" /> {req.requester_email}
                          </a>
                          <a href={`tel:${req.requester_phone}`} className="text-xs text-zinc-400 hover:text-lw-rust flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" /> {req.requester_phone}
                          </a>
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {req.property_county ? `${req.property_county} County, ` : ''}{req.property_state}
                          </span>
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        {req.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {req.categories.map((cat, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-lw-rust/10 border border-lw-rust/20 text-lw-rust flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> {cat.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-center">
                          <div className="bg-lw-dark-surface/60 rounded-lg px-3 py-1.5">
                            <p className="text-xs text-zinc-500">Referrals</p>
                            <p className="text-sm font-bold text-white">{req.referrals.length}</p>
                          </div>
                          {totalHired > 0 && (
                            <div className="bg-emerald-950/40 rounded-lg px-3 py-1.5 border border-emerald-800/30">
                              <p className="text-xs text-emerald-500">Hired</p>
                              <p className="text-sm font-bold text-emerald-400">{totalHired}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : req.id)}
                          className="text-zinc-400 hover:text-white transition-colors p-1"
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-lw-dark-border/60 bg-lw-dark/30 p-5 space-y-6">
                      {req.job_description && (
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Project Description</h4>
                          <p className="text-sm text-zinc-300 leading-relaxed">{req.job_description}</p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> Assigned Contractors ({req.referrals.length})
                        </h4>
                        {req.referrals.length === 0 ? (
                          <p className="text-sm text-zinc-500">No contractors were matched for this request.</p>
                        ) : (
                          <div className="space-y-3">
                            {req.referrals.map(ref => {
                              const contractor = ref.contractor_profiles;
                              const statusInfo = REFERRAL_STATUS_OPTIONS.find(s => s.value === ref.status);

                              return (
                                <div key={ref.id} className="rounded-xl border border-lw-dark-border/40 bg-lw-dark-surface/30 p-4">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-zinc-500">#{ref.slot_position}</span>
                                        <span className="text-sm font-semibold text-white">
                                          {contractor?.company_name || '(Unknown)'}
                                        </span>
                                        <Badge variant="outline" className="text-xs text-lw-rust border-lw-rust/30 bg-lw-rust/10">
                                          {ref.tier_at_referral}
                                        </Badge>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[ref.status] || statusColors.PENDING}`}>
                                          {statusInfo?.label || ref.status}
                                        </span>
                                        {ref.email_sent && (
                                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                                            <Send className="h-3 w-3" /> Email sent
                                          </span>
                                        )}
                                      </div>
                                      {contractor && (
                                        <div className="flex flex-wrap gap-x-4 text-xs text-zinc-400 mt-1">
                                          <span>{contractor.owner_name}</span>
                                          {contractor.email && (
                                            <a href={`mailto:${contractor.email}`} className="hover:text-lw-rust">{contractor.email}</a>
                                          )}
                                          {contractor.phone && (
                                            <a href={`tel:${contractor.phone}`} className="hover:text-lw-rust">{contractor.phone}</a>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 items-center">
                                      <Select
                                        value={ref.status}
                                        onValueChange={val => updateReferralStatus(ref.id, val)}
                                        disabled={processing === ref.id}
                                      >
                                        <SelectTrigger className="h-8 w-44 bg-lw-dark-surface border-lw-dark-border/80 text-white text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-lw-dark-card border-lw-dark-border text-white">
                                          {REFERRAL_STATUS_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value} className={`text-xs ${opt.color}`}>
                                              {opt.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {processing === ref.id && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}

                                      {contractor && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 border-lw-dark-border/80 text-zinc-300 hover:bg-lw-dark-surface text-xs"
                                          onClick={() => resendReferralEmail(ref.id, contractor.id)}
                                          disabled={processing === 'resend-' + ref.id}
                                        >
                                          {processing === 'resend-' + ref.id
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <Send className="h-3.5 w-3.5 mr-1" />}
                                          Resend
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-lw-dark-border/40">
                        <Button
                          onClick={() => openEmailDialog(req)}
                          variant="outline"
                          size="sm"
                          className="border-lw-dark-border/80 text-zinc-300 hover:bg-lw-dark-surface"
                        >
                          <Mail className="h-3.5 w-3.5 mr-2" /> Email Requester
                        </Button>

                        {req.feedback_token && !req.feedback_requested_at && (
                          <Button
                            onClick={() => sendFeedbackRequest(req.id)}
                            disabled={processing === req.id}
                            variant="outline"
                            size="sm"
                            className="border-lw-dark-border/80 text-zinc-300 hover:bg-lw-dark-surface"
                          >
                            {processing === req.id
                              ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                              : <Send className="h-3.5 w-3.5 mr-2" />}
                            Request Feedback
                          </Button>
                        )}

                        {req.feedback_requested_at && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-800/30 bg-emerald-950/30">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Feedback Requested
                          </span>
                        )}

                        <Button
                          onClick={() => archiveRequest(req.id)}
                          disabled={processing === req.id}
                          variant="outline"
                          size="sm"
                          className="border-lw-dark-border/80 text-zinc-400 hover:bg-lw-dark-surface ml-auto"
                        >
                          <Archive className="h-3.5 w-3.5 mr-2" /> Archive
                        </Button>

                        <Button
                          onClick={() => deleteRequest(req.id)}
                          disabled={processing === req.id}
                          variant="outline"
                          size="sm"
                          className="border-red-800/40 text-red-400 hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="bg-lw-dark-card border-lw-dark-border">
          <DialogHeader>
            <DialogTitle className="text-white">Email — {selectedRequest?.requester_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-2 block">Subject</label>
              <Input
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="bg-lw-dark-surface border-lw-dark-border text-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-2 block">Message</label>
              <Textarea
                value={emailMessage}
                onChange={e => setEmailMessage(e.target.value)}
                rows={6}
                className="bg-lw-dark-surface border-lw-dark-border text-white"
              />
            </div>
            <Button onClick={sendCustomEmail} className="w-full bg-lw-rust hover:bg-lw-rust-hover text-white">
              Open in Email Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
