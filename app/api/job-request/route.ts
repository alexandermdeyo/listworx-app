import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { findMatchedContractors } from '@/lib/contractor-matching';
import {
  recordReferrals,
  buildRequestorCards,
  sendContractorReferralEmails,
  sendRequestorMatchEmail,
} from '@/lib/server/referral-delivery';
import { sendEmail } from '@/lib/send-email';
import { notifyAdmin, brandedEmail, detailRows, esc, BASE_URL as SITE_BASE } from '@/lib/server/notify';

export const dynamic = 'force-dynamic';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizeUrgency(value: string | null | undefined) {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'ASAP' || normalized === 'IMMEDIATE') return 'IMMEDIATE';
  if (normalized === 'URGENT' || normalized === 'WITHIN_WEEK') return 'WITHIN_WEEK';
  if (normalized === 'STANDARD' || normalized === 'WITHIN_MONTH') return 'WITHIN_MONTH';
  if (normalized === 'FLEXIBLE') return 'FLEXIBLE';
  return 'WITHIN_MONTH';
}

/* ─────────────────────────────────────────────────────────────
   MAIN HANDLER
   ───────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      clientName,
      clientEmail,
      clientPhone,
      clientType,
      propertyAddressLine1,
      propertyCity,
      propertyStateCode,
      propertyCountyId,
      propertyZip,
      urgencyLevel,
      description,
      categoryIds,
      company_website: honeypot,
    } = body;

    // Honeypot: a real user never fills the hidden "company website" field.
    // Pretend it worked so the bot moves on, but create nothing.
    if (typeof honeypot === 'string' && honeypot.trim() !== '') {
      console.warn('[job-request] honeypot tripped — dropping submission');
      return NextResponse.json({ id: null, dropped: true }, { status: 200 });
    }

    // Street address is optional now; county + city + state still required
    // because that's what drives contractor matching.
    if (
      !clientName ||
      !clientEmail ||
      !clientType ||
      !propertyCity ||
      !propertyStateCode ||
      !propertyCountyId ||
      !description ||
      !Array.isArray(categoryIds) ||
      categoryIds.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // ── lightweight origin + spam signal capture ──────────────────
    const hdr = request.headers;
    const sourceIp =
      hdr.get('x-forwarded-for')?.split(',')[0].trim() ||
      hdr.get('x-real-ip') ||
      null;
    const userAgent = hdr.get('user-agent') || null;
    const sourceReferer = hdr.get('referer') || null;

    const addr = String(propertyAddressLine1 || '').trim();
    const desc = String(description || '').trim();
    const phoneDigits = String(clientPhone || '').replace(/\D/g, '');
    let spamScore = 0;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(String(clientEmail || ''))) spamScore += 2;
    if (/(^|@)(example|test|mailinator|guerrillamail|10minutemail)\./i.test(String(clientEmail || ''))) spamScore += 2;
    if (phoneDigits.length < 10 || /^(\d)\1+$/.test(phoneDigits) || phoneDigits === '1234567890') spamScore += 2;
    if (desc.length < 8 || !/[a-z]{3,}/i.test(desc)) spamScore += 1;
    if (!/\b(name|llc|inc|realty|properties|smith|jones|home|owner)\b/i.test(String(clientName || '')) && String(clientName || '').split(/\s+/).length < 2) spamScore += 1;
    if (!hdr.get('user-agent')) spamScore += 2;
    const flaggedSpam = spamScore >= 4;

    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    const supabase = createAdminClient();

    // The public request form allows anonymous submission — no account required.
    // For logged-in users, the profile table to check depends on role: REALTORs
    // are stored in realtor_profiles, HOMEOWNER/PROPERTY_MANAGER in requestor_profiles.
    // requestor_profiles is the only one with a matching FK column on job_requests
    // (requestor_profile_id), so that's the only lookup result we store. A missing
    // profile never blocks submission — the form fields are used directly either way.
    let requestorProfileId: string | null = null;

    if (user) {
      const { data: appUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = String(appUser?.role || '').toUpperCase();

      if (role === 'HOMEOWNER' || role === 'PROPERTY_MANAGER') {
        const { data: requestorProfile, error: requestorProfileError } = await supabase
          .from('requestor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (requestorProfileError) {
          console.error('[job-request] requestor profile lookup failed:', requestorProfileError);
        }

        requestorProfileId = requestorProfile?.id ?? null;
      } else if (role === 'REALTOR') {
        const { error: realtorProfileError } = await supabase
          .from('realtor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (realtorProfileError) {
          console.error('[job-request] realtor profile lookup failed:', realtorProfileError);
        }
      }
    }

    const { data: countyRow, error: countyError } = await supabase
      .from('counties')
      .select('id, name, state_code')
      .eq('id', propertyCountyId)
      .maybeSingle();

    if (countyError) {
      console.error('[job-request] county lookup failed:', countyError);
      return NextResponse.json(
        { error: countyError.message || 'Failed to load county information.' },
        { status: 500 }
      );
    }

    const propertyCounty = countyRow?.name || '';
    const stateCode = countyRow?.state_code || propertyStateCode;
    const normalizedUrgency = normalizeUrgency(urgencyLevel);

    const { data: jobRequest, error: jobRequestError } = await supabase
      .from('job_requests')
      .insert({
        requestor_profile_id: requestorProfileId,
        requester_name: clientName.trim(),
        requester_email: clientEmail.trim().toLowerCase(),
        requester_phone: clientPhone?.trim() || '',
        requester_type: clientType,
        property_address: addr || null,
        property_city: propertyCity.trim(),
        property_state: stateCode,
        property_county: propertyCounty,
        property_zip: propertyZip?.trim() || '',
        state_code: stateCode,
        county_id: propertyCountyId,
        job_description: description.trim(),
        urgency: normalizedUrgency,
        status: 'PENDING',
        source_ip: sourceIp,
        user_agent: userAgent,
        source_referer: sourceReferer,
        spam_score: spamScore,
        flagged_spam: flaggedSpam,
      })
      .select()
      .single();

    if (jobRequestError || !jobRequest) {
      console.error('[job-request] insert failed:', jobRequestError);
      return NextResponse.json(
        { error: jobRequestError?.message || 'Failed to create request.' },
        { status: 500 }
      );
    }

    const categoryRows = categoryIds.map((categoryId: string) => ({
      job_request_id: jobRequest.id,
      category_id: categoryId,
    }));

    const { error: categoryLinkError } = await supabase
      .from('job_request_categories')
      .insert(categoryRows);

    if (categoryLinkError) {
      console.error('[job-request] category link failed:', categoryLinkError);
    }

    // ── MATCHING LOGIC — untouched ──────────────────────────
    const matchedContractors = flaggedSpam ? [] : await findMatchedContractors(supabase, {
      countyId: propertyCountyId,
      categoryIds,
      jobRequestId: jobRequest.id,
    });

    // ── REFERRAL RECORDING ──────────────────────────────────
    // Suspected spam is held for administrator review: no contractor is shown,
    // emailed or counted until an admin releases it (owner rule 2026-11-12).
    // Otherwise a referral counts when the contractor's information is
    // delivered (this response and the requestor email).
    const heldForReview = flaggedSpam;
    const { delivered, failed: referralRecordingFailed } = heldForReview
      ? { delivered: [] as Array<(typeof matchedContractors)[number] & { referralId: string }>, failed: false }
      : await recordReferrals(supabase, jobRequest.id, matchedContractors);
    // ── END MATCHING LOGIC ──────────────────────────────────

    // ── EMAIL NOTIFICATIONS — fired after all DB writes ────
    // Awaited on purpose: on Netlify the function is frozen as soon as the
    // response is returned, so un-awaited emails can silently never send.
    const { data: categoryNameRows } = await supabase
      .from('categories')
      .select('name')
      .in('id', categoryIds);

    const categoryNames = (categoryNameRows || []).map((r: any) => r.name).filter(Boolean);
    const locationText = [propertyCity.trim(), propertyCounty ? `${propertyCounty} County` : '', stateCode].filter(Boolean).join(', ');
    const urgencyLabel: Record<string, string> = {
      IMMEDIATE: 'ASAP',
      WITHIN_WEEK: 'Within a week',
      WITHIN_MONTH: 'Within a month',
      FLEXIBLE: 'Flexible',
    };

    const emailJobs: Promise<unknown>[] = [];

    const requestorCards = await buildRequestorCards(supabase, delivered, categoryIds, categoryNames);

    let requestorEmailSent = false;

    if (!flaggedSpam && delivered.length > 0) {
      // 1. Notify each referred contractor — once per referral, no job or requestor details
      emailJobs.push(
        sendContractorReferralEmails(supabase, delivered).catch((err) =>
          console.error('[job-request] contractor email batch error:', err)
        ),
      );

      // 2. Send requestor their matched contractor cards
      emailJobs.push(
        sendRequestorMatchEmail(supabase, delivered, {
          requesterName: clientName.trim(),
          requesterEmail: clientEmail.trim().toLowerCase(),
          propertyAddress: [addr, propertyCity.trim(), stateCode].filter(Boolean).join(', '),
          categoryNames,
          jobRequestId: jobRequest.id,
        })
          .then((sent) => {
            requestorEmailSent = sent;
          })
          .catch((err) => console.error('[job-request] requestor email error:', err)),
      );
    }

    if (!flaggedSpam && delivered.length === 0) {
      // 2b. No pros matched yet: still confirm to the requestor so they aren't left hanging.
      const first = clientName.trim().split(/\s+/)[0] || 'there';
      emailJobs.push(
        sendEmail({
          to: clientEmail.trim().toLowerCase(),
          subject: 'We got your request. A ListWorx pro is on the way.',
          replyTo: 'adeyo@listworx.co',
          html: brandedEmail({
            kicker: 'Request received',
            title: `Thanks, ${first}. We’re on it.`,
            body: `<p>We received your request for <strong>${esc(categoryNames.join(', ') || 'home services')}</strong> in ${esc(locationText)}.</p>
              <p>We’re hand-matching you with IronClad-verified pros for this one. You’ll hear from us within <strong>one business day</strong> with your options. You choose who to talk to. No spam and no bidding wars.</p>
              <p>Need it sooner? Just reply to this email or call <a href="tel:6153624996" style="color:#E85000;">615-362-4996</a>.</p>
              <p>— Alex Deyo, Founder, ListWorx</p>`,
          }),
        }).catch((err) => console.error('[job-request] no-match confirmation email error:', err)),
      );
    }

    // 3. Always tell the admin.
    const alertTitle = flaggedSpam
      ? '⚠️ Possible spam — held for your review (no contractors shown, emailed or counted)'
      : referralRecordingFailed
        ? '🔴 New job request: matched pros could NOT be recorded (follow up)'
        : delivered.length === 0
          ? '🔴 New job request: NO pros matched (follow up)'
          : `🟢 New job request: ${delivered.length} pro${delivered.length === 1 ? '' : 's'} referred`;
    emailJobs.push(
      notifyAdmin(
        `${alertTitle} · ${categoryNames[0] || 'Request'} · ${propertyCounty || propertyCity}`,
        brandedEmail({
          kicker: 'Admin alert',
          title: alertTitle,
          body: detailRows([
            ['Name', clientName.trim()],
            ['Email', clientEmail.trim().toLowerCase()],
            ['Phone', clientPhone?.trim() || ''],
            ['Type', clientType],
            ['Services', categoryNames.join(', ')],
            ['Location', [addr, locationText, propertyZip?.trim()].filter(Boolean).join(', ')],
            ['Timing', urgencyLabel[normalizedUrgency] || normalizedUrgency],
            ['Details', description.trim()],
            ['Referred pros', delivered.length ? delivered.map((c) => `${c.company_name} (${c.tier || 'basic'})`).join('\n') : 'None. Requestor was told you will follow up within one business day.'],
            ['Spam score', `${spamScore}${flaggedSpam ? ' (flagged)' : ''}`],
          ]),
          ctaLabel: 'Open in Admin',
          ctaHref: `${SITE_BASE}/admin/crm/job-requests`,
        }),
        clientEmail.trim().toLowerCase(),
      ),
    );

    await Promise.allSettled(emailJobs);
    // ── END EMAIL NOTIFICATIONS ─────────────────────────────

    return NextResponse.json({
      success: true,
      jobRequestId: jobRequest.id,
      // Each contractor here has a recorded referral (delivered = counted).
      // Public card fields only — never private document links, billing IDs or subscription.
      // Public card fields only — never subscription, billing or documents.
      contractors: requestorCards,
      noMatches: delivered.length === 0,
      heldForReview,
      // True only when the provider accepted the requestor's email.
      emailSent: requestorEmailSent,
    });
  } catch (error: any) {
    console.error('[job-request] unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
