import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import IroncladBadge from '@/components/site/IroncladBadge';
import { cn } from '@/lib/utils';

/**
 * IronClad Standards shield + one accurate line, for any page that talks about
 * the IronClad Standards. Wording stays true to the business rules: every
 * contractor agrees to the Standards and is reviewed before approval;
 * agreeing is not the same as being IronClad Certified.
 */
export default function IronCladCallout({
  tone = 'light',
  title = 'Built on the IronClad Standards',
  body = 'Every contractor in the ListWorx network agrees to the IronClad Standards and is reviewed by ListWorx before approval. IronClad Certification is a separate award made by ListWorx.',
  className,
}: {
  tone?: 'light' | 'dark';
  title?: string;
  body?: string;
  className?: string;
}) {
  const dark = tone === 'dark';
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-5 rounded-2xl p-5 text-center sm:flex-row sm:text-left md:p-6',
        dark ? 'border border-white/20 bg-white/[0.06] text-white' : 'br-card text-brand-ink',
        className
      )}
    >
      <IroncladBadge variant="standards" href="/ironclad" className="h-24 md:h-28" />
      <div className="flex-1">
        <p className="br-display text-2xl leading-tight">{title}</p>
        <p className={cn('mt-1.5 text-[15px] leading-relaxed', dark ? 'text-white/80' : 'text-brand-ink/75')}>{body}</p>
        <Link href="/ironclad" className={cn('mt-3 inline-flex items-center gap-1.5 text-sm font-bold', dark ? 'text-brand-orange' : 'text-brand-orange')}>
          Read the IronClad Standards <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
