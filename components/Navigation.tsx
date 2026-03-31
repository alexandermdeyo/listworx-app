'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';

type Role = 'ADMIN' | 'CONTRACTOR' | 'USER' | null;

export default function Navigation() {
  const supabase = createClient();
  const router = useRouter();

  const [role, setRole] = useState<Role>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setLoggedIn(false);
        setRole(null);
        setLoading(false);
        return;
      }

      setLoggedIn(true);

      const { data: appUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      setRole((appUser?.role as Role) || null);
      setLoading(false);
    };

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const dashboardHref =
    role === 'ADMIN'
      ? '/admin/crm'
      : role === 'CONTRACTOR'
      ? '/contractor-dashboard'
      : '/requestor-dashboard';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
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
          <Link href="/about" className="text-foreground/80 hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/realtors" className="text-foreground/80 hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="/realtors" className="text-foreground/80 hover:text-foreground transition-colors">
            For Realtors & Homeowners
          </Link>
          <Link href="/contractors" className="text-foreground/80 hover:text-foreground transition-colors">
            For Contractors
          </Link>
          <Link href="/ironclad" className="text-lw-rust hover:text-lw-rust-hover transition-colors">
            IronClad Standards
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {!loading && loggedIn ? (
            <>
              <Link href={dashboardHref}>
                <Button variant="outline" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="gap-2">
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