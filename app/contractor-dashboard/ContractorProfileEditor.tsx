'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import ComplianceDocuments from './ComplianceDocuments';
import { ContractorProfile, County } from './types';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Facebook,
  FileCheck,
  Globe,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Shield,
  Trash2,
  Upload,
  User,
  Video,
  Youtube,
} from 'lucide-react';

type LiveCounty = { id: string; name: string; state_code: string };
type LiveTrade = { id: string; name: string };

type WorkPhoto = {
  id: string;
  contractor_id: string;
  storage_path: string;
  public_url: string | null;
  caption: string | null;
  display_order: number | null;
  created_at: string | null;
};

type WorkVideo = {
  id: string;
  contractor_id: string;
  video_url: string;
  platform: string | null;
  caption: string | null;
  display_order: number | null;
  created_at: string | null;
};

type ContractorProfileEditorProps = {
  profile: ContractorProfile & {
    tagline?: string | null;
    business_description?: string | null;
    business_website?: string | null;
    google_business_url?: string | null;
    years_in_business?: number | null;
    profile_photo_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    tiktok_url?: string | null;
    linkedin_url?: string | null;
    youtube_url?: string | null;
    show_phone_public?: boolean | null;
    show_email_public?: boolean | null;
    profile_slug?: string | null;
    founder_status?: boolean | null;
    founding_partner?: boolean | null;
    ironclad_certified?: boolean | null;
    _liveCounties?: LiveCounty[];
    _liveTrades?: LiveTrade[];
  };
  onProfileUpdated: (profile: any) => void;
  onRefresh: () => Promise<void> | void;
  logoInputRef: React.RefObject<HTMLInputElement>;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  logoUploading: boolean;
  logoUploadError: string | null;
};

const PHOTO_BUCKET = 'contractor-work-photos';
const LOGO_BUCKET = 'logos';
const MAX_WORK_PHOTOS = 20;
const MAX_UPLOAD_BATCH = 5;
const MAX_WORK_PHOTO_SIZE = 10 * 1024 * 1024;

const socialFields = [
  { key: 'facebook_url', label: 'Facebook', host: 'facebook.com', icon: Facebook, placeholder: 'https://facebook.com/your-business' },
  { key: 'instagram_url', label: 'Instagram', host: 'instagram.com', icon: Instagram, placeholder: 'https://instagram.com/your-business' },
  { key: 'tiktok_url', label: 'TikTok', host: 'tiktok.com', icon: Video, placeholder: 'https://tiktok.com/@your-business' },
  { key: 'linkedin_url', label: 'LinkedIn', host: 'linkedin.com', icon: Linkedin, placeholder: 'https://linkedin.com/company/your-business' },
  { key: 'youtube_url', label: 'YouTube Channel', host: 'youtube.com', icon: Youtube, placeholder: 'https://youtube.com/@your-business' },
  { key: 'google_business_url', label: 'Google Business Profile — highly recommended', host: 'google.com', icon: Globe, placeholder: 'https://g.page/r/your-profile' },
] as const;

function normalizeWebsiteUrl(url: string) {
  if (!url) return '';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
}

function isExpired(date?: string | null) {
  if (!date) return false;
  return new Date(date) < new Date();
}

function isInsuranceValid(profile: ContractorProfile) {
  return Boolean(profile.insurance_expiration_date && !isExpired(profile.insurance_expiration_date));
}

function getProfileUrl(profile: ContractorProfile & { profile_slug?: string | null }) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://listworx.co';
  return `${base}/contractors/${profile.profile_slug || profile.id}`;
}

function detectVideoPlatform(url: string) {
  const value = url.toLowerCase();
  if (value.includes('youtube.com') || value.includes('youtu.be')) return 'youtube';
  if (value.includes('vimeo.com')) return 'vimeo';
  return '';
}

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.replace('/', '');
    if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
    const shorts = parsed.pathname.match(/\/shorts\/([^/?]+)/);
    if (shorts) return shorts[1];
    const embed = parsed.pathname.match(/\/embed\/([^/?]+)/);
    if (embed) return embed[1];
  } catch (_e) {}
  return null;
}

