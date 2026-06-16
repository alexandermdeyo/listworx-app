'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'lw_america250_strip_dismissed';
// Strip is live through July 6 2026
const EXPIRY_DATE = new Date('2026-07-07T00:00:00Z');

export default function America250Strip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (new Date() >= EXPIRY_DATE) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, #0a1628 0%, #1B2A4A 40%, #142240 70%, #0a1628 100%)',
        borderTop: '3px solid #E86B2B',
        borderBottom: '3px solid #E86B2B',
      }}
    >
      <div
        className="flex items-center justify-center gap-4 px-4 py-2.5 relative"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        {/* Watermark stars */}
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center overflow-hidden pointer-events-none"
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.025)',
            letterSpacing: 20,
            whiteSpace: 'nowrap',
          }}
        >
          {'★ '.repeat(30)}
        </div>

        <span
          className="flex-shrink-0 relative z-10"
          style={{ fontSize: 12, fontWeight: 700, color: '#E86B2B', letterSpacing: '2px' }}
        >
          ★ &nbsp;1776 — 2026&nbsp; ★
        </span>

        <div className="hidden sm:block w-px h-4 bg-white/20 flex-shrink-0 relative z-10" />

        <p
          className="relative z-10 text-center flex-1 hidden sm:block"
          style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', letterSpacing: '1.5px', textTransform: 'uppercase' }}
        >
          Honoring{' '}
          <span style={{ color: '#E86B2B' }}>250 Years</span>{' '}
          of American Workers &nbsp;·&nbsp; The Hands That{' '}
          <strong>Built This Nation. Still Building.</strong>{' '}
          &nbsp;·&nbsp; <strong>ListWorx</strong> — The Largest Vetted Contractor Network in America
        </p>

        {/* Mobile shorter text */}
        <p
          className="relative z-10 text-center flex-1 sm:hidden"
          style={{ fontSize: 11, fontWeight: 600, color: '#ffffff', letterSpacing: '1px', textTransform: 'uppercase' }}
        >
          Honoring <span style={{ color: '#E86B2B' }}>America&apos;s 250th</span> — <strong>ListWorx</strong>
        </p>

        <div className="hidden sm:block w-px h-4 bg-white/20 flex-shrink-0 relative z-10" />

        <Link
          href="/founding-partner"
          className="flex-shrink-0 relative z-10 no-underline"
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            color: '#1B2A4A',
            background: '#E86B2B',
            padding: '5px 14px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          Claim Your Spot →
        </Link>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="relative z-10 flex-shrink-0 ml-2 text-white/50 hover:text-white transition-colors"
          style={{ fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
