'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader as Loader2 } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/crm');
  }, [router]);

  return (
    <div className="min-h-screen bg-lw-dark flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-lw-rust mx-auto mb-4" />
        <p className="text-zinc-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
