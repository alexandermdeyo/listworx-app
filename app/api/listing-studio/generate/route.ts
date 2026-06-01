import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const ASSET_TYPES = [
  'instagram_caption_1',
  'instagram_caption_2',
  'facebook_post',
  'email_subject',
  'email_body',
  'description_rewrite',
  'open_house_sheet',
] as const;

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a premier real estate marketing copywriter. Your work appears on printed flyers, open house sheets, and social media for top-producing realtors. Every word you write should make a prospective buyer feel something — curiosity, aspiration, urgency. Write with confidence and restraint. Avoid clichés like dream home, won't last long, nestled, boasting, stunning. Find the specific detail that makes this property worth wanting and lead with that. Write the way a great human copywriter would after walking through the home — not the way an AI fills a template. Do not use any emojis anywhere in any output. All content must be plain professional text only. No emoji characters of any kind in any field. Use your knowledge of the city, neighborhood, and surrounding region to add authentic local context. Reference proximity to real landmarks, lakes, schools, or districts naturally — the way a local agent would, not as a checklist.`;

const VISION_PREAMBLE = `You have been provided photos of the property. Study each photo carefully — the architectural style, interior finishes, lighting quality, spatial feel, outdoor spaces, lot character, and any details that would appeal to buyers. Use what you observe in the photos combined with the listing details to craft all outputs. Do not describe what you see in the photos explicitly. Let your observations inform the writing naturally, the way a skilled copywriter would after a personal walkthrough.`;

// ─── Types (module-level so they are always in scope) ─────────────────────────

type ImageBlock = {
  type: 'image';
  source: { type: 'url'; url: string };
};
type TextBlock = { type: 'text'; text: string };
type ContentBlock = TextBlock | ImageBlock;

// ─── Anthropic helper (module-level — never inside try blocks) ────────────────

