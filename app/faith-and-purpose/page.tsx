import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Faith and Purpose | ListWorx',
  description: 'ListWorx is a Christian-owned business that serves everyone. Here is what that means for how we work with homeowners, realtors, and contractors.',
  path: '/faith-and-purpose',
});

export default function FaithAndPurposePage() {
  return (
    <div className="min-h-screen bg-white text-mkt-ink mkt-scope">
      <Navigation variant="light" />
      <article className="mx-auto max-w-3xl px-6 pb-24 pt-28 md:pt-36">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-lw-rust">Faith and Purpose</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">A Christian-owned business that serves everyone.</h1>

        <div className="mt-10 space-y-5 text-lg leading-relaxed text-mkt-ink/85">
          <p>ListWorx is a Christian-owned business, and we&apos;ll be straight with you about what that means.</p>
          <p>
            Our faith isn&apos;t a marketing angle. It&apos;s the reason we do business the way we do. We believe we&apos;re here to honor God by serving
            people well, and that shows up in plain, practical ways: we tell the truth about what we offer, we don&apos;t sell referral priority, we
            don&apos;t let anyone buy a certification, and we treat every homeowner, realtor, and contractor with respect.
          </p>
          <p>Two verses keep us honest.</p>
          <blockquote className="border-l-4 border-lw-rust pl-5 italic">
            &ldquo;A good name is more desirable than great riches, and loving favor is better than silver and gold.&rdquo;
            <span className="mt-1 block text-sm not-italic text-mkt-ink/60">Proverbs 22:1, World English Bible</span>
          </blockquote>
          <blockquote className="border-l-4 border-lw-rust pl-5 italic">
            &ldquo;Whoever desires to become great among you shall be your servant.&rdquo;
            <span className="mt-1 block text-sm not-italic text-mkt-ink/60">Matthew 20:26, World English Bible</span>
          </blockquote>
          <p>
            A good name is earned slowly and lost fast. That&apos;s true for us and for every contractor in our network. And leadership, the way we see
            it, means serving people, not using them.
          </p>
          <h2 className="pt-4 text-2xl font-bold text-mkt-ink">You don&apos;t have to share our faith to work with us.</h2>
          <p>
            ListWorx serves everyone. Homeowners, realtors, and partners are welcome whatever they believe. Contractors are reviewed on professional
            standards like licensing, insurance documents, and their agreement to the IronClad Standards. Faith never affects contractor eligibility,
            referral placement, or certification.
          </p>
          <p>We&apos;d rather you see our faith in how we treat you than read about it on a web page. If we ever fall short of that, tell us at adeyo@listworx.co.</p>
        </div>

        <section className="mt-14 space-y-6 rounded-2xl bg-mkt-ink/[0.04] p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-lw-rust">Our purpose</p>
            <p className="mt-2 text-lg">To honor God by serving people, strengthening businesses, and building communities with integrity, excellence, and generosity.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-lw-rust">Our mission</p>
            <p className="mt-2 text-lg">
              ListWorx connects homeowners and real estate professionals with vetted, accountable contractors, and helps good contractors become
              exceptional businesses through referrals, education, marketing support, and trusted partnerships.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-lw-rust">Our vision</p>
            <p className="mt-2 text-lg">
              To become America&apos;s most trusted contractor network, known for raising the standard of the trades, creating real opportunity for
              hardworking people, and showing what a business built on Christian principles can do for the communities it serves.
            </p>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/about" className="rounded-md bg-lw-rust px-5 py-2.5 font-semibold text-white hover:bg-lw-rust-hover">About ListWorx</Link>
          <Link href="/ironclad" className="rounded-md border-2 border-lw-rust px-5 py-2.5 font-semibold text-mkt-ink">Read the IronClad Standards</Link>
        </div>
      </article>
    </div>
  );
}
