import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import Link from 'next/link';
import type { Metadata } from 'next';

// Always SSR — never statically pre-rendered at build time
export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────

type BrandKit = {
  display_name:       string | null;
  job_title:          string | null;
  brokerage_name:     string | null;
  license_number:     string | null;
  phone:              string | null;
  email:              string | null;
  website:            string | null;
  headshot_url:       string | null;
  cover_photo_url:    string | null;
  personal_logo_url:  string | null;
  brokerage_logo_url: string | null;
  primary_color:      string | null;
  secondary_color:    string | null;
  instagram_handle:   string | null;
  facebook_url:       string | null;
  linkedin_url:       string | null;
  youtube_url:        string | null;
  bio:                string | null;
  preferred_cta:      string | null;
  disclaimer_text:    string | null;
};

type ListingWithPhoto = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  price: number;
  photoUrl: string | null;
};

type ShowcasePost = {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  media_type: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return `$${Number(n).toLocaleString()}`;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from('realtor_brand_kits')
      .select('display_name, brokerage_name')
      .eq('user_id', params.id)
      .maybeSingle();

    const name = data?.display_name || 'Realtor';
    const brokerage = data?.brokerage_name ? ` — ${data.brokerage_name}` : '';
    return { title: `${name}${brokerage} | ListWorx` };
  } catch {
    return { title: 'Realtor Profile | ListWorx' };
  }
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default async function RealtorProfilePage({
  params,
}: {
  params: { id: string };
}) {
  // ── Fetch all data ───────────────────────────────────────────────────────────
  let kit: BrandKit | null = null;
  let listings: ListingWithPhoto[] = [];
  let showcase: ShowcasePost[] = [];

  try {
    const admin = createSupabaseAdminClient();

    const { data: brandKit } = await admin
      .from('realtor_brand_kits')
      .select('*')
      .eq('user_id', params.id)
      .maybeSingle();

    if (!brandKit) {
      // Brand kit not set up yet — show a friendly placeholder instead of 404
      return (
        <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: "'Barlow', Arial, sans-serif" }}>
          <div className="text-center max-w-md px-6">
            <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-6">
              <svg className="h-10 w-10 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile not set up yet</h1>
            <p className="text-gray-500 text-sm mb-6">
              This realtor hasn't published their profile yet. Check back soon.
            </p>
            <Link
              href="/requestor-dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-white font-semibold text-sm"
              style={{ backgroundColor: '#E8621A' }}
            >
              Back to Your Dashboard
            </Link>
          </div>
        </div>
      );
    }

    kit = brandKit as BrandKit;

    // ── Fetch public listings ──────────────────────────────────────────────────
    const { data: rawListings } = await admin
      .from('listings')
      .select('id, address, city, state, zip, beds, baths, sqft, price, listing_photos(*)')
      .eq('user_id', params.id)
      .eq('show_on_profile', true)
      .order('created_at', { ascending: false });

    // Generate signed URLs for primary photos (private listing-photos bucket)
    listings = await Promise.all(
      (rawListings ?? []).map(async (listing: any) => {
        const photos: any[] = listing.listing_photos ?? [];
        const primary = photos.find((p) => p.is_primary) ?? photos[0];

        let photoUrl: string | null = null;
        if (primary?.storage_path) {
          try {
            const { data: signed } = await admin.storage
              .from('listing-photos')
              .createSignedUrl(primary.storage_path, 3600);
            photoUrl = signed?.signedUrl ?? null;
          } catch {}
        }

        return {
          id:      listing.id,
          address: listing.address,
          city:    listing.city,
          state:   listing.state,
          zip:     listing.zip,
          beds:    listing.beds,
          baths:   listing.baths,
          sqft:    listing.sqft,
          price:   listing.price,
          photoUrl,
        };
      })
    );

    // ── Fetch showcase posts ───────────────────────────────────────────────────
    const { data: showcaseRaw } = await admin
      .from('realtor_showcase_posts')
      .select('id, image_url, caption, display_order, media_type')
      .eq('user_id', params.id)
      .order('display_order', { ascending: true });

    showcase = (showcaseRaw ?? []) as ShowcasePost[];

  } catch (err: any) {
    console.error('[realtors/[id]] page error:', err?.message);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 text-sm mb-6">We couldn't load this profile. Please try again.</p>
          <Link href="/requestor-dashboard" className="text-sm font-semibold" style={{ color: '#E8621A' }}>
            Back to Your Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!kit) return null;

  // ── Derived ──────────────────────────────────────────────────────────────────
  const accentColor    = kit.primary_color || '#E8621A';
  const contactEmail   = kit.email || '';
  const mailtoSubject  = `Inquiry from ListWorx — ${kit.display_name || 'Realtor'}`;
  const hasSocialLinks = kit.phone || kit.email || kit.website || kit.instagram_handle
                         || kit.facebook_url || kit.linkedin_url || kit.youtube_url;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Barlow', Arial, sans-serif" }}>

      {/* ── Cover photo ───────────────────────────────────────────────────── */}
      <div
        className="relative w-full h-56 md:h-80 bg-zinc-800"
        style={kit.cover_photo_url
          ? { backgroundImage: `url(${kit.cover_photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Headshot + identity ─────────────────────────────────────────── */}
        <div className="relative flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 mb-6">
          {kit.headshot_url ? (
            <img
              src={kit.headshot_url}
              alt={kit.display_name || ''}
              className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover bg-zinc-200 shrink-0"
            />
          ) : (
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-zinc-200 shrink-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-zinc-500">
                {(kit.display_name || '?')[0]?.toUpperCase()}
              </span>
            </div>
          )}

          <div className="pb-1">
            {kit.display_name && (
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{kit.display_name}</h1>
            )}
            <p className="text-gray-500 text-sm mt-0.5">
              {[kit.job_title, kit.brokerage_name].filter(Boolean).join(' · ')}
            </p>
            {kit.license_number && (
              <p className="text-gray-400 text-xs mt-0.5">License #{kit.license_number}</p>
            )}
          </div>
        </div>

        {/* ── Bio ─────────────────────────────────────────────────────────── */}
        {kit.bio && (
          <p className="text-gray-700 text-base leading-relaxed mb-8 max-w-2xl">{kit.bio}</p>
        )}

        {/* ── Contact bar ─────────────────────────────────────────────────── */}
        {hasSocialLinks && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {kit.phone && (
              <a href={`tel:${kit.phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                </svg>
                {kit.phone}
              </a>
            )}
            {kit.email && (
              <a href={`mailto:${kit.email}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {kit.email}
              </a>
            )}
            {kit.website && (
              <a href={kit.website.startsWith('http') ? kit.website : `https://${kit.website}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                {kit.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {kit.instagram_handle && (
              <a href={`https://instagram.com/${kit.instagram_handle}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">
                {/* Instagram icon */}
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                @{kit.instagram_handle}
              </a>
            )}
            {kit.youtube_url && (
              <a href={kit.youtube_url.startsWith('http') ? kit.youtube_url : `https://${kit.youtube_url}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition">
                {/* YouTube icon */}
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                YouTube
              </a>
            )}
          </div>
        )}

        {/* ── Email CTA ────────────────────────────────────────────────────── */}
        {contactEmail && (
          <div className="mb-12">
            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent(mailtoSubject)}`}
              className="inline-flex items-center gap-2 rounded-xl px-8 py-4 text-white font-bold text-base shadow-md hover:opacity-90 transition"
              style={{ backgroundColor: accentColor }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email {kit.display_name?.split(' ')[0] || 'This Realtor'}
            </a>
          </div>
        )}

        {/* ── Current Listings ─────────────────────────────────────────────── */}
        {listings.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-900 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition"
                >
                  <div className="relative w-full aspect-[4/3] bg-zinc-800">
                    {listing.photoUrl ? (
                      <img src={listing.photoUrl} alt={listing.address} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="h-12 w-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-white font-semibold text-sm">{listing.address}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">{listing.city}, {listing.state} {listing.zip}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                      <span>{listing.beds} bd</span><span>·</span>
                      <span>{listing.baths} ba</span><span>·</span>
                      <span>{listing.sqft?.toLocaleString()} sqft</span>
                    </div>
                    <p className="font-bold text-sm mt-1" style={{ color: accentColor }}>
                      {formatPrice(listing.price)}
                    </p>
                    {contactEmail && (
                      <a
                        href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Inquiry about ${listing.address} — ${listing.city}, ${listing.state}`)}`}
                        className="mt-auto pt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg py-2 text-white text-xs font-semibold transition hover:opacity-90"
                        style={{ backgroundColor: accentColor }}
                      >
                        Contact Realtor
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Social Media Showcase ─────────────────────────────────────────── */}
        {showcase.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">From the Field</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {showcase.map((post) => (
                <div key={post.id} className="flex flex-col gap-2">
                  <div className="aspect-square rounded-xl overflow-hidden bg-zinc-100">
                    {post.media_type === 'video' ? (
                      <video
                        src={post.image_url}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      />
                    ) : (
                      <img src={post.image_url} alt={post.caption || ''} className="w-full h-full object-cover" />
                    )}
                  </div>
                  {post.caption && (
                    <p className="text-xs text-gray-500 leading-snug px-0.5">{post.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Logos ─────────────────────────────────────────────────────────── */}
        {(kit.personal_logo_url || kit.brokerage_logo_url) && (
          <div className="flex items-center gap-6 mb-12 pb-12 border-t border-gray-100 pt-8">
            {kit.personal_logo_url && (
              <img src={kit.personal_logo_url} alt="Personal logo" className="h-10 object-contain" />
            )}
            {kit.brokerage_logo_url && (
              <img src={kit.brokerage_logo_url} alt="Brokerage logo" className="h-10 object-contain" />
            )}
          </div>
        )}

        {/* ── Disclaimer ────────────────────────────────────────────────────── */}
        {kit.disclaimer_text && (
          <p className="text-xs text-gray-400 leading-relaxed pb-12">{kit.disclaimer_text}</p>
        )}

      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        Profile powered by{' '}
        <Link href="/" className="font-semibold hover:underline" style={{ color: accentColor }}>
          ListWorx
        </Link>
      </footer>
    </div>
  );
}
