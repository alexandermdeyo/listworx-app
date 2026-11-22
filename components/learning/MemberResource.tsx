'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import ResourceBody from '@/components/learning/ResourceBody';
import { authFetch } from '@/lib/auth-fetch';
import type { ResourceSection } from '@/lib/learning/resources';

export default function MemberResource({ slug }: { slug: string }) {
  const [sections, setSections] = useState<ResourceSection[] | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  useEffect(() => {
    authFetch(`/api/learning/${slug}`).then(async (r) => {
      const j = await r.json();
      if (!r.ok) return setLocked(j.error || 'Members only.');
      setSections(j.resource.sections);
    });
  }, [slug]);
  if (sections) return <ResourceBody sections={sections} />;
  if (!locked) return <p className="text-white/50">Loading…</p>;
  return (
    <div className="rounded-2xl border border-lw-rust/40 bg-mailer-card p-6">
      <p className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4 text-lw-rust" /> {locked}</p>
      <p className="mt-2 text-sm text-white/60">Member resources are included with Growth and Business Pro memberships.</p>
      <div className="mt-4 flex gap-3 text-sm">
        <Link href={`/login?redirect=/learning-center/${slug}`} className="rounded-md border-2 border-lw-rust px-4 py-2 font-semibold">Sign in</Link>
        <Link href="/contractors" className="rounded-md bg-lw-rust px-4 py-2 font-semibold">See memberships</Link>
      </div>
    </div>
  );
}
