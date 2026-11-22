import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ResourceBody from '@/components/learning/ResourceBody';
import MemberResource from '@/components/learning/MemberResource';
import { pageMetadata } from '@/lib/seo';
import { LEARNING_RESOURCES, getResource } from '@/lib/learning/resources';

export function generateStaticParams() {
  return LEARNING_RESOURCES.map((r) => ({ slug: r.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const r = getResource(params.slug);
  if (!r) return {};
  return pageMetadata({ title: `${r.title} | ListWorx Learning Center`, description: r.summary, path: `/learning-center/${r.slug}` });
}

export default function ResourcePage({ params }: { params: { slug: string } }) {
  const r = getResource(params.slug);
  if (!r) notFound();
  return (
    <div className="min-h-screen bg-mailer-black pb-20 text-white">
      <Navigation />
      <article className="container mx-auto max-w-3xl px-4 pt-28">
        <Link href="/learning-center" className="text-sm text-white/50 hover:text-white">← Learning Center</Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-lw-rust">{r.category} · {r.audience}</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{r.title}</h1>
        <p className="mt-3 text-lg text-white/65">{r.summary}</p>
        <div className="mt-10">
          {/* Member-only body is never rendered on the server; it loads from the gated API. */}
          {r.access === 'free' ? <ResourceBody sections={r.sections} /> : <MemberResource slug={r.slug} />}
        </div>
      </article>
    </div>
  );
}
