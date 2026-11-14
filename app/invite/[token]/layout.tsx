import { noindexMetadata } from '@/lib/seo';

export const metadata = noindexMetadata('Your Invitation | ListWorx');

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
