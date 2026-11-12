import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Real Estate Photographers, Videographers & Drone Operators | ListWorx',
  description:
    'ListWorx media partners are vetted photographers, videographers, and drone operators who help realtors market listings and help contractors show their work.',
  path: '/media-partners',
});

export default function MediaPartnersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
