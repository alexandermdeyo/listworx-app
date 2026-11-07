import Link from 'next/link';
import Navigation from '@/components/Navigation';

export const metadata = { title: 'Unsubscribed | ListWorx', robots: { index: false } };

export default function UnsubscribedPage({ searchParams }: { searchParams: { invalid?: string } }) {
  const invalid = !!searchParams?.invalid;
  return (
    <>
      <Navigation variant="light" />
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-24 bg-white">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-3 text-mkt-ink">
            {invalid ? 'Link not recognized' : "You're unsubscribed"}
          </h1>
          <p className="text-mkt-ink/70 mb-8">
            {invalid
              ? "That unsubscribe link didn't work. Reply to any of our emails or contact us and we'll take you off the list."
              : "You won't get any more newsletters from ListWorx. Sorry to see you go."}
          </p>
          <Link href="/" className="inline-block px-6 py-3 rounded-lg font-bold text-white bg-lw-rust">
            Back to ListWorx
          </Link>
        </div>
      </main>
    </>
  );
}
