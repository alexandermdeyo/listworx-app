import { createClient } from '@/lib/supabase-server';

export type SiteContentMap = Record<string, { value: string | null; is_visible: boolean | null }>;

export async function getSiteContent(page: string): Promise<SiteContentMap> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_content')
      .select('section_key, value, is_visible')
      .eq('page', page);

    if (!data) return {};

    return data.reduce((acc: SiteContentMap, row: any) => {
      acc[row.section_key] = {
        value: row.value,
        is_visible: row.is_visible,
      };
      return acc;
    }, {});
  } catch (_e) {
    return {};
  }
}

export function getContent(
  content: SiteContentMap,
  key: string,
  fallback: string = ''
): string {
  return content[key]?.value ?? fallback;
}

export function isVisible(content: SiteContentMap, key: string): boolean {
  return content[key]?.is_visible !== false;
}
