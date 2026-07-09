import type { Metadata } from 'next';
import DemoAccessGate from './DemoAccessGate';

export const metadata: Metadata = {
  title: 'ListWorx Demo',
  robots: { index: false, follow: false },
};

export default function AcesDemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoAccessGate>{children}</DemoAccessGate>;
}
