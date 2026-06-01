'use client';

import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  badge?: number;
  badgeLabel?: string;
  disabled?: boolean;
  isLogout?: boolean;
}

interface DashboardLayoutProps {
  userName: string;
  tierBadge?: string | null;
  pageTitle: string;
  navItems: NavItem[];
  activeNavId: string;
  onLogout: () => void;
  hasNotifications?: boolean;
  children: ReactNode;
}

const INACTIVE_MS      = 30 * 60 * 1000; // 30 minutes
const WARN_BEFORE_MS   =  5 * 60 * 1000; // warn 5 min before → at 25 min mark
const ACTIVITY_EVENTS  = ['mousemove', 'keydown', 'click', 'scroll'] as const;

export default function DashboardLayout({
  userName,
  tierBadge,
  pageTitle,
  navItems,
  activeNavId,
  onLogout,
  hasNotifications = false,
  children,
}: DashboardLayoutProps) {
  const router                      = useRouter();
  const supabase                    = useRef(createClient());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const inactiveTimer               = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (inactiveTimer.current) clearTimeout(inactiveTimer.current);
    if (warnTimer.current)    clearTimeout(warnTimer.current);
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();
    setShowTimeoutWarning(false);

    warnTimer.current = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, INACTIVE_MS - WARN_BEFORE_MS);

    inactiveTimer.current = setTimeout(async () => {
      setShowTimeoutWarning(false);
      try { await supabase.current.auth.signOut(); } catch {}
      router.replace('/login');
    }, INACTIVE_MS);
  }, [clearTimers, router]);

  const resetTimers = useCallback(() => {
    startTimers();
  }, [startTimers]);

  // ── Desktop: 30-min inactivity timeout ──────────────────────────────────────
  useEffect(() => {
    startTimers();

    const handler = () => resetTimers();
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handler));
    };
  }, [startTimers, resetTimers, clearTimers]);

  // ── Mobile: sign out on page hide (tab switch / app background on touch devices) ──
  useEffect(() => {
    const isTouchDevice = navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    async function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        try { await supabase.current.auth.signOut(); } catch {}
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Barlow', Arial, sans-serif" }}>

      {/* Mobile overlay — sits above content, behind sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Inactivity warning banner */}
      {showTimeoutWarning && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-amber-400/40 bg-zinc-900 px-5 py-3 shadow-xl text-sm text-amber-300 whitespace-nowrap">
          <span>You&apos;ll be signed out in 5 minutes due to inactivity.</span>
          <button
            onClick={resetTimers}
            className="ml-1 rounded-lg bg-amber-400 px-3 py-1 text-xs font-bold text-zinc-900 hover:bg-amber-300 transition"
          >
            Stay signed in
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 max-w-[75vw] flex-col transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
        style={{ backgroundColor: '#181818' }}
      >
        {/* Logo + mobile close button */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/10">
          <Link href="/" className="flex items-center">
            <img
              src="/Listworx_wordmark_logo.png"
              alt="ListWorx"
              className="h-8 w-auto"
            />
          </Link>
          <button
            onClick={closeSidebar}
            className="md:hidden text-white/60 hover:text-white transition-colors p-1"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 flex-shrink-0">
            <span className="text-xs font-semibold text-white uppercase">
              {(userName || 'U')[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName || 'User'}</p>
            {tierBadge && (
              <span
                className="inline-block px-2 py-0.5 text-xs font-semibold rounded-sm text-white mt-0.5"
                style={{ backgroundColor: '#E8621A' }}
              >
                {tierBadge}
              </span>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map((item) => {
            if (item.isLogout) {
              return (
                <button
                  key={item.id}
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 px-5 py-2.5 text-sm text-white/50 hover:text-white transition-colors"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  <span>Sign Out</span>
                </button>
              );
            }

            const isActive = activeNavId === item.id;
            const Icon = item.icon;

            const content = (
              <>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
                    style={{ backgroundColor: '#E8621A' }}
                  >
                    {item.badge}
                  </span>
                )}
                {item.badgeLabel && (
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-sm text-white"
                    style={{ backgroundColor: '#E8621A' }}
                  >
                    {item.badgeLabel}
                  </span>
                )}
              </>
            );

            const baseClass = `flex w-full items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
              item.disabled
                ? 'text-white/30 cursor-not-allowed'
                : isActive
                ? 'text-white font-medium'
                : 'text-white/60 hover:text-white'
            }`;

            const activeBg = isActive
              ? { backgroundColor: '#E8621A' }
              : {};

            if (item.href && !item.disabled) {
              return (
                <Link key={item.id} href={item.href} className={baseClass} style={activeBg} onClick={closeSidebar}>
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                onClick={item.disabled ? undefined : () => { closeSidebar(); item.onClick?.(); }}
                disabled={item.disabled}
                className={baseClass}
                style={activeBg}
              >
                {content}
              </button>
            );
          })}
        </nav>

        {/* Bottom sign out */}
        <div className="border-t border-white/10 py-3">
          <button
            onClick={() => { closeSidebar(); onLogout(); }}
            className="flex w-full items-center gap-3 px-5 py-2.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col md:ml-60">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-15 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 py-0" style={{ height: '60px' }}>
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-600 hover:text-gray-900 transition-colors p-1 -ml-1"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1
              className="text-xl font-bold uppercase tracking-wide text-gray-900"
              style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
            >
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {tierBadge && (
              <span
                className="px-3 py-1 text-xs font-bold rounded-full text-white"
                style={{ backgroundColor: '#E8621A' }}
              >
                {tierBadge}
              </span>
            )}
            <button className="relative p-1.5 text-gray-500 hover:text-gray-900 transition-colors">
              <Bell className="h-5 w-5" />
              {hasNotifications && (
                <span
                  className="absolute right-1 top-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: '#E8621A' }}
                />
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
