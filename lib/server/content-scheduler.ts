/**
 * Content scheduler foundation (Stage 1B). DISABLED and DRY-RUN ONLY.
 *
 * - The switch lives in automation_settings.scheduler_enabled (false by default,
 *   changeable only by a reviewed migration or the server).
 * - Even when the switch is on, this stage only REPORTS which scheduled articles are
 *   due. It never publishes. Publishing (with a claim step so nothing publishes twice,
 *   plus history and failure logging) is a later, separately approved stage.
 * - Nothing calls this on a timer: no Netlify scheduled function is registered.
 */

type SupabaseLike = {
  from: (table: string) => any;
};

export type SchedulerResult =
  | { ran: false; reason: 'disabled' }
  | { ran: false; reason: 'dry_run'; due: { id: string; title: string; scheduled_for: string }[] };

export async function isSchedulerEnabled(supabase: SupabaseLike): Promise<boolean> {
  const { data } = await supabase.from('automation_settings').select('scheduler_enabled').maybeSingle();
  return data?.scheduler_enabled === true;
}

export async function findDueArticles(supabase: SupabaseLike, now: Date = new Date()) {
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, scheduled_for')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now.toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(50);
  return (data || []) as { id: string; title: string; scheduled_for: string }[];
}

export async function runContentScheduler(supabase: SupabaseLike, now: Date = new Date()): Promise<SchedulerResult> {
  if (!(await isSchedulerEnabled(supabase))) return { ran: false, reason: 'disabled' };
  // Stage 1B: report only. Publishing is intentionally not implemented yet.
  return { ran: false, reason: 'dry_run', due: await findDueArticles(supabase, now) };
}

/** Constant-time comparison for the scheduler's shared secret. */
export function secretMatches(given: string | null | undefined, expected: string | null | undefined): boolean {
  if (!given || !expected || expected.length < 32) return false;
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
