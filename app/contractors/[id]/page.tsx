import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/design-system';
import {
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Shield,
  Star,
  Video,
  Youtube,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type ContractorProfile = {
  id: string;
  company_name: string | null;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  bio: string | null;
  tagline: string | null;
  business_description: string | null;
  business_website: string | null;
  google_business_url: string | null;
  logo_url: string | null;
  profile_photo_url: string | null;
  years_in_business: number | null;
  partner_status: string | null;
  ironclad_accepted: boolean | null;
  ironclad_certified: boolean | null;
  founder_status: boolean | null;
  founding_partner: boolean | null;
  founding_partner_badge: boolean | null;
  show_phone_public: boolean | null;
  show_email_public: boolean | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  profile_slug: string | null;
  created_at: string | null;
};

type County = { id: string; name: string; state_code: string };
type Trade = { id: string; name: string };
type WorkPhoto = { id: string; public_url: string | null; caption: string | null; display_order: number | null };
type WorkVideo = { id: string; video_url: string; platform: string | null; caption: string | null; display_order: number | null };
type Credential = { id: string; document_type: string; expiration_date?: string | null; status?: string | null; created_at?: string | null; updated_at?: string | null };

type PublicProfileData = {
  profile: ContractorProfile;
  counties: County[];
  trades: Trade[];
  photos: WorkPhoto[];
  videos: WorkVideo[];
  credentials: Credential[];
};

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function normalizeWebsiteUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isActiveIronClad(profile: ContractorProfile) {
  return profile.partner_status === 'active' && (profile.ironclad_certified || profile.ironclad_accepted !== false);
}

function isFoundingPartner(profile: ContractorProfile) {
  return Boolean(profile.founder_status || profile.founding_partner || profile.founding_partner_badge);
}

function getVideoEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.match(/\/embed\/([^/?]+)/)?.[1] || parsed.pathname.match(/\/shorts\/([^/?]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : '';
    }
  } catch (_e) {}
  return '';
}

function getDocumentLabel(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('insurance')) return 'General Liability Insurance';
  if (normalized.includes('license')) return 'Business License';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function isCredentialVerified(credential: Credential) {
  const status = String(credential.status || '').toLowerCase();
  if (status && !['approved', 'verified'].includes(status)) return false;
  if (credential.expiration_date && new Date(credential.expiration_date) < new Date()) return false;
  return true;
}

async function getPublicProfile(idOrSlug: string): Promise<PublicProfileData | null> {
  const supabase = createAdminClient();
  const query = supabase
    .from('contractor_profiles')
    .select(`
      id,
      company_name,
      owner_name,
      email,
      phone,
      website,
      bio,
      tagline,
      business_description,
      business_website,
      google_business_url,
      logo_url,
      profile_photo_url,
      years_in_business,
      partner_status,
      ironclad_accepted,
      ironclad_certified,
      founder_status,
      founding_partner,
      founding_partner_badge,
      show_phone_public,
      show_email_public,
      facebook_url,
      instagram_url,
      tiktok_url,
      linkedin_url,
      youtube_url,
      profile_slug,
      created_at,
      archived
    `)
    .eq('archived', false);

  const { data: profile, error } = isUuid(idOrSlug)
    ? await query.eq('id', idOrSlug).maybeSingle()
    : await query.eq('profile_slug', idOrSlug).maybeSingle();

  if (error || !profile) return null;

  const [countiesRes, tradesRes, photosRes, videosRes, credentialsRes] = await Promise.all([
    supabase.from('contractor_counties').select('counties(id, name, state_code)').eq('contractor_id', profile.id),
    supabase.from('contractor_categories').select('categories(id, name)').eq('contractor_id', profile.id),
    supabase.from('contractor_work_photos').select('id, public_url, caption, display_order').eq('contractor_id', profile.id).order('display_order').order('created_at'),
    supabase.from('contractor_work_videos').select('id, video_url, platform, caption, display_order').eq('contractor_id', profile.id).order('display_order').order('created_at'),
    supabase.from('contractor_documents').select('id, document_type, expiration_date, status, created_at, updated_at').eq('contractor_id', profile.id),
  ]);

  return {
    profile: profile as ContractorProfile,
    counties: (countiesRes.data || []).map((row: any) => row.counties).filter(Boolean),
    trades: (tradesRes.data || []).map((row: any) => row.categories).filter(Boolean),
    photos: (photosRes.data || []) as WorkPhoto[],
    videos: (videosRes.data || []) as WorkVideo[],
    credentials: (credentialsRes.data || []) as Credential[],
  };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const data = await getPublicProfile(params.id);
  if (!data) {
    return { title: 'Contractor Profile | ListWorx' };
  }

  const trade = data.trades[0]?.name || 'Contractor';
  const county = data.counties[0]?.name || 'your area';
  const businessName = data.profile.company_name || 'Contractor';
  const description = `${businessName} is a vetted ${trade} contractor serving ${county}. IronClad certified through ListWorx.`;

  return {
    title: `${businessName} — ${trade} in ${county} | ListWorx`,
    description,
    openGraph: {
      title: `${businessName} | ListWorx`,
      description,
      images: data.profile.logo_url ? [{ url: data.profile.logo_url }] : undefined,
    },
  };
}