async function callAnthropic(content: string | ContentBlock[]): Promise<Response> {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    }),
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const admin = createSupabaseAdminClient();

    // ── Role check ──────────────────────────────────────────────────────────
    const { data: userRecord } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (userRecord?.role !== 'REALTOR') {
      return NextResponse.json(
        { error: 'Listing Studio is only available for realtors' },
        { status: 403 }
      );
    }

    // ── Content package check ───────────────────────────────────────────────
    const { data: profile } = await admin
      .from('realtor_profiles')
      .select('content_packages_remaining')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile || profile.content_packages_remaining <= 0) {
      return NextResponse.json(
        { error: 'No content packages remaining. Please upgrade or purchase more.' },
        { status: 403 }
      );
    }

    // ── Parse body (own try/catch so a bad body returns 400, not 500) ────────
    let listingId: string;
    try {
      const body = await request.json();
      listingId = body?.listingId;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!listingId) {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
    }

    console.log(`[listing-studio/generate] Request received — listingId=${listingId} user=${user.id}`);

    // ── Fetch listing (verify ownership) ───────────────────────────────────
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      console.error(`[listing-studio/generate] Listing not found — listingId=${listingId}`, listingError);
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // ── Fetch listing photos and build signed URLs for vision ───────────────
    console.log(`[listing-studio/generate] Starting photo fetch for listingId=${listingId}`);

    const { data: photoRows, error: photoFetchError } = await admin
      .from('listing_photos')
      .select('storage_path')
      .eq('listing_id', listingId);

    if (photoFetchError) {
      console.warn('[listing-studio/generate] listing_photos query error (continuing without photos):', photoFetchError.message);
    }

    const imageBlocks: ImageBlock[] = [];

    if (photoRows && photoRows.length > 0) {
      console.log(`[listing-studio/generate] Found ${photoRows.length} photo row(s) — generating signed URLs`);

      for (const row of photoRows) {
        try {
          const { data: signedData, error: signedError } = await admin.storage
            .from('listing-photos')
            .createSignedUrl(row.storage_path, 60);

          if (signedError || !signedData?.signedUrl) {
            console.warn(
              `[listing-studio/generate] Failed to sign URL for path=${row.storage_path}:`,
              signedError?.message ?? 'no signedUrl returned'
            );
            continue;
          }

          console.log(`[listing-studio/generate] Signed URL generated for path=${row.storage_path}`);
          imageBlocks.push({
            type: 'image',
            source: { type: 'url', url: signedData.signedUrl },
          });
        } catch (signErr: any) {
          console.warn(
            `[listing-studio/generate] createSignedUrl threw for path=${row.storage_path}:`,
            signErr?.message
          );
        }
      }
    } else {
      console.log(`[listing-studio/generate] No photos found for listingId=${listingId} — text-only generation`);
    }

    console.log(
      `[listing-studio/generate] Photos for vision: ${imageBlocks.length} of ${photoRows?.length ?? 0}`
    );

    // ── Fetch brand kit (best-effort — falls back gracefully if missing) ───────
    const { data: brandKit } = await admin
      .from('realtor_brand_kits')
      .select('display_name, brokerage_name, preferred_cta, disclaimer_text, job_title')
      .eq('user_id', user.id)
      .maybeSingle();

    const agentName    = brandKit?.display_name    || listing.brand_name  || 'Your Agent';
    const brokerage    = brandKit?.brokerage_name  || '';
    const jobTitle     = brandKit?.job_title       || '';
    const preferredCta = brandKit?.preferred_cta   || '';
    const disclaimer   = brandKit?.disclaimer_text || '';

    const brandLine = [agentName, jobTitle, brokerage].filter(Boolean).join(' | ');
    const ctaLine   = preferredCta ? `\nPreferred CTA for closing lines: ${preferredCta}` : '';
    const discLine  = disclaimer   ? `\nDisclaimer (append to email_body only): ${disclaimer}` : '';

    // ── Build task text ──────────────────────────────────────────────────────
    const taskText = `Return ONLY valid JSON with these exact keys. No markdown, no preamble, no explanation. Just the JSON object:

{
  "instagram_caption_1": "...",
  "instagram_caption_2": "...",
  "facebook_post": "...",
  "email_subject": "...",
  "email_body": "...",
  "description_rewrite": "...",
  "open_house_sheet": "..."
}

For open_house_sheet: write a formatted property information sheet for open house visitors. Include address, price, beds/baths/sqft, key features as bullet points, and agent name and contact info. Professional and clean.
For email_body: sign off with the agent's name and brokerage. If a disclaimer is provided, append it as the final line.
For all outputs: use the agent's preferred CTA in the closing line where appropriate.${ctaLine}${discLine}

Property details:
Address: ${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}
Beds: ${listing.beds} | Baths: ${listing.baths} | Sqft: ${listing.sqft} | Price: $${listing.price}
Description: ${listing.description}

Agent: ${brandLine} | ${listing.brand_phone || ''} | ${listing.brand_email || ''}`;

    // If photos are available, build a multimodal content array; otherwise plain text
    const userContent: string | ContentBlock[] =
      imageBlocks.length > 0
        ? ([
            { type: 'text', text: VISION_PREAMBLE },
            ...imageBlocks,
            { type: 'text', text: taskText },
          ] as ContentBlock[])
        : taskText;

    // ── Call Anthropic ────────────────────────────────────────────────────────
    console.log(
      `[listing-studio/generate] Calling Anthropic — ${imageBlocks.length} image(s) attached, model=claude-sonnet-4-6`
    );

    let anthropicRes = await callAnthropic(userContent);

    // If multimodal call failed (e.g. model doesn't support URL-type images), retry text-only
    if (!anthropicRes.ok && imageBlocks.length > 0) {
      console.warn(
        `[listing-studio/generate] Multimodal call failed (status ${anthropicRes.status}) — retrying text-only`
      );
      anthropicRes = await callAnthropic(taskText);
    }

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[listing-studio/generate] Anthropic API error:', errText);
      return NextResponse.json({ error: 'AI generation failed', detail: errText }, { status: 500 });
    }

    const anthropicData = await anthropicRes.json();
    const rawText: string = anthropicData.content?.[0]?.text || '';

    console.log(`[listing-studio/generate] Anthropic responded — raw length=${rawText.length}`);
    console.log('[listing-studio/generate] Response preview:', rawText.substring(0, 300));

    // ── Parse JSON from response ────────────────────────────────────────────
    let parsed: Record<string, string>;
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('[listing-studio/generate] JSON parse failed. Raw text:', rawText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: cleaned.substring(0, 500) },
        { status: 500 }
      );
    }

    // ── Save assets (upsert so regeneration overwrites) ─────────────────────
    const assetsToUpsert = ASSET_TYPES.map((assetType) => ({
      listing_id: listingId,
      asset_type: assetType,
      content: parsed[assetType] || '',
      version: 1,
    }));

    const { data: assets, error: assetsError } = await admin
      .from('listing_assets')
      .upsert(assetsToUpsert, { onConflict: 'listing_id,asset_type' })
      .select();

    if (assetsError) {
      console.error('[listing-studio/generate] Error saving assets:', assetsError);
      return NextResponse.json({ error: 'Failed to save generated content' }, { status: 500 });
    }

    // ── Decrement content_packages_remaining ────────────────────────────────
    const { error: decrementError } = await admin
      .from('realtor_profiles')
      .update({
        content_packages_remaining: profile.content_packages_remaining - 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (decrementError) {
      console.error('[listing-studio/generate] Failed to decrement packages:', decrementError);
    }

    console.log(
      `[listing-studio/generate] Done — listing=${listingId} user=${user.id} packages_remaining=${profile.content_packages_remaining - 1}`
    );

    return NextResponse.json({ assets, parsed });

  } catch (error: any) {
    console.error('[listing-studio/generate] Unhandled exception:', error?.message ?? error);
    return NextResponse.json(
      { error: 'Generation failed', detail: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
