import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'IronClad Standards: How ListWorx Vets Contractors | ListWorx',
  description:
    'The compliance framework every ListWorx contractor agrees to: application review, license and insurance verification, communication and conduct standards, and ongoing performance monitoring.',
  path: '/ironclad',
});

export default function IroncladLayout({ children }: { children: React.ReactNode }) {
  return children;
}
