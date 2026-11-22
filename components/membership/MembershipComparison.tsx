import Link from 'next/link';
import { CircleCheck as CheckCircle, Minus } from 'lucide-react';
import { COMPARISON_ROWS, MEMBERSHIP_PLANS, type MembershipTierId } from '@/lib/membership/benefits';

type Props = {
  /** Where each card's button goes. Omit to hide buttons. */
  ctaFor?: (id: MembershipTierId) => { href: string; label: string } | null;
  /** Highlight a plan (e.g. the member's current plan). */
  currentTier?: MembershipTierId | null;
  showCards?: boolean;
  showTable?: boolean;
};

const cell = (v: string) =>
  v === 'Yes' ? (
    <CheckCircle aria-label="Included" className="mx-auto h-5 w-5 text-lw-rust" />
  ) : v === 'No' ? (
    <Minus aria-label="Not included" className="mx-auto h-5 w-5 text-white/30" />
  ) : (
    <span className={v.startsWith('Not available') ? 'text-white/40' : 'font-semibold text-white'}>{v}</span>
  );

/** Membership cards plus the full comparison table (dark brand theme). */
export default function MembershipComparison({ ctaFor, currentTier = null, showCards = true, showTable = true }: Props) {
  return (
    <div>
      {showCards && (
        <div className="grid gap-6 lg:grid-cols-3">
          {MEMBERSHIP_PLANS.map((plan) => {
            const featured = plan.id === 'growth';
            const isCurrent = currentTier === plan.id;
            const cta = ctaFor?.(plan.id);
            return (
              <div
                key={plan.id}
                className={`relative flex h-full flex-col rounded-2xl border bg-mailer-card p-7 ${
                  isCurrent || featured ? 'border-lw-rust shadow-lg shadow-lw-rust/10' : 'border-mailer-border'
                }`}
              >
                {(isCurrent || (featured && !currentTier)) && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-lw-rust px-4 py-1 text-xs font-bold text-white">
                    {isCurrent ? 'Your plan' : 'Most Popular'}
                  </span>
                )}
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">{plan.name}</h3>
                <div className="mt-4 text-5xl font-bold text-white">
                  {plan.priceLabel}
                  <span className="text-xl font-normal text-white/40">/mo</span>
                </div>
                <p className="mt-3 text-sm text-white/70">{plan.tagline}</p>
                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-white/75">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-lw-rust" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                {cta && (
                  <Link
                    href={cta.href}
                    className={`mt-6 block rounded-md px-4 py-2.5 text-center text-sm font-semibold text-white transition ${
                      featured ? 'bg-lw-rust hover:bg-lw-rust-hover' : 'border-2 border-lw-rust hover:bg-lw-rust/10'
                    }`}
                  >
                    {cta.label}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showTable && (
      <div className={showCards ? 'mt-12' : ''}>
        <h3 className="mb-4 text-xl font-bold text-white md:text-2xl">Compare memberships</h3>
        <div className="overflow-x-auto rounded-2xl border border-mailer-border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">ListWorx contractor membership comparison</caption>
            <thead>
              <tr className="bg-mailer-ink text-left">
                <th scope="col" className="sticky left-0 z-10 bg-mailer-ink p-4 font-semibold text-white/60">
                  Benefit
                </th>
                {MEMBERSHIP_PLANS.map((p) => (
                  <th key={p.id} scope="col" className={`p-4 text-center font-bold ${currentTier === p.id ? 'text-lw-rust' : 'text-white'}`}>
                    {p.name}
                    <span className="block text-xs font-normal text-white/50">{p.priceLabel}/mo</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 ? 'bg-mailer-card/60' : 'bg-mailer-card'}>
                  <th scope="row" className={`sticky left-0 z-10 p-4 text-left font-medium text-white/85 ${i % 2 ? 'bg-mailer-surface' : 'bg-mailer-card'}`}>
                    {row.label}
                    {row.note && <span className="mt-1 block max-w-xs text-xs font-normal leading-snug text-white/45">{row.note}</span>}
                  </th>
                  {row.values.map((v, j) => (
                    <td key={j} className="p-4 text-center text-white/70">
                      {cell(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-white/50">
          Monthly billing only. No activation fees. Cancel anytime; a canceled paid plan stays active through the paid period, then moves to Network.
        </p>
      </div>
      )}
    </div>
  );
}
