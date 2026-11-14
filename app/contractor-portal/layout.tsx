import { noindexMetadata } from '@/lib/seo';

export const metadata = noindexMetadata('Contractor Portal | ListWorx');

export default function ContractorPortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
