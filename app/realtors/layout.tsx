import { pageMetadata } from '@/lib/seo';

// Applies to /realtors. Realtor profiles under /realtors/[id] set their own
// title and canonical in generateMetadata, which overrides these values.
export const metadata = pageMetadata({
  title: 'Trusted Contractor Referrals for Realtors | ListWorx',
  description:
    'Refer your clients to vetted, licensed, and insured home service contractors without putting your name on the line. Contractor referrals are free for realtors, with optional Listing Studio marketing tools.',
  path: '/realtors',
});

export default function RealtorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
