import { noindexMetadata } from '@/lib/seo';

export const metadata = noindexMetadata('Log In | ListWorx');

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
