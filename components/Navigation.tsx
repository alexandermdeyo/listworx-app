'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';

type Role =
  | 'ADMIN'
  | 'CONTRACTOR'
  | 'REALTOR'
  | 'HOMEOWNER'
  | 'PROPERTY_MANAGER'
  | null;

function isRequestorRole(role: Role) {
  return (
    role === 'REALTOR' ||
    role === 'HOMEOWNER' ||
    role === 'PROPERTY_MANAGER'
  );
}

export default function Navigation() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async (sessionOverride?: Session | null) => {
      setLoading(true);

      const session =
        sessionOverride ??
        (
          await supabase.auth.getSession()
        ).data.session;

      if (!mounted) return;

      if (!session?.user) {
        setLoggedIn(false);
        setDashboardHref(null);
        setLoading(false);
        return;
      }

      setLoggedIn(true);

      const userId = session.user.id;

      const [{ data: appUser }, { data: contractor }] = await Promise.all([
        supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('contractor_profiles')
          .select('partner_status')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const metadataRole = ((session.user.user_metadata?.role as string | undefined) || '')
        .toUpperCase() as Role;
      const resolvedRole = (appUser?.role as Role) || metadataRole || null;

      if (resolvedRole === 'ADMIN') {
        setDashboardHref('/admin/crm');
        setLoading(false);
        return;
      }

      if (resolvedRole === 'CONTRACTOR' || contractor) {
        const status = (contractor?.partner_status || '')
          .toString()
          .trim()
          .toLowerCase();

        if (status === 'approved') {
          setDashboardHref('/billing');
        } else {
          setDashboardHref('/contractor-dashboard');
        }

        setLoading(false);
        return;
      }

      if (isRequestorRole(resolvedRole)) {
        setDashboardHref('/requestor-dashboard');
        setLoading(false);
        return;
      }

      setDashboardHref(null);
      setLoading(false);
    };

    void load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        setLoggedIn(false);
        setDashboardHref(null);
        setLoading(false);
        return;
      }

      setLoggedIn(true);
      void load(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, supabase]);

  const handleSignOut = async () => {
    setLoggedIn(false);
    setDashboardHref(null);
    setLoading(false);

    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // ignore
    }

    sessionStorage.removeItem('listworx_requestor_prefill');
    sessionStorage.removeItem('listworx_contractor_prefill');
    router.replace('/');
    router.refresh();
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/Listworx_wordmark_logo.png"
            alt="ListWorx"
            width={220}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="/about"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            href="/#how-it-works"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/realtors"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            For Realtors & Homeowners
          </Link>
          <Link
            href="/contractors"
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            For Contractors
          </Link>
          <Link
            href="/ironclad"
            className="text-lw-rust hover:text-lw-rust-hover transition-colors"
          >
            IronClad Standards
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {!loading && loggedIn ? (
            <>
              {dashboardHref && (
                <Link href={dashboardHref}>
                  <Button
                    variant="outline"
                    className="gap-2 border-lw-border-light text-foreground hover:bg-white hover:text-lw-rust"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="gap-2 text-foreground hover:text-lw-rust"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button className="gap-2 bg-lw-rust text-white hover:bg-white hover:text-lw-rust border border-lw-rust">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
