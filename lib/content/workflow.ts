/**
 * Editorial workflow for ListWorx articles (Stage 1B). Framework-free so it can be
 * unit-tested and shared by the admin API and the admin screen.
 *
 * The database (content_apply_action) is the authority on transitions; these rules
 * mirror it so the screen only offers buttons that will succeed.
 *
 * Publishing is NOT an action here: articles go live through the existing Blog
 * editor, and later through the scheduler (currently off).
 */

/** Columns the Content section works with (internal review notes are never stored on blog_posts). */
export const CONTENT_COLUMNS =
  'id, title, slug, excerpt, body, featured_image_url, featured_image_alt, author_name, status, is_draft, ' +
  'published_at, scheduled_for, seo_title, meta_description, audience, category, sources, created_at, updated_at, ' +
  // Hero display settings (see lib/content/hero-image.ts; validated separately by cleanHeroInput).
  'featured_image_focus_x, featured_image_focus_y, featured_image_fit, featured_image_width, featured_image_height';

export const CONTENT_STATUSES = ['idea', 'draft', 'in_review', 'approved', 'scheduled', 'published', 'rejected'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  idea: 'Idea',
  draft: 'Draft',
  in_review: 'Awaiting approval',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  rejected: 'Rejected',
};

export const AUDIENCES = ['contractors', 'homeowners', 'realtors', 'general'] as const;
export type Audience = (typeof AUDIENCES)[number];
export const AUDIENCE_LABELS: Record<Audience, string> = {
  contractors: 'Contractors',
  homeowners: 'Homeowners',
  realtors: 'Realtors',
  general: 'Everyone',
};

export const CONTENT_ACTIONS = ['submit', 'approve', 'reject', 'schedule', 'unschedule', 'return_to_draft'] as const;
export type ContentAction = (typeof CONTENT_ACTIONS)[number];

export const ACTION_LABELS: Record<ContentAction, string> = {
  submit: 'Send for approval',
  approve: 'Approve',
  reject: 'Reject',
  schedule: 'Schedule',
  unschedule: 'Cancel schedule',
  return_to_draft: 'Back to draft',
};

const TRANSITIONS: Record<ContentAction, { from: ContentStatus[]; to: ContentStatus }> = {
  submit: { from: ['idea', 'draft', 'rejected'], to: 'in_review' },
  approve: { from: ['in_review'], to: 'approved' },
  reject: { from: ['in_review', 'approved', 'scheduled'], to: 'rejected' },
  schedule: { from: ['approved'], to: 'scheduled' },
  unschedule: { from: ['scheduled'], to: 'approved' },
  return_to_draft: { from: ['idea', 'in_review', 'approved', 'rejected'], to: 'draft' },
};

export function nextStatus(action: ContentAction, current: ContentStatus): ContentStatus | null {
  const t = TRANSITIONS[action];
  return t && t.from.includes(current) ? t.to : null;
}

export function availableActions(current: ContentStatus): ContentAction[] {
  return CONTENT_ACTIONS.filter((a) => nextStatus(a, current) !== null);
}

/** Only these statuses can be edited in the Content section. Approved or scheduled
 * articles must go back to draft first, so an approval always covers the final text. */
export const EDITABLE_STATUSES: ContentStatus[] = ['idea', 'draft', 'rejected'];
export function isEditable(status: ContentStatus) {
  return EDITABLE_STATUSES.includes(status);
}

export function isContentStatus(v: unknown): v is ContentStatus {
  return typeof v === 'string' && (CONTENT_STATUSES as readonly string[]).includes(v);
}
export function isContentAction(v: unknown): v is ContentAction {
  return typeof v === 'string' && (CONTENT_ACTIONS as readonly string[]).includes(v);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Fields an admin may set from the Content section. Anything else is ignored. */
export const EDITABLE_FIELDS = [
  'title', 'slug', 'excerpt', 'body', 'featured_image_url', 'featured_image_alt',
  'author_name', 'seo_title', 'meta_description', 'audience', 'category', 'sources',
] as const;

export type ArticleInput = Partial<Record<(typeof EDITABLE_FIELDS)[number], unknown>>;

export function cleanArticleInput(input: ArticleInput): { values: Record<string, unknown>; errors: string[] } {
  const values: Record<string, unknown> = {};
  const errors: string[] = [];
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

  for (const key of EDITABLE_FIELDS) {
    if (!(key in input)) continue;
    const raw = input[key];
    switch (key) {
      case 'sources': {
        const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split('\n') : [];
        const urls = list.map((s) => text(s)).filter(Boolean);
        const bad = urls.filter((u) => !/^https?:\/\/[^\s]+$/i.test(u));
        if (bad.length) errors.push('Each source must be a full web address starting with http:// or https://');
        values.sources = urls.slice(0, 30);
        break;
      }
      case 'audience': {
        const v = text(raw);
        if (v && !(AUDIENCES as readonly string[]).includes(v)) errors.push('Choose a valid audience');
        values.audience = v || null;
        break;
      }
      case 'slug': {
        const v = slugify(text(raw) as string);
        if (!v) errors.push('The web address (slug) cannot be empty');
        values.slug = v;
        break;
      }
      case 'title': {
        const v = text(raw) as string;
        if (!v) errors.push('A title is required');
        values.title = v;
        break;
      }
      case 'seo_title': {
        const v = text(raw) as string;
        if (v.length > 120) errors.push('SEO title must be 120 characters or fewer');
        values.seo_title = v || null;
        break;
      }
      case 'meta_description': {
        const v = text(raw) as string;
        if (v.length > 320) errors.push('Meta description must be 320 characters or fewer');
        values.meta_description = v || null;
        break;
      }
      case 'featured_image_url': {
        const v = text(raw) as string;
        if (v && !/^https?:\/\//i.test(v)) errors.push('Image address must start with http:// or https://');
        values.featured_image_url = v || null;
        break;
      }
      default: {
        const v = text(raw) as string;
        values[key] = key === 'body' ? (typeof raw === 'string' ? raw : '') : v || null;
      }
    }
  }
  return { values, errors };
}
