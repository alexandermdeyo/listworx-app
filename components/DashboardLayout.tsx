'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { Bell, LogOut } from 'lucide-react';

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
  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Barlow', Arial, sans-serif" }}>
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col"
        style={{ backgroundColor: '#181818' }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-0.5">
            <span
              className="text-2xl font-bold tracking-tight text-white"
              style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
            >
              LIST
            </span>
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ color: '#E8621A', fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
            >
              WORX
            </span>
          </Link>
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
                <Link key={item.id} href={item.href} className={baseClass} style={activeBg}>
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                onClick={item.disabled ? undefined : item.onClick}
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
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-5 py-2.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col" style={{ marginLeft: '240px' }}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-15 items-center justify-between border-b border-gray-200 bg-white px-6 py-0" style={{ height: '60px' }}>
          <h1
            className="text-xl font-bold uppercase tracking-wide text-gray-900"
            style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
          >
            {pageTitle}
          </h1>
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
