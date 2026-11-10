import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';

// Same "Post not found" view the page showed before, now served with a real 404 status.
export default function BlogPostNotFound() {
  return (
    <div className="min-h-screen bg-white mkt-scope">
      <Navigation variant="light" />
      <div className="container mx-auto px-4 py-28 text-center">
        <p className="text-mkt-ink/70 text-lg mb-2">Post not found</p>
        <p className="text-mkt-ink/60 text-sm mb-6">This article may have been removed or the URL is incorrect.</p>
        <Link href="/blog">
          <Button variant="outlineOrange">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
          </Button>
        </Link>
      </div>
    </div>
  );
}
