'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CircleCheck as CheckCircle, Clock, Users, FileText, Star,
  Loader as Loader2, CircleAlert as AlertCircle, ChartBar as BarChart3,
  LogOut, Mail, Send, Briefcase, TrendingUp, Activity,
  Shield, Bell, RefreshCw, Video, BookOpen, DatabaseZap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { PageShell } from '@/components/design-system';

interface DashboardStats {
  pendingApplications: number;
  recentJobRequests: number;
  totalRealtors: number;
  totalContractors: number;
  totalReferrals: number;
  referralsThisWeek: number;
  referralsContacted: number;
  referralsHired: number;
  activeContractors: number;
  pausedContractors: number;
  emailsOffCount: number;
}

export default function AdminCRMPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillResult, setBackfillResult] = useState<{
    message: string;
    active_contractors_found: number;
    already_had_subscriptions: number;
    created_subscriptions: number;
    errors: number;
  } | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    pendingApplications: 0,
    recentJobRequests: 0,
    totalRealtors: 0,
    totalContractors: 0,
    totalReferrals: 0,
    referralsThisWeek: 0,
    referralsContacted: 0,
    referralsHired: 0,
    activeContractors: 0,
    pausedContractors: 0,
    emailsOffCount: 0,
  });
  const router = useRouter();

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    const result = await checkAdminAuth();
    if (!result.ok) {
      if (result.reason === 'not_admin') {
        setAccessDenied(true);
        setIsAuthenticated(false);
      } else {
        router.push('/login?redirect=/admin/crm');
      }
      return;
    }
    setIsAuthenticated(true);
    setAccessDenied(false);
    loadDashboardStats();
  };

  const handleSignOut = async () => {
    try { await signOut(); router.push('/login'); } catch (e) { console.error(e); }
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        applicationsRes,
        jobRequestsRes,
        realtorsRes,
        totalContractorsRes,
        activeContractorsRes,
        pausedContractorsRes,
        emailsOffRes,
        totalReferralsRes,
        weekReferralsRes,
        contactedReferralsRes,
        hiredReferralsRes,
      ] = await Promise.all([
        supabase.from('contractor_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('job_requests').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('realtor_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('contractor_profiles').select('id', { count: 'exact', head: true }).eq('archived', false),
        supabase.from('contractor_profiles').select('id', { count: 'exact', head: true }).eq('partner_status', 'active'),
        supabase.from('contractor_profiles').select('id', { count: 'exact', head: true }).eq('partner_status', 'paused'),
        supabase.from('contractor_profiles').select('id', { count: 'exact', head: true }).eq('email_notifications_enabled', false),
        supabase.from('referrals').select('id', { count: 'exact', head: true }),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).in('status', ['CONTACTED', 'CLOSED']),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('status', 'CLOSED'),
      ]);

      setStats({
        pendingApplications: applicationsRes.count || 0,
        recentJobRequests: jobRequestsRes.count || 0,
        totalRealtors: realtorsRes.count || 0,
        totalContractors: totalContractorsRes.count || 0,
        activeContractors: activeContractorsRes.count || 0,
        pausedContractors: pausedContractorsRes.count || 0,
        emailsOffCount: emailsOffRes.count || 0,
        totalReferrals: totalReferralsRes.count || 0,
        referralsThisWeek: weekReferralsRes.count || 0,
        referralsContacted: contactedReferralsRes.count || 0,
        referralsHired: hiredReferralsRes.count || 0,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const runBackfill = async () => {
    setBackfillLoading(true);
    setBackfillResult(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch('/api/admin/backfill-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setBackfillResult({ message: data.error || 'Backfill failed', active_contractors_found: 0, already_had_subscriptions: 0, created_subscriptions: 0, errors: 1 });
      } else {
        setBackfillResult(data);
      }
    } catch (err) {
      setBackfillResult({ message: 'Network error running backfill', active_contractors_found: 0, already_had_subscriptions: 0, created_subscriptions: 0, errors: 1 });
    } finally {
      setBackfillLoading(false);
    }
  };

  const conversionRate = stats.totalReferrals > 0
    ? Math.round((stats.referralsHired / stats.totalReferrals) * 100)
    : 0;

  const contactRate = stats.totalReferrals > 0
    ? Math.round((stats.referralsContacted / stats.totalReferrals) * 100)
    : 0;

  if (accessDenied) {
    return (
      <PageShell surface="dark" className="flex items-center justify-center">
        <Card className="p-8 max-w-md text-center bg-lw-dark-card border-lw-dark-border">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-red-950/30 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Access Denied</h2>
          <p className="text-zinc-400 mb-6">Admin privileges required.</p>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/')} variant="outline" className="flex-1 border-lw-dark-border text-zinc-300">Go Home</Button>
            <Button onClick={handleSignOut} className="flex-1 bg-lw-rust hover:bg-lw-rust-hover text-white">Sign Out</Button>
          </div>
        </Card>
      </PageShell>
    );
  }

  if (loading || !isAuthenticated) {
    return (
      <PageShell surface="dark" className="flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-lw-rust mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">Loading dashboard...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell surface="dark">
      <Navigation />

      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin CRM</h1>
            <p className="text-zinc-400 mt-1">System health, referral performance, and quick controls</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadDashboardStats} variant="outline" size="sm" className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="border-lw-dark-border text-zinc-300 hover:bg-lw-dark-surface">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-4">Referral Performance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-lw-dark-border/50 bg-lw-dark-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-lw-rust/10 flex items-center justify-center">
                  <Send className="h-4.5 w-4.5 text-lw-rust" />
                </div>
                <span className="text-xs text-zinc-500">All time</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Total Referrals Sent</p>
            </div>

            <div className="rounded-2xl border border-lw-dark-border/50 bg-lw-dark-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-blue-950/40 flex items-center justify-center">
                  <Activity className="h-4.5 w-4.5 text-blue-400" />
                </div>
                <span className="text-xs text-zinc-500">7 days</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.referralsThisWeek}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Referrals This Week</p>
            </div>

            <div className="rounded-2xl border border-emerald-800/30 bg-emerald-950/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-950/40 flex items-center justify-center">
                  <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                </div>
                <span className="text-xs text-emerald-600">{contactRate}% rate</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{stats.referralsContacted}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Client Contacted Contractor</p>
            </div>

            <div className="rounded-2xl border border-green-800/30 bg-green-950/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-green-950/40 flex items-center justify-center">
                  <CheckCircle className="h-4.5 w-4.5 text-green-400" />
                </div>
                <span className="text-xs text-green-600">{conversionRate}% conv.</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{stats.referralsHired}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Jobs Hired / Completed</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-4">System Health</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Pending Applications', value: stats.pendingApplications, color: stats.pendingApplications > 0 ? 'text-amber-400' : 'text-zinc-400', icon: Clock, alert: stats.pendingApplications > 0 },
              { label: 'Active Contractors', value: stats.activeContractors, color: 'text-emerald-400', icon: CheckCircle },
              { label: 'Paused Contractors', value: stats.pausedContractors, color: stats.pausedContractors > 0 ? 'text-amber-400' : 'text-zinc-400', icon: Shield },
              { label: 'Emails Disabled', value: stats.emailsOffCount, color: stats.emailsOffCount > 0 ? 'text-amber-400' : 'text-zinc-400', icon: Bell, alert: stats.emailsOffCount > 0 },
              { label: 'Job Requests (7d)', value: stats.recentJobRequests, color: 'text-blue-400', icon: FileText },
              { label: 'Total Requesters', value: stats.totalRealtors, color: 'text-zinc-300', icon: Users },
            ].map(item => (
              <div key={item.label} className={`rounded-xl border p-4 bg-lw-dark-card ${item.alert ? 'border-amber-800/40' : 'border-lw-dark-border/50'}`}>
                <item.icon className={`h-4 w-4 mb-2 ${item.color}`} />
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-4">Admin Tools</h2>
          <div className="rounded-2xl border border-lw-dark-border/50 bg-lw-dark-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-950/40 flex items-center justify-center flex-shrink-0">
                  <DatabaseZap className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Backfill Subscriptions</h3>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Create missing subscription rows for all active contractors. Safe to run multiple times — skips contractors that already have a subscription.
                  </p>
                </div>
              </div>
              <Button
                onClick={runBackfill}
                disabled={backfillLoading}
                className="bg-blue-700 hover:bg-blue-600 text-white text-sm flex-shrink-0"
                size="sm"
              >
                {backfillLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...</>
                ) : (
                  <><DatabaseZap className="h-4 w-4 mr-2" /> Run Backfill</>
                )}
              </Button>
            </div>

            {backfillResult && (
              <div className={`mt-4 rounded-xl p-4 border text-sm ${backfillResult.errors > 0 ? 'bg-red-950/20 border-red-800/40' : 'bg-emerald-950/20 border-emerald-800/40'}`}>
                <p className={`font-medium mb-2 ${backfillResult.errors > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {backfillResult.message}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Active Contractors', value: backfillResult.active_contractors_found },
                    { label: 'Already Had Sub', value: backfillResult.already_had_subscriptions },
                    { label: 'Created', value: backfillResult.created_subscriptions },
                    { label: 'Errors', value: backfillResult.errors },
                  ].map(item => (
                    <div key={item.label} className="bg-lw-dark-card/60 rounded-lg p-2.5 text-center">
                      <p className="text-lg font-bold text-white">{item.value}</p>
                      <p className="text-xs text-zinc-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-4">Quick Navigation</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                href: '/admin/crm/applications',
                icon: Clock,
                title: 'Applications',
                desc: 'Review pending contractor applications',
                badge: stats.pendingApplications > 0 ? `${stats.pendingApplications} pending` : null,
                badgeColor: 'bg-amber-950/40 text-amber-400 border-amber-800/40',
              },
              {
                href: '/admin/crm/job-requests',
                icon: FileText,
                title: 'Job Requests',
                desc: 'View requests, referrals, and update lead status',
                badge: stats.recentJobRequests > 0 ? `${stats.recentJobRequests} this week` : null,
                badgeColor: 'bg-blue-950/40 text-blue-400 border-blue-800/40',
              },
              {
                href: '/admin/crm/contractors',
                icon: Users,
                title: 'Contractors',
                desc: 'Manage status, performance, and email controls',
                badge: stats.pausedContractors > 0 ? `${stats.pausedContractors} paused` : null,
                badgeColor: 'bg-amber-950/40 text-amber-400 border-amber-800/40',
              },
              {
                href: '/admin/crm/realtors',
                icon: Briefcase,
                title: 'Requesters',
                desc: 'Manage homeowners, realtors, and property managers',
                badge: null,
                badgeColor: '',
              },
              {
                href: '/admin/crm/reviews',
                icon: Star,
                title: 'Reviews',
                desc: 'See client feedback and contractor ratings',
                badge: null,
                badgeColor: '',
              },
              {
                href: '/admin/crm/contractors',
                icon: Bell,
                title: 'Email Controls',
                desc: 'Toggle notifications and resend emails per contractor',
                badge: stats.emailsOffCount > 0 ? `${stats.emailsOffCount} off` : null,
                badgeColor: 'bg-amber-950/40 text-amber-400 border-amber-800/40',
              },
              {
                href: '/admin/crm/media',
                icon: Video,
                title: 'Media Library',
                desc: 'Manage YouTube videos, social content, and featured media',
                badge: null,
                badgeColor: '',
              },
              {
                href: '/admin/crm/blog',
                icon: BookOpen,
                title: 'Blog',
                desc: 'Write and publish articles, guides, and company updates',
                badge: null,
                badgeColor: '',
              },
            ].map(item => (
              <Link key={item.href + item.title} href={item.href}>
                <div className="rounded-2xl border border-lw-dark-border/50 bg-lw-dark-card p-5 hover:border-lw-rust/40 hover:bg-lw-dark-surface/50 transition-all cursor-pointer group h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-lw-rust/10 flex items-center justify-center group-hover:bg-lw-rust/20 transition-colors">
                      <item.icon className="h-5 w-5 text-lw-rust" />
                    </div>
                    {item.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
