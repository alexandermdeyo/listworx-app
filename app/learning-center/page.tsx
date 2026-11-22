import Link from 'next/link';
import { Lock } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { pageMetadata } from '@/lib/seo';
import { LEARNING_RESOURCES } from '@/lib/learning/resources';

export const metadata = pageMetadata({
  title: 'ListWorx Learning Center: Guides for Homeowners, Contractors, and Realtors',
  description: 'Practical guides on hiring contractors, IronClad Standards, pre-listing repairs, and growing a contracting business.',
  path: '/learning-center',
});

export default function LearningCenterPage() {
  // Only summaries are rendered here; member-only content is served by /api/learning/[slug].
  const items = LEARNING_RESOURCES.map(({ slug, title, audience, category, access, summary }) => ({ slug, title, audience, category, access, summary }));
  return (
    <div className="min-h-screen bg-mailer-black pb-20 text-white">
      <Navigation />
      <div className="container mx-auto max-w-5xl px-4 pt-28">
        <p className="lw-label mb-2">ListWorx Learning Center</p>
        <h1 className="text-4xl font-bold">Practical guides that actually help.</h1>
        <p className="mt-4 max-w-2xl text-white/65">
          A growing starter library for homeowners, realtors, and contractors. Member resources are included with Growth and Business Pro.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {items.map((r) => (
            <Link key={r.slug} href={`/learning-center/${r.slug}`} className="rounded-2xl border border-mailer-border bg-mailer-card p-6 transition hover:border-lw-rust">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">{r.category} · {r.audience}</p>
              <h2 className="mt-2 text-lg font-bold">{r.title}</h2>
              <p className="mt-2 text-sm text-white/60">{r.summary}</p>
              {r.access === 'growth' && (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-lw-rust/15 px-3 py-1 text-xs font-semibold text-lw-rust">
                  <Lock className="h-3 w-3" /> Growth and Business Pro
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
