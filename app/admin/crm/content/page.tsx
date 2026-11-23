'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader as Loader2, CircleAlert as AlertCircle, LayoutDashboard, MonitorCog, Users, Clock, FileText, Home, Settings, Mail, PenLine, ClipboardCheck, Images } from 'lucide-react';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';
import ContentManager from '@/components/admin/content/ContentManager';

export default function ContentAdminPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await checkAdminAuth();
      if (!result.ok) {
        if (result.reason === 'not_admin') setAccessDenied(true);
        else router.push('/login?redirect=/admin/crm/content');
        return;
      }
      setReady(true);
    })();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const adminNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/admin/crm' },
    { id: 'site-editor', label: 'Site Editor', icon: MonitorCog, href: '/admin/crm/site-editor' },
    { id: 'contractors', label: 'Contractors', icon: Users, href: '/admin/crm/contractors' },
    { id: 'applications', label: 'Applications', icon: Clock, href: '/admin/crm/applications' },
    { id: 'job-requests', label: 'Job Requests', icon: FileText, href: '/admin/crm/job-requests' },
    { id: 'realtors', label: 'Realtors', icon: Home, href: '/admin/crm/realtors' },
    { id: 'blog', label: 'Blog', icon: PenLine, href: '/admin/crm/blog' },
    { id: 'content', label: 'Content', icon: ClipboardCheck, href: '/admin/crm/content' },
    { id: 'photos', label: 'Photos', icon: Images, href: '/admin/crm/photos' },
    { id: 'newsletter', label: 'Newsletter', icon: Mail, href: '/admin/crm/newsletter' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/crm/settings' },
  ];

  if (accessDenied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="max-w-md text-center p-8 rounded-xl border border-gray-200">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-gray-900">Access Denied</h2>
          <Button onClick={handleSignOut} className="mt-4 text-white" style={{ backgroundColor: '#F26A21' }}>Sign Out</Button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-lw-rust" />
      </div>
    );
  }

  return (
    <DashboardLayout userName="Admin" pageTitle="CONTENT" navItems={adminNavItems} activeNavId="content" onLogout={handleSignOut} hasNotifications={false}>
      <div className="p-6">
        <ContentManager />
      </div>
    </DashboardLayout>
  );
}
