import { pageMetadata } from '@/lib/seo';

// Applies to /contractors. Profile pages under /contractors/[id] set their own
// title and canonical in generateMetadata, which overrides these values.
export const metadata = pageMetadata({
  title: 'Join a Vetted Contractor Referral Network in Tennessee | ListWorx',
  description:
    'Grow your home service business with ListWorx: homeowner and realtor referrals, a flat monthly membership with no per-referral charges, and founding rates locked for life. Now recruiting in Middle Tennessee.',
  path: '/contractors',
});

export default function ContractorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
