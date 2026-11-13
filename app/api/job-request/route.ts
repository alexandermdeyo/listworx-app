import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import {
  findMatchedContractors,
  buildReferralRows,
  buildJobAssignmentRows,
  incrementReferralCounts,
} from '@/lib/contractor-matching';
import { deliverableContractors, notifyReferredContractors, requestorCard, REQUESTOR_CARD_FIELDS } from '@/lib/server/referral-notify';
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
   EMAIL HELPERS — called only AFTER all DB writes complete.
   These do NOT modify any referral/matching logic.
   ───────────────────────────────────────────────────────────── */

/** Referral notification for each delivered contractor — once per referral, no job details. */
async function sendContractorReferralEmails(
  supabase: ReturnType<typeof createAdminClient>,
  delivered: Array<{ id: string; referralId: string; company_name: string; owner_name: string; email: string }>
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const results = await notifyReferredContractors(
    delivered.map((c) => ({
      referralId: c.referralId,
      email: c.email,
      ownerName: c.owner_name,
      companyName: c.company_name,
    })),
    {
      async claim(referralId) {
        const { data, error } = await supabase
          .from('referrals')
          .update({ email_sent: true, email_sent_at: new Date().toISOString() })
          .eq('id', referralId)
          .eq('email_sent', false)
          .select('id');
        if (error) {
          console.error('[job-request] referral email claim failed:', error);
          return false;
        }
        return (data || []).length === 1;
      },
      async release(referralId) {
        await supabase.from('referrals').update({ email_sent: false, email_sent_at: null }).eq('id', referralId);
      },
      async send(payload) {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-contractor-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          console.error('[job-request] contractor referral email failed:', await response.text());
        }
        return response.ok;
      },
    }
  );

  results
    .filter((r) => r.outcome === 'failed')
    .forEach((r) => console.error(`[job-request] referral email not sent for referral ${r.referralId}`));
  return results;
}

