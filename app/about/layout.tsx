import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'About ListWorx | Built in Gallatin, Tennessee',
  description:
    'Why ListWorx exists: a vetted, accountable home service contractor referral network built in Gallatin, Tennessee to fix what is broken in home services for homeowners, realtors, and contractors.',
  path: '/about',
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
