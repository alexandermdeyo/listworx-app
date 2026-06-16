'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, LogIn, LogOut, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import America250Strip from '@/components/site/America250Strip';

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
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

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

      const resolvedRole = (appUser?.role as Role) || null;

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

        if (status === 'active' || status === 'approved') {
          setDashboardHref('/contractor-dashboard');
        } else {
          setDashboardHref(null);
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

      void load();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    setLoggedIn(false);
    setDashboardHref(null);
    setLoading(false);

    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch {
      // ignore
    }

    window.location.replace('/');
  };

  return (
    <header className="sticky top-0 z-40">
      <America250Strip />
    <div className="border-b border-lw-dark-border bg-zinc-900/95 backdrop-blur">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center" aria-label="ListWorx home">
          <img
            src="/Listworx_wordmark_logo.png"
            alt="ListWorx"
            className="h-8 md:h-10 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            href="/about"
            className="text-zinc-300 hover:text-white transition-colors"
          >
            About
          </Link>
          <Link
            href="/"
            className="text-zinc-300 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link
            href="/realtors"
            className="text-zinc-300 hover:text-white transition-colors"
          >
            For Realtors & Homeowners
          </Link>
          <Link
            href="/contractors"
            className="text-zinc-300 hover:text-white transition-colors"
          >
            For Contractors
          </Link>
          <Link
            href="/ironclad"
            className="text-lw-rust hover:text-orange-300 transition-colors"
          >
            IronClad Standards
          </Link>
          <Link
            href="/faq"
            className="text-zinc-300 hover:text-white transition-colors"
          >
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {!loading && loggedIn ? (
            <>
              {dashboardHref && (
                <Link href={dashboardHref}>
                  <Button
                    variant="outline"
                    className="gap-2 border-lw-dark-border text-zinc-200 hover:bg-lw-dark-card hover:text-white"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="gap-2 text-zinc-200 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button className="gap-2 bg-lw-rust text-white hover:bg-lw-rust-hover border border-lw-rust">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-zinc-300 hover:bg-lw-dark-card hover:text-white focus:outline-none focus:ring-2 focus:ring-lw-rust"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-lw-dark-border bg-zinc-900">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-3 text-base font-medium text-zinc-300 hover:bg-lw-dark-card hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-3 text-base font-medium text-zinc-300 hover:bg-lw-dark-card hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/realtors"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-3 text-base font-medium text-zinc-300 hover:bg-lw-dark-card hover:text-white transition-colors"
            >
              For Realtors & Homeowners
            </Link>
            <Link
              href="/contractors"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-3 text-base font-medium text-zinc-300 hover:bg-lw-dark-card hover:text-white transition-colors"
            >
              For Contractors
            </Link>
            <Link
              href="/ironclad"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-3 text-base font-medium text-lw-rust hover:bg-lw-dark-card hover:text-orange-300 transition-colors"
            >
              IronClad Standards
            </Link>
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-md px-3 py-3 text-base font-medium text-zinc-300 hover:bg-lw-dark-card hover:text-white transition-colors"
            >
              FAQ
            </Link>
          </nav>
        </div>
      )}
    </div>
    </header>
  );
}
