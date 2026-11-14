import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'ListWorx + ACES: From Licensed to Working | ListWorx',
  description:
    'ACES prepares contractors to get licensed. ListWorx gives newly licensed contractors a vetted referral network to put that license to work.',
  path: '/partners/aces',
});

export default function AcesPartnerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
