import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Apply to Join the ListWorx Contractor Network',
  description:
    'Apply to become a ListWorx network contractor. Founding contractor spots are open with membership rates locked in permanently, and every application is reviewed against IronClad Standards.',
  path: '/apply',
});

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
