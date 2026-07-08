import Link from 'next/link';
import Image from 'next/image';

export default function America250Banner() {
  return (
    <div className="w-full overflow-hidden shadow-lg" style={{ fontFamily: "'Barlow', sans-serif" }}>

      {/* Hero Banner Body */}
      <div className="relative overflow-hidden flex flex-col" style={{ minHeight: 380, background: '#0B0E14' }}>

        {/* Background flag image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url('/america250-bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
          }}
        />

        {/* Dark cinematic overlay — ~60% dark */}
        <div className="absolute inset-0 z-[1]" style={{ background: 'rgba(0,0,0,0.6)' }} />

        {/* Orange left stripe */}
        <div className="absolute left-0 top-0 bottom-0 z-10" style={{ width: 5, background: '#E86B2B' }} />

        {/* Content */}
        <div
          className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 px-8 md:px-16 py-12 md:py-14 flex-1"
        >
          {/* Left: text */}
          <div className="max-w-xl w-full">
            {/* Eyebrow */}
            <p
              className="mb-4 flex items-center gap-2"
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#E86B2B',
              }}
            >
              ★ America&apos;s 250th Birthday &nbsp;·&nbsp; 1776 — 2026 ★
            </p>

            {/* Headline */}
            <h2
              className="mb-5"
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 'clamp(36px, 5vw, 52px)',
                fontWeight: 700,
                lineHeight: 1.0,
                textTransform: 'uppercase',
                letterSpacing: '-0.5px',
                color: '#ffffff',
              }}
            >
              <span style={{ color: '#ffffff' }}>America Wasn&apos;t</span><br />
              <span style={{ color: '#ffffff' }}>Built By </span>
              <span style={{ color: '#ffffff' }}>Algorithms.</span><br />
              <span style={{ color: '#ffffff' }}>It Was Built By</span><br />
              <span style={{ color: '#ffffff' }}>People Like You.</span>
            </h2>

            {/* Sub */}
            <p
              className="mb-8"
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: 15,
                fontWeight: 400,
                color: '#C9CDD6',
                lineHeight: 1.65,
                maxWidth: 430,
                paddingLeft: 14,
                borderLeft: '3px solid #E86B2B',
              }}
            >
              250 years of tradespeople, craftsmen, and independent
              contractors — the hands that built everything worth having.{' '}
              <strong style={{ color: '#ffffff', fontWeight: 600 }}>ListWorx is their network.</strong>
            </p>

            {/* CTA */}
            <Link
              href="/founding-partner"
              className="inline-flex items-center gap-3 no-underline transition-all"
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                background: '#E86B2B',
                color: '#ffffff',
                padding: '15px 32px',
                border: '2px solid #E86B2B',
              }}
            >
              <span>Claim Your Founding Partner Spot</span>
              <span style={{ fontSize: 18 }}>→</span>
            </Link>
          </div>

          {/* Right: medallion */}
          <div className="flex-shrink-0 flex items-center justify-center" style={{ background: 'transparent' }}>
            <Image
              src="/america250-medallion-transparent.png"
              alt="America 250 — Still Building"
              width={260}
              height={260}
              className="w-48 md:w-64 h-auto"
              style={{
                objectFit: 'contain',
                background: 'transparent',
                borderRadius: 0,
                filter: 'drop-shadow(0 4px 24px rgba(232,107,43,0.25)) drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
              }}
            />
          </div>
        </div>

        {/* Bottom bar — stays navy */}
        <div
          className="relative z-10 flex items-center justify-between px-8 md:px-16 py-3"
          style={{ background: '#1B2A4A', borderTop: '3px solid #E86B2B' }}
        >
          <p
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            Built on Trust. <span style={{ color: '#E86B2B' }}>Not Transactions.</span>
          </p>
          <div className="hidden sm:flex items-center gap-1.5">
            {[true, false, true, false, true, false, true].map((on, i) => (
              <span key={i} style={{ color: on ? '#E86B2B' : 'rgba(255,255,255,0.18)', fontSize: 9 }}>★</span>
            ))}
          </div>
          <p
            className="hidden sm:block"
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            <span style={{ color: '#ffffff' }}>ListWorx.co</span> — Largest Vetted Contractor Network in America
          </p>
        </div>
      </div>
    </div>
  );
}
