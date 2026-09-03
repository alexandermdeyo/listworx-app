'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, LogIn, LogOut, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import America250Strip from '@/components/site/America250Strip';
import { cn } from '@/lib/utils';

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

export default function Navigation({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const light = variant === 'light';
  const supabase = useMemo(() => createClient(), []);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [academyEnabled, setAcademyEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'academy_enabled')
        .maybeSingle();
      setAcademyEnabled(data?.value === 'true');
    })();
  }, [supabase]);

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
      <America250Strip variant={variant} />
    <div className={cn('border-b backdrop-blur', light ? 'border-zinc-200 bg-white/95' : 'border-lw-dark-border bg-zinc-900/95')}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/" className="flex items-center" aria-label="ListWorx home">
            <img
              src="/Listworx_wordmark_logo.png"
              alt="ListWorx"
              className="h-8 md:h-10 w-auto"
            />
          </Link>
          <Link href="/ironclad" className="flex items-center shrink-0" aria-label="IronClad Certified Standards">
            <img
              src="/Ironclad_Standards_Logo.png"
              alt="IronClad Standards"
              className="h-9 md:h-11 w-auto"
            />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {light ? (
            <>
              <Link href="/#how-it-works" className="transition-colors text-mkt-ink/80 hover:text-lw-rust mkt-nav-link">
                How It Works
              </Link>
              <Link href="/request" className="transition-colors text-mkt-ink/80 hover:text-lw-rust mkt-nav-link">
                Find a Pro
              </Link>
              <Link href="/contractors" className="transition-colors text-mkt-ink/80 hover:text-lw-rust mkt-nav-link">
                For Contractors
              </Link>
              <Link href="/pricing" className="transition-colors text-mkt-ink/80 hover:text-lw-rust mkt-nav-link">
                Pricing
              </Link>
              <Link href="/ironclad" className="transition-colors text-mkt-ink/80 hover:text-lw-rust mkt-nav-link">
                IronClad Standards
              </Link>
              {academyEnabled && (
                <Link href="/academy" className="transition-colors text-mkt-ink/80 hover:text-lw-rust mkt-nav-link">
                  Academy
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/about" className="transition-colors text-zinc-300 hover:text-white">
                About
              </Link>
              <Link href="/" className="transition-colors text-zinc-300 hover:text-white">
                Home
              </Link>
              <Link href="/realtors" className="transition-colors text-zinc-300 hover:text-white">
                For Realtors & Homeowners
              </Link>
              <Link href="/contractors" className="transition-colors text-zinc-300 hover:text-white">
                For Contractors
              </Link>
              {academyEnabled && (
                <Link href="/academy" className="transition-colors text-zinc-300 hover:text-white">
                  Academy
                </Link>
              )}
              <Link href="/ironclad" className="transition-colors text-lw-rust hover:text-orange-300">
                IronClad Standards
              </Link>
              <Link href="/faq" className="transition-colors text-zinc-300 hover:text-white">
                FAQ
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {!loading && loggedIn ? (
            <>
              {dashboardHref && (
                <Link href={dashboardHref}>
                  <Button
                    variant="outline"
                    className={cn('gap-2', light ? 'border-zinc-300 text-mkt-ink hover:bg-zinc-50' : 'border-lw-dark-border text-zinc-200 hover:bg-lw-dark-card hover:text-white')}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                onClick={handleSignOut}
                className={cn('gap-2', light ? 'text-mkt-ink/80 hover:text-mkt-ink hover:bg-zinc-50' : 'text-zinc-200 hover:text-white')}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : light ? (
            <Link href="/login">
              <Button variant="outlineOrange" className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="gap-2 bg-lw-rust text-white hover:bg-lw-rust-hover border border-lw-rust">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
          {light && (
            <Link href="/request" className="hidden sm:block">
              <Button className="bg-lw-rust text-white hover:bg-lw-rust-hover">
                Find a Contractor
              </Button>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn('md:hidden inline-flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-lw-rust', light ? 'text-mkt-ink/80 hover:bg-zinc-100 hover:text-mkt-ink' : 'text-zinc-300 hover:bg-lw-dark-card hover:text-white')}
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
        <div className={cn('md:hidden border-t', light ? 'border-zinc-200 bg-white' : 'border-lw-dark-border bg-zinc-900')}>
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {light ? (
              <>
                <Link
                  href="/#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-mkt-ink/80 hover:bg-zinc-100 hover:text-mkt-ink"
                >
                  How It Works
                </Link>
                <Link
                  href="/request"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-mkt-ink/80 hover:bg-zinc-100 hover:text-mkt-ink"
                >
                  Find a Pro
                </Link>
                <Link
                  href="/contractors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-mkt-ink/80 hover:bg-zinc-100 hover:text-mkt-ink"
                >
                  For Contractors
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-mkt-ink/80 hover:bg-zinc-100 hover:text-mkt-ink"
                >
                  Pricing
                </Link>
                <Link
                  href="/ironclad"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-mkt-ink/80 hover:bg-zinc-100 hover:text-mkt-ink"
                >
                  IronClad Standards
                </Link>
                {academyEnabled && (
                  <Link
                    href="/academy"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-mkt-ink/80 hover:bg-zinc-100 hover:text-mkt-ink"
                  >
                    Academy
                  </Link>
                )}
                <Link
                  href="/request"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-semibold transition-colors text-lw-rust hover:bg-zinc-100"
                >
                  Find a Contractor
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-zinc-300 hover:bg-lw-dark-card hover:text-white"
                >
                  About
                </Link>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-zinc-300 hover:bg-lw-dark-card hover:text-white"
                >
                  Home
                </Link>
                <Link
                  href="/realtors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-zinc-300 hover:bg-lw-dark-card hover:text-white"
                >
                  For Realtors & Homeowners
                </Link>
                <Link
                  href="/contractors"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-zinc-300 hover:bg-lw-dark-card hover:text-white"
                >
                  For Contractors
                </Link>
                {academyEnabled && (
                  <Link
                    href="/academy"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-zinc-300 hover:bg-lw-dark-card hover:text-white"
                  >
                    Academy
                  </Link>
                )}
                <Link
                  href="/ironclad"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium text-lw-rust transition-colors hover:bg-lw-dark-card hover:text-orange-300"
                >
                  IronClad Standards
                </Link>
                <Link
                  href="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-3 text-base font-medium transition-colors text-zinc-300 hover:bg-lw-dark-card hover:text-white"
                >
                  FAQ
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
    </header>
  );
}
