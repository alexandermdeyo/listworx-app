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
  MonitorCog, LayoutDashboard, Settings, Home,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';
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
  ironcladViolations: number;
  unmatchedJobRequests: number;
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
    ironcladViolations: 0,
    unmatchedJobRequests: 0,
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
        ironcladViolationsRes,
        unmatchedJobRequestsRes,
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
        supabase.from('contractor_profiles').select('id', { count: 'exact', head: true }).eq('archived', false).eq('ironclad_certified', false).in('partner_status', ['approved', 'active']),
        supabase.from('job_requests').select('id', { count: 'exact', head: true }).eq('archived', false).eq('status', 'PENDING'),
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
        ironcladViolations: ironcladViolationsRes.count || 0,
        unmatchedJobRequests: unmatchedJobRequestsRes.count || 0,
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

  const adminNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/crm' },
    { id: 'site-editor', label: 'Site Editor', icon: MonitorCog, href: '/admin/crm/site-editor' },
    { id: 'contractors', label: 'Contractors', icon: Users, href: '/admin/crm/contractors' },
    { id: 'applications', label: 'Applications', icon: Clock, href: '/admin/crm/applications', badge: stats.pendingApplications || undefined },
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
          <p className="text-gray-500 mb-6">Admin privileges required.</p>
          <div className="flex gap-3">
            <Button onClick={() => router.push('/')} variant="outline" className="flex-1">Go Home</Button>
            <Button onClick={handleSignOut} className="flex-1 text-white" style={{ backgroundColor: '#E8621A' }}>Sign Out</Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-lw-rust mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      userName="Admin"
      pageTitle="ADMIN CRM"
      navItems={adminNavItems}
      activeNavId="dashboard"
      onLogout={handleSignOut}
      hasNotifications={stats.pendingApplications > 0}
    >
      <div className="p-6 max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-gray-500 text-sm">System health, referral performance, and quick controls</p>
          </div>
          <Button onClick={loadDashboardStats} variant="outline" size="sm" className="border-gray-300 text-gray-600 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>


        {/* Pending Alerts */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">Pending Alerts</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { href: '/admin/crm/applications', label: 'Pending contractor applications', value: stats.pendingApplications, icon: Clock, tone: 'amber' },
              { href: '/admin/crm/contractors', label: 'IronClad violations flagged', value: stats.ironcladViolations, icon: Shield, tone: 'red' },
              { href: '/admin/crm/job-requests', label: 'Open job requests unmatched', value: stats.unmatchedJobRequests, icon: FileText, tone: 'blue' },
            ].map(item => (
              <Link key={item.label} href={item.href}>
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-lw-rust/40 hover:shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{item.value}</p>
                      <p className="mt-1 text-sm font-medium text-gray-600">{item.label}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-lw-rust/20 bg-lw-rust/10">
                      <item.icon className="h-5 w-5 text-lw-rust" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Referral Performance */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">Referral Performance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Referrals Sent', value: stats.totalReferrals, sub: 'All time', icon: Send, accent: false },
              { label: 'Referrals This Week', value: stats.referralsThisWeek, sub: '7 days', icon: Activity, accent: false },
              { label: 'Clients Contacted', value: stats.referralsContacted, sub: `${contactRate}% rate`, icon: TrendingUp, accent: true, accentColor: '#10b981' },
              { label: 'Jobs Completed', value: stats.referralsHired, sub: `${conversionRate}% conv.`, icon: CheckCircle, accent: true, accentColor: '#22c55e' },
            ].map(item => (
              <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                    <item.icon className="h-4 w-4 text-lw-rust" />
                  </div>
                  <span className="text-xs text-gray-400">{item.sub}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">System Health</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Pending Apps', value: stats.pendingApplications, icon: Clock, warn: stats.pendingApplications > 0 },
              { label: 'Active', value: stats.activeContractors, icon: CheckCircle, ok: true },
              { label: 'Paused', value: stats.pausedContractors, icon: Shield, warn: stats.pausedContractors > 0 },
              { label: 'Emails Off', value: stats.emailsOffCount, icon: Bell, warn: stats.emailsOffCount > 0 },
              { label: 'Job Req (7d)', value: stats.recentJobRequests, icon: FileText },
              { label: 'Requesters', value: stats.totalRealtors, icon: Users },
            ].map(item => (
              <div key={item.label} className={`rounded-lg border p-4 bg-white shadow-sm ${item.warn ? 'border-amber-200' : 'border-gray-200'}`}>
                <item.icon className={`h-4 w-4 mb-2 ${item.warn ? 'text-amber-500' : item.ok ? 'text-emerald-500' : 'text-gray-400'}`} />
                <p className={`text-xl font-bold ${item.warn ? 'text-amber-600' : item.ok ? 'text-emerald-600' : 'text-gray-900'}`}>{item.value}</p>
                <p className="text-xs text-gray-500 mt-0.5 referraling-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Tools */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">Admin Tools</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <DatabaseZap className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Backfill Subscriptions</h3>
                  <p className="text-xs text-gray-500 mt-0.5 referraling-relaxed">
                    Create missing subscription rows for all active contractors. Safe to run multiple times.
                  </p>
                </div>
              </div>
              <Button onClick={runBackfill} disabled={backfillLoading} className="bg-blue-600 hover:bg-blue-700 text-white text-sm flex-shrink-0" size="sm">
                {backfillLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...</> : <><DatabaseZap className="h-4 w-4 mr-2" /> Run Backfill</>}
              </Button>
            </div>

            {backfillResult && (
              <div className={`mt-4 rounded-lg p-4 border text-sm ${backfillResult.errors > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <p className={`font-medium mb-2 ${backfillResult.errors > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{backfillResult.message}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Active Contractors', value: backfillResult.active_contractors_found },
                    { label: 'Already Had Sub', value: backfillResult.already_had_subscriptions },
                    { label: 'Created', value: backfillResult.created_subscriptions },
                    { label: 'Errors', value: backfillResult.errors },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
                      <p className="text-lg font-bold text-gray-900">{item.value}</p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">Quick Navigation</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { href: '/admin/crm/applications', icon: Clock, title: 'Applications', desc: 'Review pending contractor applications', badge: stats.pendingApplications > 0 ? `${stats.pendingApplications} pending` : null },
              { href: '/admin/crm/job-requests', icon: FileText, title: 'Job Requests', desc: 'View requests, referrals, and update referral status', badge: stats.recentJobRequests > 0 ? `${stats.recentJobRequests} this week` : null },
              { href: '/admin/crm/contractors', icon: Users, title: 'Contractors', desc: 'Manage status, performance, and email controls', badge: stats.pausedContractors > 0 ? `${stats.pausedContractors} paused` : null },
              { href: '/admin/crm/realtors', icon: Briefcase, title: 'Requesters', desc: 'Manage homeowners, realtors, and property managers', badge: null },
              { href: '/admin/crm/reviews', icon: Star, title: 'Reviews', desc: 'See client feedback and contractor ratings', badge: null },
              { href: '/admin/crm/media', icon: Video, title: 'Media Library', desc: 'Manage YouTube videos, social content, and featured media', badge: null },
            ].map(item => (
              <Link key={item.title} href={item.href}>
                <div className="rounded-lg border border-gray-200 bg-white p-5 hover:border-lw-rust/30 hover:shadow-md transition-all cursor-pointer group h-full shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-lw-rust/5 flex items-center justify-center border border-lw-rust/10 group-hover:bg-lw-rust/10 transition-colors">
                      <item.icon className="h-5 w-5 text-lw-rust" />
                    </div>
                    {item.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-amber-50 text-amber-600 border-amber-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 referraling-relaxed">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
