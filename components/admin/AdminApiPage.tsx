'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

/** Minimal shell for admin tools whose data comes from ADMIN-only API routes. */
export default function AdminApiPage({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 pb-20 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <Link href="/admin/crm" className="text-xs text-zinc-400 hover:text-white">← Admin CRM</Link>
            <h1 className="text-xl font-bold">{title}</h1>
            {description && <p className="text-sm text-zinc-400">{description}</p>}
          </div>
          <nav className="hidden gap-4 text-sm sm:flex">
            <Link href="/admin/crm/media-orders" className="text-zinc-300 hover:text-white">Media orders</Link>
            <Link href="/admin/crm/media-schedule" className="text-zinc-300 hover:text-white">Media schedule</Link>
            <Link href="/admin/crm/social-posts" className="text-zinc-300 hover:text-white">Social posts</Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export const adminInput = 'rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-[#C65A1E] focus:outline-none';
export const adminBtn = 'rounded-md bg-[#C65A1E] px-3 py-2 text-sm font-semibold text-white hover:bg-[#a84d18] disabled:opacity-40';
export const adminBtnGhost = 'rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 disabled:opacity-40';
