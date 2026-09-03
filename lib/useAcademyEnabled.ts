'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

/**
 * Whether the ACES / ListWorx Academy partnership is currently live, per the
 * `academy_enabled` admin_settings toggle. When false, every ACES/Academy
 * mention across the site (tier feature bullets, nav link, marketing copy)
 * should be hidden — there is no active partnership right now, but the
 * toggle lets it come back on instantly if/when one starts again.
 */
export function useAcademyEnabled() {
  const [academyEnabled, setAcademyEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'academy_enabled')
        .maybeSingle();

      if (!cancelled) {
        setAcademyEnabled(data?.value === 'true');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return academyEnabled;
}