async function sendRequestorMatchEmail(
  supabase: ReturnType<typeof createAdminClient>,
  matchedContractors: Array<{
    id: string;
    company_name: string;
    owner_name: string;
    email: string;
    phone: string;
    website: string | null;
    bio: string | null;
  }>,
  jobData: {
    requesterName: string;
    requesterEmail: string;
    propertyAddress: string;
    categoryNames: string[];
    jobRequestId: string;
  }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://listworx.co';

  // Fetch extra profile data (logo_url, profile_slug, specialties) for contractor cards
  const contractorIds = matchedContractors.map((c) => c.id);

  const [{ data: profileExtras }, { data: categoryRows }] = await Promise.all([
    supabase
      .from('contractor_profiles')
      .select('id, logo_url, profile_slug')
      .in('id', contractorIds),
    supabase
      .from('contractor_categories')
      .select('contractor_id, categories(name)')
      .in('contractor_id', contractorIds),
  ]);

  const logoMap: Record<string, string | null> = {};
  const slugMap: Record<string, string | null> = {};
  (profileExtras || []).forEach((p: any) => {
    logoMap[p.id] = p.logo_url || null;
    slugMap[p.id] = p.profile_slug || null;
  });

  const specialtyMap: Record<string, string[]> = {};
  (categoryRows || []).forEach((row: any) => {
    const cId = row.contractor_id;
    const name = row.categories?.name;
    if (cId && name) {
      if (!specialtyMap[cId]) specialtyMap[cId] = [];
      specialtyMap[cId].push(name);
    }
  });

  const contractorCards = matchedContractors.map((c) => ({
    name: c.owner_name,
    company: c.company_name,
    phone: c.phone,
    email: c.email,
    website: c.website || undefined,
    bio: c.bio || undefined,
    logoUrl: logoMap[c.id] || null,
    profileUrl: slugMap[c.id]
      ? `${BASE_URL}/contractors/${slugMap[c.id]}`
      : `${BASE_URL}/contractors/${c.id}`,
    specialties: specialtyMap[c.id] || [],
  }));

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-realtor-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        type: 'contractor_match',
        to: jobData.requesterEmail,
        realtorName: jobData.requesterName,
        propertyAddress: jobData.propertyAddress,
        services: jobData.categoryNames,
        contractors: contractorCards,
        jobRequestId: jobData.jobRequestId,
        matchedContractors: contractorCards.length,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[job-request] requestor match email failed:', text);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[job-request] requestor match email error:', err);
    return false;
  }
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
    const matchedContractors = await findMatchedContractors(supabase, {
      countyId: propertyCountyId,
      categoryIds,
      jobRequestId: jobRequest.id,
    });

    // ── REFERRAL RECORDING ──────────────────────────────────
    // A referral counts when the contractor's information is delivered to the
    // requestor (this response and the requestor email). Only contractors whose
    // referral row was recorded are delivered, so every contractor shown is
    // counted exactly once; the database allows one row per contractor/request.
    let referralRecordingFailed = false;
    let delivered: ReturnType<typeof deliverableContractors<(typeof matchedContractors)[number]>> = [];

    if (matchedContractors.length > 0) {
      const referralRows = buildReferralRows(jobRequest.id, matchedContractors);

      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .insert(referralRows)
        .select('id, contractor_id');

      if (referralError) {
        referralRecordingFailed = true;
        console.error('[job-request] referral insert failed — no contractors delivered:', referralError);
      }

      delivered = deliverableContractors(matchedContractors, referralError ? [] : referralData);

      if (delivered.length > 0) {
        const insertedReferrals = delivered.map((c) => ({ id: c.referralId, contractor_id: c.id }));
        const assignmentRows = buildJobAssignmentRows(jobRequest.id, delivered, insertedReferrals);

        const { error: assignmentError } = await supabase
          .from('job_assignments')
          .insert(assignmentRows);

        if (assignmentError) {
          console.error('[job-request] job assignment insert failed:', assignmentError);
        }

        await incrementReferralCounts(
          supabase,
          delivered.map((c) => c.id)
        );
      }
    }
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

    // The requested trade(s) each referred contractor covers, for the requestor's card.
    const tradeByContractor: Record<string, string> = {};
    // Public card fields straight from each profile (the matching result carries
    // only what matching needs, including the subscription tier, which requestors
    // must never see).
    const cardProfileById: Record<string, Record<string, unknown>> = {};
    if (delivered.length > 0) {
      const { data: cardRows, error: cardError } = await supabase
        .from('contractor_profiles')
        .select(REQUESTOR_CARD_FIELDS.join(', '))
        .in('id', delivered.map((c) => c.id));
      if (cardError) console.error('[job-request] card profile lookup failed:', cardError);
      ((cardRows || []) as unknown as Record<string, unknown>[]).forEach((row) => {
        cardProfileById[String(row.id)] = row;
      });

      const { data: tradeRows } = await supabase
        .from('contractor_categories')
        .select('contractor_id, category_id, categories(name)')
        .in('contractor_id', delivered.map((c) => c.id))
        .in('category_id', categoryIds);
      (tradeRows || []).forEach((row: any) => {
        const name = row.categories?.name;
        if (!name) return;
        tradeByContractor[row.contractor_id] = tradeByContractor[row.contractor_id]
          ? `${tradeByContractor[row.contractor_id]}, ${name}`
          : name;
      });
    }

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
      ? '⚠️ Possible spam job request (no emails sent)'
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
      contractors: delivered.map((c) =>
        requestorCard(
          cardProfileById[c.id] || { id: c.id, company_name: c.company_name, owner_name: c.owner_name, email: c.email, phone: c.phone, website: c.website, bio: c.bio },
          tradeByContractor[c.id] || categoryNames.join(', ')
        )
      ),
      noMatches: delivered.length === 0,
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
