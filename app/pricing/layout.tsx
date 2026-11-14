import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Pricing — Network Membership | ListWorx',
  description:
    'Join the ListWorx contractor network as a Network Member, Partner, or Elite. Founding rates lock in for life — no per-referral charges, ever. Free for realtors and homeowners.',
  path: '/pricing',
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
