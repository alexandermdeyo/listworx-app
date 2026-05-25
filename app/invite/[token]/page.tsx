'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Shield,
  Users,
  BarChart3,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type Invitation = {
  id: string;
  invite_token: string;
  status: string;
  expires_at: string;
  invitee_name: string | null;
  invitee_business: string | null;
  invitee_trade: string | null;
  realtor_name: string | null; // joined from realtor_profiles
};

type PageState = 'loading' | 'invalid' | 'used' | 'expired' | 'valid' | 'declined';

// ── Benefits list ─────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: Users,     text: 'Referrals from realtors and homeowners' },
  { icon: Shield,    text: 'IronClad certification on your profile' },
  { icon: BarChart3, text: 'A contractor dashboard to track your referrals' },
  { icon: Megaphone, text: 'Marketing tools to grow your business' },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InvitePage({ params }: { params: { token: string } }) {
  const { token } = params;

  const [pageState, setPageState]   = useState<PageState>('loading');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [declining, setDeclining]   = useState(false);

  // ── Fetch invitation on mount ─────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invite/${token}`);

        if (res.status === 404) { setPageState('invalid'); return; }
        if (!res.ok)             { setPageState('invalid'); return; }

        const { invitation: inv } = (await res.json()) as { invitation: Invitation };

        if (inv.status !== 'PENDING') {
          setPageState('used');
          return;
        }

        if (new Date(inv.expires_at) < new Date()) {
          setPageState('expired');
          return;
        }

        setInvitation(inv);
        setPageState('valid');
      } catch {
        setPageState('invalid');
      }
    }

    void load();
  }, [token]);

  // ── Decline handler ───────────────────────────────────────────────────────
  async function handleDecline() {
    setDeclining(true);
    try {
      await fetch(`/api/invite/${token}/decline`, { method: 'POST' });
    } catch {
      // Show declined state regardless — best-effort
    } finally {
      setDeclining(false);
      setPageState('declined');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-16">

      {/* ListWorx logo */}
      <div className="mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/LW_LOGO.png" alt="ListWorx" className="h-9 w-auto" />
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {pageState === 'loading' && (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#E85000]" />
          <p className="text-sm text-zinc-500">Loading your invitation…</p>
        </div>
      )}

      {/* ── Error states ─────────────────────────────────────────────────── */}
      {(pageState === 'invalid' || pageState === 'used' || pageState === 'expired') && (
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-xl">
            <AlertCircle className="h-11 w-11 text-zinc-600 mx-auto mb-4" />
            <h1 className="text-lg font-bold text-white mb-2">
              {pageState === 'expired' ? 'Invitation Expired' : 'Invitation Not Available'}
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {pageState === 'invalid' && 'This invitation link is invalid or has expired.'}
              {pageState === 'used'    && 'This invitation has already been used.'}
              {pageState === 'expired' && 'This invitation has expired.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Declined ─────────────────────────────────────────────────────── */}
      {pageState === 'declined' && (
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-xl">
            <CheckCircle2 className="h-11 w-11 text-zinc-500 mx-auto mb-4" />
            <h1 className="text-lg font-bold text-white mb-2">Got it. No hard feelings.</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              You won't receive any more emails about this invitation.
            </p>
          </div>
        </div>
      )}

      {/* ── Valid invitation ──────────────────────────────────────────────── */}
      {pageState === 'valid' && invitation && (
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl">

            {/* Orange accent bar */}
            <div className="h-1.5 bg-[#E85000]" />

            <div className="p-8 sm:p-10">

              {/* Eyebrow */}
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#E85000] mb-4">
                ListWorx Contractor Network
              </p>

              {/* Heading */}
              <h1
                className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4"
                style={{ fontFamily: "'Barlow Condensed', Arial, sans-serif" }}
              >
                You've been recommended.
              </h1>

              {/* Intro body */}
              <p className="text-base text-zinc-300 leading-relaxed mb-6">
                {invitation.realtor_name ? (
                  <>
                    <span className="font-semibold text-white">{invitation.realtor_name}</span>{' '}
                    added you to their preferred contractor network on ListWorx.
                  </>
                ) : (
                  <>
                    A ListWorx realtor partner added you to their preferred contractor network
                    on ListWorx.
                  </>
                )}
              </p>

              {/* What is ListWorx */}
              <div className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400 mb-2">
                  What is ListWorx?
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  ListWorx connects vetted contractors with homeowners, realtors, and property
                  managers in your area. No pay-per-lead. No bidding wars. Just referrals from
                  people who already trust you.
                </p>
              </div>

              {/* Benefits */}
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400 mb-4">
                  What you get as a listed contractor
                </p>
                <ul className="space-y-3">
                  {BENEFITS.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E85000]/15 border border-[#E85000]/25">
                        <Icon className="h-3.5 w-3.5 text-[#E85000]" />
                      </span>
                      <span className="text-sm text-zinc-300">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTAs */}
              <div className="flex flex-col items-center gap-3">
                <Link href={`/apply?invite_token=${token}`} className="w-full">
                  <Button
                    className="w-full font-semibold text-base text-white h-12 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#E85000' }}
                  >
                    Apply to Join ListWorx
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <button
                  onClick={handleDecline}
                  disabled={declining}
                  className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors py-2 disabled:opacity-40"
                >
                  {declining && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Not interested? That&apos;s okay.
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-800 bg-zinc-950 px-8 py-5 flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Ironclad_Standards_Logo.png"
                alt="IronClad Standards"
                className="h-8 w-auto opacity-60"
              />
              <p className="text-xs text-zinc-600 tracking-wide">
                ListWorx — Built in Gallatin, TN
              </p>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
