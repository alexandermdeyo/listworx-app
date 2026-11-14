import { noindexMetadata } from '@/lib/seo';

export const metadata = noindexMetadata('Share Your Feedback | ListWorx');

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
