'use client';

import Link from 'next/link';

// Visual clone of components/Navigation.tsx — same sticky dark header, same
// logo treatment. No Supabase auth check: this is a static demo header only.
export default function DemoTopNav() {
  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-lw-dark-border bg-zinc-900/95 backdrop-blur">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/aces-demo" className="flex items-center" aria-label="ListWorx demo home">
            <img src="/Listworx_wordmark_logo.png" alt="ListWorx" className="h-8 md:h-10 w-auto" />
          </Link>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lw-rust/30 bg-lw-rust/10 px-3 py-1.5 text-xs font-semibold text-lw-rust">
              <span className="h-1.5 w-1.5 rounded-full bg-lw-orange" />
              Demo Mode
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
