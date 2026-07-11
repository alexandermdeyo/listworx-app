'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader as Loader2, CircleAlert as AlertCircle, LogOut, LayoutDashboard, MonitorCog, Users, Clock, FileText, Home, Settings, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navigation from '@/components/Navigation';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  active: boolean;
  subscribed_at: string;
}

export default function NewsletterAdminPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const result = await checkAdminAuth();
    if (!result.ok) {
      if (result.reason === 'not_admin') setAccessDenied(true);
      else router.push('/login?redirect=/admin/crm/newsletter');
      return;
    }
    setIsAuthenticated(true);
    loadSubscribers();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const loadSubscribers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });
    setSubscribers(data || []);
    setLoading(false);
  };

  const exportCSV = () => {
    const rows = [
      ['Email', 'Name', 'Source', 'Active', 'Subscribed At'],
      ...subscribers.map((s) => [
        s.email,
        s.name || '',
        s.source || '',
        s.active ? 'Yes' : 'No',
        new Date(s.subscribed_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = subscribers.filter(
    (s) =>
      !searchQuery ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/crm' },
    { id: 'site-editor', label: 'Site Editor', icon: MonitorCog, href: '/admin/crm/site-editor' },
    { id: 'contractors', label: 'Contractors', icon: Users, href: '/admin/crm/contractors' },
    { id: 'applications', label: 'Applications', icon: Clock, href: '/admin/crm/applications' },
    { id: 'job-requests', label: 'Job Requests', icon: FileText, href: '/admin/crm/job-requests' },
    { id: 'realtors', label: 'Realtors', icon: Home, href: '/admin/crm/realtors' },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, href: '/admin/crm/newsletter' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/crm/settings' },
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
      pageTitle="NEWSLETTER"
      navItems={adminNavItems}
      activeNavId="newsletter"
      onLogout={handleSignOut}
      hasNotifications={false}
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Newsletter Subscribers</h1>
            <p className="text-sm text-gray-500 mt-1">{subscribers.length} total subscriber{subscribers.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={exportCSV} className="text-white" style={{ backgroundColor: '#E8621A' }}>
            Export CSV
          </Button>
        </div>

        <Input
          placeholder="Search by email or name…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Subscribed At</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Source</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    {searchQuery ? 'No subscribers match your search.' : 'No subscribers yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{s.email}</td>
                    <td className="px-4 py-3 text-gray-600">{s.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(s.subscribed_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-500">{s.source || '—'}</td>
                    <td className="px-4 py-3">
                      {/* TODO: wire toggle to update active field via admin Supabase client */}
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