export default async function ContractorProfilePage({ params }: { params: { id: string } }) {
  const data = await getPublicProfile(params.id);
  if (!data) notFound();

  const { profile, counties, trades, photos, videos, credentials } = data;
  const businessName = profile.company_name || 'Contractor';
  const description = profile.business_description || profile.bio || '';
  const website = profile.business_website || profile.website;
  const verifiedCredentials = credentials.filter(isCredentialVerified);
  const lastCredentialDate = verifiedCredentials
    .map((credential) => credential.updated_at || credential.created_at)
    .filter(Boolean)
    .sort()
    .pop();
  const hasPublicContact = Boolean(website || (profile.show_phone_public && profile.phone) || (profile.show_email_public && profile.email));
  const socialLinks = [
    { label: 'Facebook', url: profile.facebook_url, icon: Facebook },
    { label: 'Instagram', url: profile.instagram_url, icon: Instagram },
    { label: 'TikTok', url: profile.tiktok_url, icon: Video },
    { label: 'LinkedIn', url: profile.linkedin_url, icon: Linkedin },
    { label: 'YouTube', url: profile.youtube_url, icon: Youtube },
  ].filter((item) => item.url);

  return (
    <PageShell surface="dark">
      <Navigation />
      <main className="container mx-auto max-w-6xl px-4 py-12">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-xl">
          <div className="grid gap-8 lg:grid-cols-[1fr,260px]">
            <div className="flex flex-col gap-6 sm:flex-row">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt={`${businessName} logo`} className="h-28 w-28 rounded-2xl border border-zinc-800 bg-white object-contain p-3" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900"><Building2 className="h-10 w-10 text-zinc-500" /></div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-4xl font-bold text-white md:text-5xl">{businessName}</h1>
                {profile.tagline && <p className="mt-3 text-xl text-zinc-300">{profile.tagline}</p>}
                <div className="mt-5 flex flex-wrap gap-2">
                  {trades.map((trade) => <Badge key={trade.id} className="bg-lw-rust text-white"><Briefcase className="mr-1 h-3 w-3" />{trade.name}</Badge>)}
                  {isActiveIronClad(profile) && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"><Shield className="mr-1 h-3 w-3" />IronClad Certified</Badge>}
                  {isFoundingPartner(profile) && <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30"><Award className="mr-1 h-3 w-3" />Founding Partner</Badge>}
                </div>
                <div className="mt-5 flex flex-wrap gap-4 text-sm text-zinc-400">
                  {profile.years_in_business ? <span><Star className="mr-1 inline h-4 w-4" />{profile.years_in_business} years in business</span> : null}
                  {counties.length > 0 ? <span><MapPin className="mr-1 inline h-4 w-4" />Serving {counties.map((county) => county.name).join(', ')}</span> : null}
                </div>
              </div>
            </div>
            {profile.profile_photo_url && <img src={profile.profile_photo_url} alt={`${businessName} profile photo`} className="h-64 w-full rounded-2xl object-cover" />}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr,340px]">
          <div className="space-y-8">
            {hasPublicContact ? (
              <Card className="border-zinc-800 bg-zinc-950 p-6">
                <h2 className="mb-4 text-2xl font-bold text-white">Contact / Action</h2>
                <div className="flex flex-wrap gap-3">
                  {website && <a href={normalizeWebsiteUrl(website)} target="_blank" rel="noopener noreferrer"><Button className="bg-lw-rust text-white hover:bg-lw-rust-hover"><Globe className="mr-2 h-4 w-4" />Visit Website</Button></a>}
                  {profile.show_phone_public && profile.phone && <a href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`}><Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-900"><Phone className="mr-2 h-4 w-4" />{profile.phone}</Button></a>}
                  {profile.show_email_public && profile.email && <a href={`mailto:${profile.email}`}><Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-900"><Mail className="mr-2 h-4 w-4" />Email Contractor</Button></a>}
                </div>
              </Card>
            ) : (
              <Card className="border-zinc-800 bg-zinc-950 p-6">
                <p className="text-zinc-300">Contact information provided when referred by ListWorx.</p>
                <Link href="/request"><Button className="mt-4 bg-lw-rust text-white hover:bg-lw-rust-hover">Need this contractor? Submit a job request →</Button></Link>
              </Card>
            )}

            {description && (
              <Card className="border-zinc-800 bg-zinc-950 p-6">
                <h2 className="mb-4 text-2xl font-bold text-white">About {businessName}</h2>
                <p className="whitespace-pre-line leading-7 text-zinc-300">{description}</p>
                {profile.google_business_url && <a href={normalizeWebsiteUrl(profile.google_business_url)} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center text-lw-rust hover:underline">View our Google reviews <ExternalLink className="ml-1 h-4 w-4" /></a>}
              </Card>
            )}

            {photos.length > 0 && (
              <Card className="border-zinc-800 bg-zinc-950 p-6">
                <h2 className="mb-5 text-2xl font-bold text-white">Our Work</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo) => (
                    <a key={photo.id} href={photo.public_url || '#'} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                      <img src={photo.public_url || ''} alt={photo.caption || `${businessName} work photo`} className="h-52 w-full object-cover transition group-hover:scale-105" />
                      {photo.caption && <p className="p-3 text-sm text-zinc-300">{photo.caption}</p>}
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {videos.length > 0 && (
              <Card className="border-zinc-800 bg-zinc-950 p-6">
                <h2 className="mb-5 text-2xl font-bold text-white">Watch Our Work</h2>
                <div className="grid gap-5 md:grid-cols-2">
                  {videos.map((video) => {
                    const embedUrl = getVideoEmbedUrl(video.video_url);
                    if (!embedUrl) return null;
                    return (
                      <div key={video.id} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                        <iframe src={embedUrl} title={video.caption || 'Contractor work video'} className="aspect-video w-full" allowFullScreen />
                        {video.caption && <p className="p-3 text-sm text-zinc-300">{video.caption}</p>}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          <aside className="space-y-8">
            {socialLinks.length > 0 && (
              <Card className="border-zinc-800 bg-zinc-950 p-6">
                <h2 className="mb-4 text-xl font-bold text-white">Find Us Online</h2>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((item) => {
                    const Icon = item.icon;
                    return <a key={item.label} href={normalizeWebsiteUrl(item.url!)} target="_blank" rel="noopener noreferrer" className="rounded-full border border-zinc-700 p-3 text-zinc-300 hover:border-lw-rust hover:text-lw-rust"><Icon className="h-5 w-5" /><span className="sr-only">{item.label}</span></a>;
                  })}
                </div>
              </Card>
            )}

            {verifiedCredentials.length > 0 && (
              <Card className="border-zinc-800 bg-zinc-950 p-6">
                <h2 className="mb-4 text-xl font-bold text-white">Verified Credentials</h2>
                <div className="space-y-3">
                  {verifiedCredentials.map((credential) => <div key={credential.id} className="flex items-center gap-2 text-sm text-zinc-300"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{getDocumentLabel(credential.document_type)}: Verified</div>)}
                </div>
                {lastCredentialDate && <p className="mt-4 text-xs text-zinc-500">Credentials verified by ListWorx as of {new Date(lastCredentialDate).toLocaleDateString('en-US')}.</p>}
              </Card>
            )}

            {isActiveIronClad(profile) && (
              <Card className="border-emerald-500/30 bg-emerald-500/10 p-6">
                <Shield className="mb-3 h-8 w-8 text-emerald-400" />
                <h2 className="mb-3 text-xl font-bold text-white">IronClad Standards</h2>
                <p className="text-sm leading-6 text-zinc-300">This contractor is a member of the ListWorx network and maintains IronClad Standards — including 24-hour response time, valid insurance, and professional conduct. IronClad certification is monitored continuously.</p>
                <Link href="/ironclad" className="mt-4 inline-flex text-sm font-semibold text-emerald-300 hover:underline">Learn more about IronClad Standards</Link>
              </Card>
            )}
          </aside>
        </section>

        <section className="mt-12 rounded-3xl border border-lw-rust/30 bg-lw-rust/10 p-8 text-center">
          <h2 className="text-3xl font-bold text-white">Referred by ListWorx? You&apos;re in good hands.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-300">ListWorx only refers vetted, IronClad-certified contractors.</p>
          <Link href="/request"><Button className="mt-6 bg-lw-rust text-white hover:bg-lw-rust-hover">Submit a job request</Button></Link>
        </section>
      </main>
    </PageShell>
  );
}
