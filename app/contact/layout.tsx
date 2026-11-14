import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Contact ListWorx | Gallatin, Tennessee',
  description:
    'Questions about contractor referrals, joining the ListWorx network, or partnering with us? Send a message or reach the ListWorx team by phone or email.',
  path: '/contact',
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
