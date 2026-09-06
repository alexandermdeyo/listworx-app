'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import type { NavItem } from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase-browser';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Plus,
  ClipboardList,
  Users,
  Camera,
  Loader as Loader2,
  ArrowRight,
} from 'lucide-react';

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/requestor-dashboard' },
  { id: 'submit', label: 'Submit Request', icon: Plus, href: '/request' },
  { id: 'requests', label: 'My Requests', icon: ClipboardList, href: '/requestor-dashboard' },
  { id: 'vendors', label: 'My Vendors', icon: Users, href: '/requestor-dashboard/vendors' },
  { id: 'media', label: 'Listing Media', icon: Camera, href: '/requestor-dashboard/media' },
];

interface Booking {
  id: string;
  status: string;
  source: string;
  notes: string;
  property_address: string | null;
  preferred_date: string | null;
  decline_reason: string | null;
  requested_at: string;
}

export default function RequestorMediaPage() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const { bookings } = await fetch('/api/media-bookings?as=requester').then((r) => r.json());
    setBookings(Array.isArray(bookings) ? bookings : []);
  };

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirect=/requestor-dashboard/media');
        return;
      }
      await load();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = async (id: string) => {
    setBusy(id);
    try {
      await fetch('/api/media-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'cancel' }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <DashboardLayout
      userName="You"
      pageTitle="LISTING MEDIA"
      navItems={NAV_ITEMS}
      activeNavId="media"
      onLogout={() => signOut().then(() => router.push('/login'))}
    >
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-mkt-ink">Book listing media</h1>
          <p className="mt-1 text-mkt-ink/70">
            Photographers, videographers, and drone operators in the ListWorx network — free for
            you, covered by the partner&apos;s membership. Send a request and they confirm or
            decline.
          </p>
          <Link href="/media-partners" className="mt-4 inline-block">
            <Button className="bg-lw-rust text-white hover:bg-lw-rust-hover">
              Browse media partners
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-mkt-ink/50">
          Your media bookings
        </h2>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-lw-rust" />
        ) : bookings.length === 0 ? (
          <p className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-mkt-ink/60">
            No media bookings yet.
          </p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                      b.status === 'requested'
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : b.status === 'confirmed'
                        ? 'border-sky-300 bg-sky-50 text-sky-700'
                        : b.status === 'completed'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-zinc-300 bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    {b.status}
                  </span>
                  <span className="ml-auto text-xs text-mkt-ink/40">
                    {new Date(b.requested_at).toLocaleDateString()}
                  </span>
                </div>
                {b.notes && <p className="mt-2 text-sm text-mkt-ink/80">{b.notes}</p>}
                <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-mkt-ink/50">
                  {b.property_address && <span>{b.property_address}</span>}
                  {b.preferred_date && <span>Preferred: {b.preferred_date}</span>}
                  {b.decline_reason && <span>Declined: {b.decline_reason}</span>}
                </div>
                {['requested', 'confirmed'].includes(b.status) && (
                  <button
                    onClick={() => cancel(b.id)}
                    disabled={busy === b.id}
                    className="mt-2 text-xs text-mkt-ink/50 hover:text-red-600"
                  >
                    Cancel request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
