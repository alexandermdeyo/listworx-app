'use client';

import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useAdminApi } from './ui';

type Issue = {
  id: string; title: string | null; original_filename: string; status: string; archived: boolean; public_copy_live: boolean;
  published: { id: string; title: string }[]; unpublished: { id: string; title: string; status: string }[];
};

/**
 * Prominent warning listing every library photo that articles use although it is not
 * (or no longer) approved, and which articles. Shown on the Photo Library and the
 * Content dashboard. Nothing is changed automatically; the admin decides.
 */
export default function PhotoIssuesBanner({ onOpenPhoto, refreshKey = 0 }: { onOpenPhoto?: (id: string) => void; refreshKey?: number }) {
  const { api } = useAdminApi();
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    api('/api/admin/photos/issues').then((j) => setIssues(j.issues || [])).catch(() => setIssues([]));
  }, [api, refreshKey]);

  if (!issues.length) return null;
  return (
    <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-950" role="alert" data-testid="photo-issues-banner">
      <p className="flex items-center gap-2 text-base font-bold">
        <TriangleAlert className="h-5 w-5" /> {issues.length} photo{issues.length === 1 ? ' is' : 's are'} used in articles but no longer approved
      </p>
      <ul className="mt-2 space-y-2 text-sm">
        {issues.map((i) => (
          <li key={i.id}>
            {onOpenPhoto ? (
              <button type="button" onClick={() => onOpenPhoto(i.id)} className="font-semibold underline">{i.title || i.original_filename}</button>
            ) : (
              <a href="/admin/crm/photos" className="font-semibold underline">{i.title || i.original_filename}</a>
            )}{' '}
            ({i.archived ? 'archived' : i.status})
            {i.published.length > 0 && <> — <strong>published:</strong> {i.published.map((a) => a.title).join(', ')}</>}
            {i.unpublished.length > 0 && <> — <strong>not published:</strong> {i.unpublished.map((a) => `${a.title} (${a.status})`).join(', ')}</>}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm">
        Published articles were left as they are. Replace the photo in each article (Blog editor), or approve the photo again.
        Articles using these photos can&apos;t be approved, scheduled or published until then.
      </p>
    </div>
  );
}
