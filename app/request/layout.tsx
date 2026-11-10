import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Request a Vetted Contractor | ListWorx',
  description:
    'Tell us about your home project and get matched with up to three vetted contractors who meet IronClad Standards. Free for homeowners and realtors, and you choose who to contact.',
  path: '/request',
});

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
