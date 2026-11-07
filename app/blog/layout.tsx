import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | ListWorx',
  description: 'Straight talk for homeowners hiring contractors, and practical advice for contractors growing their business.',
  alternates: { canonical: 'https://listworx.co/blog' },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
