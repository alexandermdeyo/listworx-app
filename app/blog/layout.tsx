import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

// Applies to /blog. Each post's own layout (blog/[slug]/layout.tsx) overrides
// the title, canonical, and share tags with the post's details.
export const metadata: Metadata = pageMetadata({
  title: 'Blog | ListWorx',
  description: 'Straight talk for homeowners hiring contractors, and practical advice for contractors growing their business.',
  path: '/blog',
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
