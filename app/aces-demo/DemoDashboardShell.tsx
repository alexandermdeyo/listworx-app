'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

export interface DemoNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badgeLabel?: string;
  disabled?: boolean;
}

interface DemoDashboardShellProps {
  userName: string;
  userSubtitle?: string;
  avatarInitials?: string;
  avatarBg?: string;
  avatarImageSrc?: string;
  tierBadge?: string | null;
  pageTitle: string;
  navItems: DemoNavItem[];
  activeNavId: string;
  onNavSelect: (id: string) => void;
  children: React.ReactNode;
}

// Visual clone of components/DashboardLayout.tsx — same sidebar color (#181818),
// same orange accent (#E8621A), same white content area. No Supabase, no auth,
// no inactivity timers: this is a static demo shell only.
export default function DemoDashboardShell({
  userName,
  userSubtitle,
  avatarInitials,
  avatarBg,
  avatarImageSrc,
  tierBadge,
  pageTitle,
  navItems,
  activeNavId,
  onNavSelect,
  children,
}: DemoDashboardShellProps) {
  const isWordAvatar = !!avatarInitials && avatarInitials.length > 1;
  const [avatarImageError, setAvatarImageError] = useState(false);
  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Barlow', Arial, sans-serif" }}>
      <aside
        className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col"
        style={{ backgroundColor: '#181818' }}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/10">
          <Link href="/aces-demo" className="flex items-center">
            <img src="/Listworx_wordmark_logo.png" alt="ListWorx" className="h-8 w-auto" />
          </Link>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          {avatarImageSrc && !avatarImageError ? (
            <img
              src={avatarImageSrc}
              alt={userName}
              className="h-9 w-9 rounded-full object-cover flex-shrink-0 border border-white/10"
              onError={() => setAvatarImageError(true)}
            />
          ) : (
            <div
              className={`flex items-center justify-center rounded-full flex-shrink-0 ${isWordAvatar ? 'h-9 w-9' : 'h-8 w-8'}`}
              style={{ backgroundColor: avatarBg || 'rgba(255,255,255,0.1)' }}
            >
              <span className={`font-bold text-white uppercase ${isWordAvatar ? 'text-[8px]' : 'text-xs'}`}>
                {avatarInitials || (userName || 'U')[0]}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName || 'User'}</p>
            {userSubtitle && <p className="text-[11px] text-white/40 leading-snug">{userSubtitle}</p>}
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

        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map((item) => {
            const isActive = activeNavId === item.id;
            const Icon = item.icon;

            const baseClass = `flex w-full items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
              item.disabled
                ? 'text-white/30 cursor-not-allowed'
                : isActive
                ? 'text-white font-medium'
                : 'text-white/60 hover:text-white'
            }`;
            const activeBg = isActive && !item.disabled ? { backgroundColor: '#E8621A' } : {};

            return (
              <button
                key={item.id}
                onClick={item.disabled ? undefined : () => onNavSelect(item.id)}
                disabled={item.disabled}
                className={baseClass}
                style={activeBg}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badgeLabel && (
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-sm text-white"
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#E8621A' }}
                  >
                    {item.badgeLabel}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-lw-orange" />
            Demo Mode
          </span>
        </div>
      </aside>

      <div className="flex flex-1 flex-col ml-60">
        <header
          className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6"
          style={{ height: '60px' }}
        >
          <h1
            className="text-xl font-bold uppercase tracking-wide text-gray-900"
            style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
          >
            {pageTitle}
          </h1>
          <div className="flex items-center gap-3">
            {tierBadge && (
              <span className="px-3 py-1 text-xs font-bold rounded-full text-white" style={{ backgroundColor: '#E8621A' }}>
                {tierBadge}
              </span>
            )}
            <button className="relative p-1.5 text-gray-500" disabled>
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-white">{children}</main>
      </div>
    </div>
  );
}