function getEmbedUrl(url: string) {
  const platform = detectVideoPlatform(url);
  if (platform === 'youtube') {
    const id = getYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : '';
  }
  if (platform === 'vimeo') {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : '';
  }
  return '';
}

function validateSocialUrl(url: string, host: string) {
  if (!url.trim()) return true;
  try {
    const parsed = new URL(normalizeWebsiteUrl(url.trim()));
    if (host === 'google.com') {
      return parsed.hostname.includes('google.') || parsed.hostname.includes('g.page');
    }
    return parsed.hostname.replace(/^www\./, '').includes(host);
  } catch (_e) {
    return false;
  }
}

export default function ContractorProfileEditor({
  profile,
  onProfileUpdated,
  onRefresh,
  logoInputRef,
  onLogoUpload,
  logoUploading,
  logoUploadError,
}: ContractorProfileEditorProps) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const workPhotoInputRef = useRef<HTMLInputElement>(null);

  const [counties, setCounties] = useState([] as County[]);
  const [documents, setDocuments] = useState([] as any[]);
  const [workPhotos, setWorkPhotos] = useState([] as WorkPhoto[]);
  const [workVideos, setWorkVideos] = useState([] as WorkVideo[]);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [profilePhotoUploading, setProfilePhotoUploading] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState<Record<string, number>>({});
  const [lightboxPhoto, setLightboxPhoto] = useState<WorkPhoto | null>(null);

  const [businessForm, setBusinessForm] = useState({
    company_name: profile.company_name || '',
    tagline: profile.tagline || '',
    business_description: profile.business_description || profile.bio || '',
    years_in_business: profile.years_in_business ? String(profile.years_in_business) : '',
    website: profile.website || profile.business_website || '',
    selectedCounties: (profile._liveCounties || []).map((county) => county.id),
  });

  const [visibilityForm, setVisibilityForm] = useState({
    show_phone_public: Boolean(profile.show_phone_public),
    show_email_public: Boolean(profile.show_email_public),
  });

  const [socialForm, setSocialForm] = useState(() => {
    const initial: Record<string, string> = {};
    socialFields.forEach((field) => {
      initial[field.key] = String((profile as any)[field.key] || '');
    });
    return initial;
  });

  const [socialTouched, setSocialTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setBusinessForm({
      company_name: profile.company_name || '',
      tagline: profile.tagline || '',
      business_description: profile.business_description || profile.bio || '',
      years_in_business: profile.years_in_business ? String(profile.years_in_business) : '',
      website: profile.website || profile.business_website || '',
      selectedCounties: (profile._liveCounties || []).map((county) => county.id),
    });
    setVisibilityForm({
      show_phone_public: Boolean(profile.show_phone_public),
      show_email_public: Boolean(profile.show_email_public),
    });
    setSocialForm(() => {
      const next: Record<string, string> = {};
      socialFields.forEach((field) => {
        next[field.key] = String((profile as any)[field.key] || '');
      });
      return next;
    });
  }, [profile.id]);

  useEffect(() => {
    void loadEditorData();
  }, [profile.id]);

  async function loadEditorData() {
    const [countiesRes, docsRes, photosRes, videosRes] = await Promise.all([
      supabase.from('counties').select('id, name, state_code').eq('is_active', true).order('state_code').order('name'),
      supabase.from('contractor_documents').select('*').eq('contractor_id', profile.id).order('document_type'),
      supabase.from('contractor_work_photos').select('*').eq('contractor_id', profile.id).order('display_order').order('created_at'),
      supabase.from('contractor_work_videos').select('*').eq('contractor_id', profile.id).order('display_order').order('created_at'),
    ]);

    if (!countiesRes.error) setCounties((countiesRes.data || []) as County[]);
    if (!docsRes.error) setDocuments(docsRes.data || []);
    if (!photosRes.error) setWorkPhotos((photosRes.data || []) as WorkPhoto[]);
    if (!videosRes.error) setWorkVideos((videosRes.data || []) as WorkVideo[]);
  }

  const tradeNames = (profile._liveTrades || []).map((trade) => trade.name);
  const profileUrl = getProfileUrl(profile);
  const hasSocial = socialFields.some((field) => Boolean(socialForm[field.key]?.trim()));
  const hasLicenseDocument = documents.some((doc: any) => String(doc.document_type).toLowerCase().includes('license')) || Boolean(profile.license_number);
  const hasValidInsurance = isInsuranceValid(profile) || documents.some((doc: any) => String(doc.document_type).toLowerCase().includes('insurance') && !isExpired(doc.expiration_date));

  const completionItems = useMemo(() => [
    { id: 'business-identity', label: 'Business name', complete: Boolean(profile.company_name), weight: 10 },
    { id: 'business-identity', label: 'Tagline', complete: Boolean(profile.tagline), weight: 5 },
    { id: 'business-identity', label: 'Description', complete: Boolean(profile.business_description || profile.bio), weight: 10 },
    { id: 'work-photos', label: 'At least 3 work photos', complete: workPhotos.length >= 3, weight: 15 },
    { id: 'logo-photo', label: 'Logo uploaded', complete: Boolean(profile.logo_url), weight: 10 },
    { id: 'logo-photo', label: 'Profile photo uploaded', complete: Boolean(profile.profile_photo_url), weight: 10 },
    { id: 'credentials', label: 'Insurance on file and valid', complete: hasValidInsurance, weight: 20 },
    { id: 'credentials', label: 'License on file', complete: hasLicenseDocument, weight: 10 },
    { id: 'social-links', label: 'At least 1 social URL', complete: hasSocial, weight: 5 },
    { id: 'social-links', label: 'Google Business Profile URL', complete: Boolean(socialForm.google_business_url?.trim()), weight: 5 },
  ], [profile, workPhotos.length, hasValidInsurance, hasLicenseDocument, hasSocial, socialForm.google_business_url]);

  const completion = completionItems.reduce((sum, item) => sum + (item.complete ? item.weight : 0), 0);
  const incompleteItems = completionItems.filter((item) => !item.complete);

  function showSaved(section: string) {
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 3500);
  }

  async function saveBusinessIdentity() {
    setSavingSection('business');
    setSectionError(null);

    try {
      const website = normalizeWebsiteUrl(businessForm.website.trim());
      const updates = {
        company_name: businessForm.company_name.trim(),
        tagline: businessForm.tagline.trim() || null,
        business_description: businessForm.business_description.trim() || null,
        bio: businessForm.business_description.trim() || null,
        years_in_business: Number(businessForm.years_in_business) || 0,
        website: website || null,
        business_website: website || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('contractor_profiles').update(updates).eq('id', profile.id);
      if (error) throw error;

      const existingCountyIds = (profile._liveCounties || []).map((county) => county.id);
      const nextCountyIds = businessForm.selectedCounties;
      const toAdd = nextCountyIds.filter((id) => !existingCountyIds.includes(id));
      const toRemove = existingCountyIds.filter((id) => !nextCountyIds.includes(id));

      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('contractor_counties')
          .delete()
          .eq('contractor_id', profile.id)
          .in('county_id', toRemove);
        if (removeError) throw removeError;
      }

      if (toAdd.length > 0) {
        const { error: addError } = await supabase.from('contractor_counties').insert(
          toAdd.map((countyId) => ({ contractor_id: profile.id, county_id: countyId }))
        );
        if (addError) throw addError;
      }

      const nextCounties = counties.filter((county) => nextCountyIds.includes(county.id));
      onProfileUpdated({ ...profile, ...updates, _liveCounties: nextCounties });
      await onRefresh();
      showSaved('business');
    } catch (err: any) {
      setSectionError(err.message || 'Could not save business identity.');
    } finally {
      setSavingSection(null);
    }
  }

  async function uploadProfilePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setSectionError('Profile photo must be JPG, PNG, or WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSectionError('Profile photo must be under 5MB.');
      event.target.value = '';
      return;
    }

    setProfilePhotoUploading(true);
    setSectionError(null);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `profile-photos/${profile.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
      const publicUrl = data.publicUrl;
      const { error: updateError } = await supabase.from('contractor_profiles').update({ profile_photo_url: publicUrl }).eq('id', profile.id);
      if (updateError) throw updateError;

      onProfileUpdated({ ...profile, profile_photo_url: publicUrl });
      showSaved('logo-photo');
    } catch (err: any) {
      setSectionError(err.message || 'Profile photo upload failed.');
    } finally {
      setProfilePhotoUploading(false);
      event.target.value = '';
    }
  }

  async function uploadWorkPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remaining = MAX_WORK_PHOTOS - workPhotos.length;
    const selected = files.slice(0, Math.min(MAX_UPLOAD_BATCH, remaining));

    if (files.length > MAX_UPLOAD_BATCH) {
      setSectionError('Upload up to 5 work photos at a time.');
    } else if (remaining <= 0) {
      setSectionError('You can upload up to 20 work photos total.');
      event.target.value = '';
      return;
    } else {
      setSectionError(null);
    }

    const uploaded: WorkPhoto[] = [];

    for (const file of selected) {
      const progressKey = `${file.name}-${file.lastModified}`;
      try {
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error(`${file.name} must be JPG, PNG, or WebP.`);
        }
        if (file.size > MAX_WORK_PHOTO_SIZE) {
          throw new Error(`${file.name} must be under 10MB.`);
        }

        setPhotoUploadProgress((prev) => ({ ...prev, [progressKey]: 25 }));
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const storagePath = `work-photos/${profile.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(storagePath, file, { contentType: file.type });
        if (uploadError) throw uploadError;

        setPhotoUploadProgress((prev) => ({ ...prev, [progressKey]: 75 }));
        const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);
        const { data: inserted, error: insertError } = await supabase
          .from('contractor_work_photos')
          .insert({
            contractor_id: profile.id,
            storage_path: storagePath,
            public_url: data.publicUrl,
            caption: '',
            display_order: workPhotos.length + uploaded.length,
          })
          .select('*')
          .single();
        if (insertError) throw insertError;

        uploaded.push(inserted as WorkPhoto);
        setPhotoUploadProgress((prev) => ({ ...prev, [progressKey]: 100 }));
      } catch (err: any) {
        setSectionError(err.message || 'A work photo failed to upload.');
      }
    }

    if (uploaded.length > 0) {
      setWorkPhotos((prev) => [...prev, ...uploaded]);
      showSaved('work-photos');
    }

    setTimeout(() => setPhotoUploadProgress({}), 2000);
    event.target.value = '';
  }

  async function updatePhotoCaption(photoId: string, caption: string) {
    const normalized = caption.slice(0, 100);
    setWorkPhotos((prev) => prev.map((photo) => photo.id === photoId ? { ...photo, caption: normalized } : photo));
    const { error } = await supabase.from('contractor_work_photos').update({ caption: normalized }).eq('id', photoId);
    if (error) setSectionError(error.message);
  }

  async function deleteWorkPhoto(photo: WorkPhoto) {
    if (!confirm('Remove this photo?')) return;
    setSectionError(null);
    const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
    if (storageError) console.error('[profile-editor] work photo storage delete failed', storageError);
    const { error } = await supabase.from('contractor_work_photos').delete().eq('id', photo.id);
    if (error) {
      setSectionError(error.message);
      return;
    }
    setWorkPhotos((prev) => prev.filter((item) => item.id !== photo.id));
  }

  async function saveVideos(nextVideos = workVideos) {
    setSavingSection('videos');
    setSectionError(null);
    try {
      for (const [index, video] of nextVideos.entries()) {
        if (!video.video_url.trim()) continue;
        const platform = detectVideoPlatform(video.video_url);
        if (!platform) throw new Error('Only YouTube and Vimeo links are supported.');

        if (video.id.startsWith('new-')) {
          const { data, error } = await supabase
            .from('contractor_work_videos')
            .insert({
              contractor_id: profile.id,
              video_url: video.video_url.trim(),
              platform,
              caption: video.caption?.slice(0, 100) || '',
              display_order: index,
            })
            .select('*')
            .single();
          if (error) throw error;
          nextVideos[index] = data as WorkVideo;
        } else {
          const { error } = await supabase
            .from('contractor_work_videos')
            .update({
              video_url: video.video_url.trim(),
              platform,
              caption: video.caption?.slice(0, 100) || '',
              display_order: index,
            })
            .eq('id', video.id);
          if (error) throw error;
        }
      }
      setWorkVideos([...nextVideos].filter((video) => video.video_url.trim()));
      showSaved('videos');
    } catch (err: any) {
      setSectionError(err.message || 'Could not save videos.');
    } finally {
      setSavingSection(null);
    }
  }

  async function removeVideo(video: WorkVideo) {
    if (video.id.startsWith('new-')) {
      setWorkVideos((prev) => prev.filter((item) => item.id !== video.id));
      return;
    }
    const { error } = await supabase.from('contractor_work_videos').delete().eq('id', video.id);
    if (error) {
      setSectionError(error.message);
      return;
    }
    setWorkVideos((prev) => prev.filter((item) => item.id !== video.id));
  }

  async function saveSocialLinks() {
    setSavingSection('social');
    setSectionError(null);
    try {
      for (const field of socialFields) {
        if (!validateSocialUrl(socialForm[field.key] || '', field.host)) {
          throw new Error(`${field.label} must use a valid ${field.host} URL.`);
        }
      }
      const updates: Record<string, string | null> = {};
      socialFields.forEach((field) => {
        updates[field.key] = socialForm[field.key]?.trim() ? normalizeWebsiteUrl(socialForm[field.key].trim()) : null;
      });
      const { error } = await supabase.from('contractor_profiles').update(updates).eq('id', profile.id);
      if (error) throw error;
      onProfileUpdated({ ...profile, ...updates });
      showSaved('social');
    } catch (err: any) {
      setSectionError(err.message || 'Could not save social links.');
    } finally {
      setSavingSection(null);
    }
  }

  async function saveContactVisibility() {
    setSavingSection('visibility');
    setSectionError(null);
    try {
      const { error } = await supabase.from('contractor_profiles').update(visibilityForm).eq('id', profile.id);
      if (error) throw error;
      onProfileUpdated({ ...profile, ...visibilityForm });
      showSaved('visibility');
    } catch (err: any) {
      setSectionError(err.message || 'Could not save contact visibility.');
    } finally {
      setSavingSection(null);
    }
  }

  async function copyProfileLink() {
    await navigator.clipboard.writeText(profileUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  }

  function toggleCounty(countyId: string) {
    setBusinessForm((prev) => ({
      ...prev,
      selectedCounties: prev.selectedCounties.includes(countyId)
        ? prev.selectedCounties.filter((id) => id !== countyId)
        : [...prev.selectedCounties, countyId],
    }));
  }

  const selectedCountyNames = counties.filter((county) => businessForm.selectedCounties.includes(county.id));

  return (
    <div className="space-y-8">
      <Card className="border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lw-rust">Profile completion</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{completion}% complete</h2>
            <p className="mt-1 text-sm text-gray-500">Complete profiles build trust before requestors reach out.</p>
          </div>
          <div className="min-w-0 flex-1 lg:max-w-md">
            <ProgressBar value={completion} />
            {incompleteItems.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {incompleteItems.map((item) => (
                  <a key={`${item.label}-${item.weight}`} href={`#${item.id}`} className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 hover:bg-amber-100">
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {sectionError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {sectionError}
        </div>
      )}

      <Card id="business-identity" className="border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Business Identity</h3>
            <p className="mt-1 text-sm text-gray-500">This is the foundation of your public ListWorx profile.</p>
          </div>
          <Button onClick={saveBusinessIdentity} disabled={savingSection === 'business'} className="bg-lw-rust text-white hover:bg-lw-rust-hover">
            {savingSection === 'business' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Business Identity
          </Button>
        </div>
        {savedSection === 'business' && <SavedNotice />}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label>Business name</Label>
            <Input value={businessForm.company_name} onChange={(event) => setBusinessForm({ ...businessForm, company_name: event.target.value })} />
          </div>
          <div>
            <Label>Trade</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {tradeNames.length > 0 ? tradeNames.map((trade) => <Badge key={trade} className="bg-lw-rust/10 text-lw-rust">{trade}</Badge>) : <span className="text-sm text-gray-500">No trade selected</span>}
            </div>
            <p className="mt-2 text-xs text-gray-500">To change your trade contact support.</p>
          </div>
          <div className="md:col-span-2">
            <Label>Tagline</Label>
            <Input
              maxLength={100}
              value={businessForm.tagline}
              onChange={(event) => setBusinessForm({ ...businessForm, tagline: event.target.value.slice(0, 100) })}
              placeholder="Brief headline for your business — e.g. 'Nashville's most trusted painter since 2005'"
            />
            <p className="mt-1 text-xs text-gray-400">{businessForm.tagline.length}/100</p>
          </div>
          <div className="md:col-span-2">
            <Label>Business description</Label>
            <Textarea
              rows={6}
              maxLength={500}
              value={businessForm.business_description}
              onChange={(event) => setBusinessForm({ ...businessForm, business_description: event.target.value.slice(0, 500) })}
              placeholder="Tell realtors and homeowners what sets your work apart. Be specific. What do you specialize in? What makes your customers come back?"
            />
            <p className="mt-1 text-xs text-gray-400">{businessForm.business_description.length}/500</p>
          </div>
          <div>
            <Label>Years in business</Label>
            <Input type="number" min="0" value={businessForm.years_in_business} onChange={(event) => setBusinessForm({ ...businessForm, years_in_business: event.target.value })} />
          </div>
          <div>
            <Label>Website URL</Label>
            <Input value={businessForm.website} onChange={(event) => setBusinessForm({ ...businessForm, website: event.target.value })} placeholder="https://yourbusiness.com" />
          </div>
          <div className="md:col-span-2">
            <Label>Service counties</Label>
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 p-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {counties.map((county) => (
                  <label key={county.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
                    <input type="checkbox" checked={businessForm.selectedCounties.includes(county.id)} onChange={() => toggleCounty(county.id)} />
                    <span>{county.name}, {county.state_code}</span>
                  </label>
                ))}
              </div>
            </div>
            {selectedCountyNames.length > 0 && <p className="mt-2 text-xs text-gray-500">Selected: {selectedCountyNames.map((county) => `${county.name}, ${county.state_code}`).join(' • ')}</p>}
          </div>
        </div>
      </Card>

      <Card id="logo-photo" className="border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">Logo & Profile Photo</h3>
          <p className="mt-1 text-sm text-gray-500">Your logo builds recognition. A real photo builds trust.</p>
        </div>
        {savedSection === 'logo-photo' && <SavedNotice />}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-5">
            <h4 className="mb-4 font-semibold text-gray-900">Company Logo</h4>
            <div className="flex items-center gap-4">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Company logo" className="h-24 w-24 rounded-xl border border-gray-200 bg-gray-50 object-contain p-2" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-gray-200 bg-gray-50"><Building2 className="h-10 w-10 text-gray-300" /></div>
              )}
              <div className="flex-1">
                <input ref={logoInputRef} type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={onLogoUpload} disabled={logoUploading} />
                <Button onClick={() => logoInputRef.current?.click()} disabled={logoUploading} variant="outline">
                  {logoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Change Logo
                </Button>
                <p className="mt-2 text-xs text-gray-500">JPG, PNG, or SVG — square format recommended, minimum 200x200px</p>
                {logoUploadError && <p className="mt-2 text-xs text-red-600">{logoUploadError}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-5">
            <h4 className="mb-4 font-semibold text-gray-900">Profile / Headshot Photo</h4>
            <div className="flex items-center gap-4">
              {profile.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="Profile photo" className="h-24 w-24 rounded-xl border border-gray-200 bg-gray-50 object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-gray-200 bg-gray-50"><User className="h-10 w-10 text-gray-300" /></div>
              )}
              <div className="flex-1">
                <input ref={profilePhotoInputRef} type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={uploadProfilePhoto} disabled={profilePhotoUploading} />
                <Button onClick={() => profilePhotoInputRef.current?.click()} disabled={profilePhotoUploading} variant="outline">
                  {profilePhotoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                  Upload Photo
                </Button>
                <p className="mt-2 text-xs text-gray-500">A real photo of you or your team builds trust with requestors.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card id="work-photos" className="border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Work Photos</h3>
            <p className="mt-1 text-sm text-gray-500">Show requestors what you are capable of before they reach out.</p>
          </div>
          <div>
            <input ref={workPhotoInputRef} type="file" className="hidden" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={uploadWorkPhotos} />
            <Button onClick={() => workPhotoInputRef.current?.click()} disabled={workPhotos.length >= MAX_WORK_PHOTOS} className="bg-lw-rust text-white hover:bg-lw-rust-hover">
              <Plus className="mr-2 h-4 w-4" /> Add Work Photos
            </Button>
            <p className="mt-2 text-xs text-gray-500">Up to 20 total. Upload 5 at a time. JPG, PNG, WEBP. Max 10MB each.</p>
          </div>
        </div>
        {savedSection === 'work-photos' && <SavedNotice />}
        {Object.keys(photoUploadProgress).length > 0 && (
          <div className="mb-4 space-y-2">
            {Object.entries(photoUploadProgress).map(([key, value]) => <div key={key}><p className="mb-1 text-xs text-gray-500">{key}</p><ProgressBar value={value} /></div>)}
          </div>
        )}
        {workPhotos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            <ImageIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            Add photos of your completed work. Requestors want to see what you&apos;re capable of before they reach out.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workPhotos.map((photo) => (
              <div key={photo.id} className="rounded-xl border border-gray-200 p-3">
                <button type="button" onClick={() => setLightboxPhoto(photo)} className="block w-full overflow-hidden rounded-lg bg-gray-100">
                  <img src={photo.public_url || ''} alt={photo.caption || 'Work photo'} className="h-44 w-full object-cover transition hover:scale-105" />
                </button>
                <Input className="mt-3" maxLength={100} value={photo.caption || ''} onChange={(event) => updatePhotoCaption(photo.id, event.target.value)} placeholder="Caption (100 char max)" />
                <Button onClick={() => deleteWorkPhoto(photo)} variant="outline" size="sm" className="mt-3 w-full border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card id="work-videos" className="border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Work Videos</h3>
            <p className="mt-1 text-sm text-gray-500">Upload your videos to YouTube or Vimeo first, then paste the link here. Videos appear on your public profile.</p>
          </div>
          <Button
            variant="outline"
            disabled={workVideos.length >= 5}
            onClick={() => setWorkVideos((prev) => [...prev, { id: `new-${Date.now()}`, contractor_id: profile.id, video_url: '', platform: null, caption: '', display_order: prev.length, created_at: null }])}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Video Link
          </Button>
        </div>
        {savedSection === 'videos' && <SavedNotice />}
        <div className="space-y-4">
          {workVideos.map((video, index) => {
            const embedUrl = getEmbedUrl(video.video_url || '');
            return (
              <div key={video.id} className="grid gap-4 rounded-xl border border-gray-200 p-4 md:grid-cols-[220px,1fr]">
                <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                  {embedUrl ? <iframe src={embedUrl} title={`Video ${index + 1}`} className="h-full w-full" allowFullScreen /> : <Video className="h-8 w-8 text-gray-300" />}
                </div>
                <div className="space-y-3">
                  <Input value={video.video_url} onChange={(event) => setWorkVideos((prev) => prev.map((item) => item.id === video.id ? { ...item, video_url: event.target.value, platform: detectVideoPlatform(event.target.value) } : item))} placeholder="YouTube or Vimeo URL" />
                  <Input maxLength={100} value={video.caption || ''} onChange={(event) => setWorkVideos((prev) => prev.map((item) => item.id === video.id ? { ...item, caption: event.target.value.slice(0, 100) } : item))} placeholder="Caption (100 char max)" />
                  <Button variant="outline" size="sm" onClick={() => removeVideo(video)} className="border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="mr-2 h-4 w-4" /> Remove</Button>
                </div>
              </div>
            );
          })}
          {workVideos.length === 0 && <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">No videos added yet.</p>}
        </div>
        <Button onClick={() => saveVideos()} disabled={savingSection === 'videos'} className="mt-5 bg-lw-rust text-white hover:bg-lw-rust-hover">
          {savingSection === 'videos' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Work Videos
        </Button>
      </Card>

      <Card id="social-links" className="border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Social Media Links</h3>
            <p className="mt-1 text-sm text-gray-500">Only links you provide will appear on your public profile.</p>
          </div>
          <Button onClick={saveSocialLinks} disabled={savingSection === 'social'} className="bg-lw-rust text-white hover:bg-lw-rust-hover">
            {savingSection === 'social' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Social Links
          </Button>
        </div>
        {savedSection === 'social' && <SavedNotice />}
        <div className="grid gap-4 md:grid-cols-2">
          {socialFields.map((field) => {
            const Icon = field.icon;
            const valid = validateSocialUrl(socialForm[field.key] || '', field.host);
            return (
              <div key={field.key}>
                <Label>{field.label}</Label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    className="pl-9 pr-9"
                    value={socialForm[field.key] || ''}
                    onChange={(event) => setSocialForm({ ...socialForm, [field.key]: event.target.value })}
                    onBlur={() => setSocialTouched({ ...socialTouched, [field.key]: true })}
                    placeholder={field.placeholder}
                  />
                  {socialForm[field.key]?.trim() && valid && <Check className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />}
                </div>
                {socialTouched[field.key] && !valid && <p className="mt-1 text-xs text-red-600">Enter a valid {field.host} URL.</p>}
              </div>
            );
          })}
        </div>
      </Card>

      <Card id="contact-visibility" className="border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Public Contact Display</h3>
            <p className="mt-1 text-sm text-gray-500">Contact details stay hidden unless you opt in.</p>
          </div>
          <Button onClick={saveContactVisibility} disabled={savingSection === 'visibility'} className="bg-lw-rust text-white hover:bg-lw-rust-hover">
            {savingSection === 'visibility' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Contact Settings
          </Button>
        </div>
        {savedSection === 'visibility' && <SavedNotice />}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div><p className="font-medium text-gray-900">Show phone on public profile</p><p className="text-sm text-gray-500">Referral cards still include contact info.</p></div>
            <Switch checked={visibilityForm.show_phone_public} onCheckedChange={(checked) => setVisibilityForm({ ...visibilityForm, show_phone_public: checked })} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div><p className="font-medium text-gray-900">Show email on public profile</p><p className="text-sm text-gray-500">Referral cards still include contact info.</p></div>
            <Switch checked={visibilityForm.show_email_public} onCheckedChange={(checked) => setVisibilityForm({ ...visibilityForm, show_email_public: checked })} />
          </div>
        </div>
      </Card>

      <div id="credentials">
        <ComplianceDocuments contractorId={profile.id} userId={profile.user_id} licenseExpirationDate={profile.license_expiration_date} insuranceExpirationDate={profile.insurance_expiration_date} />
      </div>

      <Card className="border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900">Profile Preview</h3>
        <p className="mt-2 break-all rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{profileUrl}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href={`/contractors/${profile.profile_slug || profile.id}`} target="_blank">
            <Button variant="outline"><ExternalLink className="mr-2 h-4 w-4" /> Preview Public Profile</Button>
          </Link>
          <Button onClick={copyProfileLink} className="bg-lw-rust text-white hover:bg-lw-rust-hover"><Copy className="mr-2 h-4 w-4" /> {copySuccess ? 'Copied!' : 'Copy Profile Link'}</Button>
        </div>
      </Card>

      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightboxPhoto(null)}>
          <div className="max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img src={lightboxPhoto.public_url || ''} alt={lightboxPhoto.caption || 'Work photo'} className="max-h-[80vh] rounded-xl object-contain" />
            {lightboxPhoto.caption && <p className="mt-3 text-center text-white">{lightboxPhoto.caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function SavedNotice() {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      <CheckCircle2 className="h-4 w-4" /> Saved ✓
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full bg-lw-rust transition-all" style={{ width: `${bounded}%` }} />
    </div>
  );
}
