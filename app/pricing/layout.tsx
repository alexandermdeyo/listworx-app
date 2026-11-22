import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Pricing | ListWorx',
  description:
    'ListWorx pricing in one place. Free for homeowners and realtors. Contractor memberships at $0, $199, and $299 a month with no per-lead fees. Photo and video packages from $599.',
  path: '/pricing',
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
