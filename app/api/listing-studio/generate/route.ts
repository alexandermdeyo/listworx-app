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
] as const;

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
        {
          error:
            'No content packages remaining. Please upgrade or purchase more.',
        },
        { status: 403 }
      );
    }

    // ── Parse body ──────────────────────────────────────────────────────────
    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json(
        { error: 'listingId is required' },
        { status: 400 }
      );
    }

    // ── Fetch listing (verify ownership) ───────────────────────────────────
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .eq('user_id', user.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // ── Build prompt ────────────────────────────────────────────────────────
    const prompt = `You are a real estate marketing copywriter. Generate marketing content for this property listing.

Return ONLY valid JSON with these exact keys. No markdown, no preamble, no explanation. Just the JSON object:

{
  "instagram_caption_1": "...",
  "instagram_caption_2": "...",
  "facebook_post": "...",
  "email_subject": "...",
  "email_body": "...",
  "description_rewrite": "..."
}

Property details:
Address: ${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}
Beds: ${listing.beds} | Baths: ${listing.baths} | Sqft: ${listing.sqft} | Price: $${listing.price}
Description: ${listing.description}

Agent: ${listing.brand_name} | ${listing.brand_phone} | ${listing.brand_email}

Tone: Premium, warm, conversational, locally specific.`;

    // ── Call Anthropic ──────────────────────────────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('[listing-studio/generate] Anthropic API error:', errText);
      return NextResponse.json({ error: 'AI generation failed', detail: errText }, { status: 500 });
    }

    const anthropicData = await anthropicRes.json();
    const rawText: string = anthropicData.content?.[0]?.text || '';

    console.error('[generate] status:', anthropicRes.status);
    console.error('[generate] body preview:', rawText.substring(0, 500));

    // ── Parse JSON from response ────────────────────────────────────────────
    let parsed: Record<string, string>;
    try {
      // Strip possible markdown code fences
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[listing-studio/generate] JSON parse failed. Raw text:', rawText);
      return NextResponse.json(
        { error: 'Failed to parse AI response', rawText, detail: rawText },
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
      return NextResponse.json(
        { error: 'Failed to save generated content' },
        { status: 500 }
      );
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
      `[listing-studio/generate] Generated content for listing=${listingId} user=${user.id} — packages remaining: ${profile.content_packages_remaining - 1}`
    );

    return NextResponse.json({ assets, parsed });
  } catch (error: any) {
    console.error('[listing-studio/generate] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
