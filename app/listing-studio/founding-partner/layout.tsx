import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Listing Studio Founding Realtor Rates | ListWorx',
  description:
    'Founding realtor pricing for ListWorx Listing Studio. Lock in your rate before the founding window closes.',
  path: '/listing-studio/founding-partner',
});

export default function ListingStudioFoundingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
