import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'ListWorx Academy: Training for Contractors',
  description:
    'Training to help contractors grow: state contractor license and exam prep powered by ACES, with insurance, bookkeeping, and business courses coming soon.',
  path: '/academy',
});

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
