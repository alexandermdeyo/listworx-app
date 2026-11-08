import Link from 'next/link';
import { supabase } from '@/lib/supabase';

/**
 * Contractor recruiting strip under the holiday banner on the homepage.
 * The ticker scrolls every active trade from the `categories` table, the
 * same list the contractor application and job request form use, so it can
 * never advertise a trade contractors can't sign up for. Priority trades
 * lead the ticker in bold.
 */
const PRIORITY_TRADES = [
  'Interior Painting',
  'Exterior Painting',
  'Roofing',
  'HVAC',
  'Handyman Services',
  'Plumbing',
  'Electrical',
  'Garage Door Installation & Repair',
  'Residential Cleaning',
  'Pressure Washing',
  'Landscaping',
  'Lawn Care & Maintenance',
  'Flooring Installation',
  'Blinds & Window Treatments',
  'Window & Door Installation',
  'Gutter Installation & Cleaning',
  'Fencing',
  'Pest Control',
  'General Contractor',
];

async function getTrades(): Promise<{ name: string; priority: boolean }[]> {
  try {
    const { data } = await supabase.from('categories').select('name').eq('is_active', true).order('name');
    const active = new Set((data || []).map((c: { name: string }) => c.name));
    const priority = PRIORITY_TRADES.filter((t) => active.has(t));
    const rest = Array.from(active).filter((t) => !PRIORITY_TRADES.includes(t)).sort();
    if (priority.length + rest.length > 0) {
      return [...priority.map((name) => ({ name, priority: true })), ...rest.map((name) => ({ name, priority: false }))];
    }
  } catch {
    // fall through to the priority list
  }
  return PRIORITY_TRADES.map((name) => ({ name, priority: true }));
}

function TradeRun({ trades }: { trades: { name: string; priority: boolean }[] }) {
  return (
    <>
      {trades.map((t) => (
        <span key={t.name} className="inline-flex items-center gap-3 px-3">
          <span className={t.priority ? 'font-extrabold text-white' : 'font-medium text-white/50'}>{t.name}</span>
          <span aria-hidden="true" className={t.priority ? 'text-lw-rust' : 'text-white/25'}>◆</span>
        </span>
      ))}
    </>
  );
}

export default async function ContractorRecruitBar() {
  const trades = await getTrades();

  return (
    <section aria-label="Now recruiting contractors" className="relative overflow-hidden bg-[#1a1a1a] border-b border-lw-rust/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 pt-4 pb-3 text-center md:flex-row md:justify-between md:gap-6 md:text-left">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
          <span className="lw-recruit-badge inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-lw-rust px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
            <span className="lw-recruit-dot h-2 w-2 rounded-full bg-white" aria-hidden="true" />
            Now recruiting
          </span>
          <p className="text-sm leading-snug text-white md:text-base">
            <span className="font-bold">Contractors in Nashville and every Tennessee county within 100 miles:</span>{' '}
            <span className="text-white/75">founding spots are open in your trade.</span>
          </p>
        </div>
        <Link
          href="/contractors"
          className="shrink-0 rounded-md bg-white px-4 py-2 text-sm font-bold text-[#1a1a1a] transition-colors hover:bg-lw-rust hover:text-white"
        >
          Join as a Home Service Pro: Click Here →
        </Link>
      </div>

      {/* Trade ticker: list is doubled so the scroll loops seamlessly */}
      <div className="relative border-t border-white/10 py-2 text-xs uppercase tracking-[0.14em]">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#1a1a1a] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#1a1a1a] to-transparent" />
        <div aria-hidden="true" className="lw-county-ticker flex w-max whitespace-nowrap">
          <TradeRun trades={trades} />
          <TradeRun trades={trades} />
        </div>
        <p className="sr-only">Trades we&apos;re recruiting: {trades.map((t) => t.name).join(', ')}.</p>
      </div>
    </section>
  );
}
