import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/send-email';
import { contractorBadgeKitEmail, LISTWORX_SITE } from '@/lib/email-templates';

/** audit_logs.action for a delivered badge-kit email (one per contractor). */
export const BADGE_KIT_SENT_ACTION = 'badge_kit_email_sent';
/** audit_logs.action when sending failed, so an admin can see it and resend. */
export const BADGE_KIT_FAILED_ACTION = 'badge_kit_email_failed';

/** Public profile URL, only when the page is actually live. */
export function publicProfileUrl(profile: {
  profile_slug?: string | null;
  profile_published?: boolean | null;
  partner_status?: string | null;
  archived?: boolean | null;
}): string | null {
  if (!profile.profile_slug || profile.profile_published !== true) return null;
  if (profile.partner_status !== 'active' || profile.archived === true) return null;
  return `${LISTWORX_SITE}/contractor/${encodeURIComponent(profile.profile_slug)}`;
}

export type BadgeKitResult =
  | { status: 'sent'; to: string; resendId: string | null }
  | { status: 'already_sent' }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string };

/**
 * Sends the member welcome + badge kit email once, after an approved
 * contractor becomes an active member (free Network or a paid plan).
 * Never throws: membership activation must not fail because of email.
 */
export async function sendBadgeKitEmailOnce(
  supabase: SupabaseClient,
  contractorId: string,
): Promise<BadgeKitResult> {
  try {
    const { data: existing } = await supabase
      .from('audit_logs')
      .select('id')
      .eq('action', BADGE_KIT_SENT_ACTION)
      .eq('record_id', contractorId)
      .limit(1);
    if (existing && existing.length > 0) return { status: 'already_sent' };

    const { data: profile, error } = await supabase
      .from('contractor_profiles')
      .select('id, user_id, email, owner_name, company_name, partner_status, archived, ironclad_certified, profile_slug, profile_published')
      .eq('id', contractorId)
      .maybeSingle();
    if (error || !profile) return { status: 'skipped', reason: 'profile not found' };
    if (profile.partner_status !== 'active' || profile.archived === true) {
      return { status: 'skipped', reason: 'not an active member' };
    }

    let to = (profile.email || '').trim();
    if (!to && profile.user_id) {
      const { data: user } = await supabase.from('users').select('email').eq('id', profile.user_id).maybeSingle();
      to = (user?.email || '').trim();
    }
    if (!to) return { status: 'skipped', reason: 'no email address' };

    const profileUrl = publicProfileUrl(profile);
    const certified = profile.ironclad_certified === true;
    const email = contractorBadgeKitEmail({
      ownerName: profile.owner_name,
      companyName: profile.company_name,
      profileUrl,
      certified,
    });

    const logBase = { table_name: 'contractor_profiles', record_id: contractorId, user_id: profile.user_id || null };
    try {
      const result = await sendEmail({ to, subject: email.subject, html: email.html, text: email.text, replyTo: 'adeyo@listworx.co' });
      const resendId = (result as any)?.id ?? null;
      const { error: logError } = await supabase.from('audit_logs').insert({
        ...logBase,
        action: BADGE_KIT_SENT_ACTION,
        changes: { to, subject: email.subject, resend_id: resendId, profile_url: profileUrl, certified_badge: certified },
      });
      if (logError) console.error('[badge-kit] sent but could not log the send:', logError);
      console.log(`[badge-kit] sent to contractor ${contractorId}`);
      return { status: 'sent', to, resendId };
    } catch (sendError: any) {
      const message = sendError?.message || 'send failed';
      await supabase.from('audit_logs').insert({
        ...logBase,
        action: BADGE_KIT_FAILED_ACTION,
        changes: { to, subject: email.subject, error: message },
      });
      console.error(`[badge-kit] send failed for contractor ${contractorId}:`, message);
      return { status: 'failed', error: message };
    }
  } catch (err: any) {
    console.error('[badge-kit] unexpected error:', err);
    return { status: 'failed', error: err?.message || 'unexpected error' };
  }
}
