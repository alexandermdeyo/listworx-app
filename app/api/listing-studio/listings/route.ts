import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

// ── Auth + role helper ────────────────────────────────────────────────────────

async function getAuthedRealtor(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { user: null, error: 'Unauthorized', status: 401 } as const;
  }

  const admin = createSupabaseAdminClient();
  const { data: userRecord } = await admin
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();

  if (userRecord?.role !== 'REALTOR') {
    return { user: null, error: 'Listing Studio is only available for realtors', status: 403 } as const;
  }

  return { user: session.user, admin, error: null, status: 200 } as const;
}

// ── GET — list all listings for this realtor ──────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthedRealtor(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user, admin } = auth;

    const { data: listings, error } = await admin
      .from('listings')
      .select('*, listing_assets(*), listing_photos(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[listing-studio/listings] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ listings: listings ?? [] });
  } catch (error: any) {
    console.error('[listing-studio/listings] GET exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── POST — create a new listing ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthedRealtor(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user, admin } = auth;

    // Check that the realtor has content packages remaining
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

    // Parse and validate body
    const body = await request.json();
    const {
      address,
      city,
      state,
      zip,
      beds,
      baths,
      sqft,
      price,
      description,
      brand_name,
      brand_phone,
      brand_email,
      brand_color,
      photo_paths,
      primary_photo_index,
    } = body as Record<string, any>;

    if (!address || !city || !state || !zip || !beds || !baths || !sqft || !price || !description) {
      return NextResponse.json(
        { error: 'address, city, state, zip, beds, baths, sqft, price, and description are required.' },
        { status: 400 }
      );
    }

    // Generate a URL-safe slug with a 4-char random suffix for uniqueness
    const slugBase = `${address}-${city}-${state}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).slice(2, 6);
    const slug = `${slugBase}-${randomSuffix}`;

    const { data: listing, error } = await admin
      .from('listings')
      .insert({
        user_id: user.id,
        address,
        city,
        state,
        zip,
        beds: Number(beds),
        baths: Number(baths),
        sqft: Number(sqft),
        price: Number(price),
        description,
        brand_name:  brand_name  || null,
        brand_phone: brand_phone || null,
        brand_email: brand_email || null,
        brand_color: brand_color || '#ff6600',
        slug,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('[listing-studio/listings] POST insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ── Insert photo rows if any ─────────────────────────────────────────────
    if (Array.isArray(photo_paths) && photo_paths.length > 0) {
      const primaryIndex = typeof primary_photo_index === 'number' ? primary_photo_index : 0;
      const photoRows = photo_paths.map((path: string, index: number) => ({
        listing_id: listing.id,
        storage_path: path,
        display_order: index,
        is_primary: index === primaryIndex,
      }));

      const { error: photoError } = await admin
        .from('listing_photos')
        .insert(photoRows);

      if (photoError) {
        console.error('[listing-studio/listings] Photo insert error:', photoError);
        // Listing was created successfully — don't fail the whole request
      }
    }

    return NextResponse.json({ listing }, { status: 201 });
  } catch (error: any) {
    console.error('[listing-studio/listings] POST exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
