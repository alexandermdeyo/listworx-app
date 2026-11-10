import { pageMetadata } from '@/lib/seo';

// Applies to /listing-studio. The founding-partner subpage has its own layout.
export const metadata = pageMetadata({
  title: 'Listing Studio: AI Listing Marketing for Realtors | ListWorx',
  description:
    'Listing Studio turns your listing details and photos into ready-to-post marketing content, so realtors spend less time writing captions and more time selling.',
  path: '/listing-studio',
});

export default function ListingStudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
