'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader as Loader2,
  CircleAlert as AlertCircle,
  LayoutDashboard,
  MonitorCog,
  Users,
  Clock,
  FileText,
  Home,
  Settings,
  Mail,
  GraduationCap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Navigation from '@/components/Navigation';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';

export default function AdminSettingsPage() {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const [academyEnabled, setAcademyEnabled] = useState(false);
  const [academySaving, setAcademySaving] = useState(false);

  useEffect(() => {
    void checkAuth();
  }, []);

  async function checkAuth() {
    const result = await checkAdminAuth();
    if (!result.ok) {
      if (result.reason === 'not_admin') setAccessDenied(true);
      else router.push('/login?redirect=/admin/crm/settings');
      return;
    }
    setIsAuthenticated(true);
    setAdminUserId(result.user.id);
    await loadSettings();
  }

  async function loadSettings() {
    setLoading(true);
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'academy_enabled')
      .maybeSingle();
    setAcademyEnabled(data?.value === 'true');
    setLoading(false);
  }

  async function handleAcademyToggle(value: boolean) {
    setAcademyEnabled(value);
    setAcademySaving(true);

    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          value: value ? 'true' : 'false',
          updated_at: new Date().toISOString(),
          updated_by: adminUserId,
        })
        .eq('key', 'academy_enabled');

      if (error) throw error;

      toast({
        title: 'Setting saved',
        description: value
          ? 'Academy is now enabled for all contractors.'
          : 'Academy is now disabled for all contractors.',
      });
    } catch (err: any) {
      setAcademyEnabled(!value);
      toast({ title: 'Could not save setting', description: err.message || 'Please try again.' });
    } finally {
      setAcademySaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push('/login');
  }

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
          <Button onClick={handleSignOut} className="mt-4 text-white" style={{ backgroundColor: '#E8621A' }}>
            Sign Out
          </Button>
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
      pageTitle="SETTINGS"
      navItems={adminNavItems}
      activeNavId="settings"
      onLogout={handleSignOut}
      hasNotifications={false}
    >
      <div className="p-6 space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Sitewide feature toggles.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-1">
            <GraduationCap className="h-5 w-5 text-lw-rust mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Academy / ACES Integration</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Enables Academy tab for all contractors and makes the ACES partner page visible sitewide.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <Switch
              checked={academyEnabled}
              onCheckedChange={handleAcademyToggle}
              disabled={academySaving}
              id="academy-enabled-toggle"
            />
            <Label htmlFor="academy-enabled-toggle" className="cursor-pointer">
              {academyEnabled ? 'Enabled' : 'Disabled'}
            </Label>
            {academySaving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
        </div>
      </div>
      <Toaster />
    </DashboardLayout>
  );
}
