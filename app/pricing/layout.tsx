import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Network Membership | ListWorx',
  description:
    'Join the ListWorx contractor network as a Network Member, Partner, or Elite. Founding rates lock in for life — no per-referral charges, ever. Free for realtors and homeowners.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
