'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PARTNER_STATUS } from '@/lib/partner-status';
import ComplianceDocuments from './ComplianceDocuments';
import type { ContractorProfile } from './types';
import {
  Loader as Loader2,
  CircleAlert as AlertCircle,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Upload,
  Download,
  CircleCheck as CheckCircle2,
  Shield,
  CreditCard,
  Settings,
} from 'lucide-react';

interface ProfileTabProps {
  profile: ContractorProfile;
  onProfileUpdated: (profile: ContractorProfile) => void;
  onUserEmailUpdated: (email: string) => void;
}

export default function ProfileTab({ profile, onProfileUpdated, onUserEmailUpdated }: ProfileTabProps) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileEdit, setProfileEdit] = useState({
    company_name: profile.company_name || '',
    owner_name: profile.owner_name || '',
    phone: profile.phone || '',
    website: profile.website || '',
    bio: profile.bio || '',
    license_number: profile.license_number || '',
    email: profile.email || '',
    google_business_url: (profile as any).google_business_url || '',
    business_description: (profile as any).business_description || '',
    years_in_business: (profile as any).years_in_business || 0,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [saveProfileError, setSaveProfileError] = useState<string | null>(null);
  const [saveProfileInfo, setSaveProfileInfo] = useState<string | null>(null);

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || !event.target.files[0]) return;

    setUploading(true);
    setUploadError(null);

    try {
      const file = event.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File must be under 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.user_id}-${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (storageError) {
        throw new Error(`Upload failed: ${storageError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('contractor_profiles')
        .update({ logo_url: publicUrl })
        .eq('user_id', profile.user_id);

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

      onProfileUpdated({ ...profile, logo_url: publicUrl });
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Logo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleEditProfile() {
    setProfileEdit({
      company_name: profile.company_name || '',
      owner_name: profile.owner_name || '',
      phone: profile.phone || '',
      website: profile.website || '',
      bio: profile.bio || '',
      license_number: profile.license_number || '',
      email: profile.email || '',
      google_business_url: (profile as any).google_business_url || '',
      business_description: (profile as any).business_description || '',
      years_in_business: (profile as any).years_in_business || 0,
    });

    setSaveProfileError(null);
    setSaveProfileInfo(null);
    setIsEditingProfile(true);
  }

  function handleCancelEdit() {
    setIsEditingProfile(false);
    setSaveProfileError(null);
    setSaveProfileInfo(null);
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setSaveProfileError(null);
    setSaveProfileInfo(null);

    try {
      const newEmail = profileEdit.email.trim().toLowerCase();
      const emailChanged = newEmail && newEmail !== profile.email?.toLowerCase();
      let updatedEmail = profile.email;

      if (emailChanged) {
        const res = await fetch('/api/update-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newEmail }),
        });

        const json = await res.json();

        if (!res.ok) {
          setSaveProfileError(
            json.error || "We couldn't update your email. Please try again or contact support."
          );
          setSavingProfile(false);
          return;
        }

        setSaveProfileInfo(json.message);
        updatedEmail = newEmail;
        onUserEmailUpdated(newEmail);
      }

      const { error } = await supabase
        .from('contractor_profiles')
        .update({
          company_name: profileEdit.company_name,
          owner_name: profileEdit.owner_name,
          phone: profileEdit.phone,
          website: profileEdit.website,
          bio: profileEdit.bio,
          license_number: profileEdit.license_number,
          google_business_url: profileEdit.google_business_url,
          business_description: profileEdit.business_description,
          years_in_business: profileEdit.years_in_business || 0,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      onProfileUpdated({
        ...profile,
        email: updatedEmail,
        company_name: profileEdit.company_name,
        owner_name: profileEdit.owner_name,
        phone: profileEdit.phone,
        website: profileEdit.website,
        bio: profileEdit.bio,
        license_number: profileEdit.license_number,
        google_business_url: profileEdit.google_business_url,
        business_description: profileEdit.business_description,
        years_in_business: profileEdit.years_in_business,
      } as ContractorProfile);

      setProfileSaved(true);
      setIsEditingProfile(false);
      setTimeout(() => {
        setProfileSaved(false);
        setSaveProfileInfo(null);
      }, 6000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setSaveProfileError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { url, error } = await response.json();

      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err: any) {
      console.error('Portal error:', err);
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Company Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Company Information</h3>
              {!isEditingProfile ? (
                <Button
                  onClick={handleEditProfile}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCancelEdit}
                    size="sm"
                    variant="ghost"
                    className="text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    disabled={savingProfile}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    size="sm"
                    disabled={savingProfile}
                    className="gap-1.5 text-white"
                    style={{ backgroundColor: '#E8621A' }}
                  >
                    {savingProfile ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            {profileSaved && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <p className="text-sm text-emerald-700">Profile saved successfully.</p>
              </div>
            )}

            {saveProfileError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{saveProfileError}</p>
              </div>
            )}

            {saveProfileInfo && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                <p className="text-sm text-blue-700">{saveProfileInfo}</p>
              </div>
            )}

            {!isEditingProfile ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'Company Name', icon: Building2, value: profile.company_name },
                    { label: 'Owner / Contact Name', icon: User, value: profile.owner_name },
                    { label: 'Phone Number', icon: Phone, value: profile.phone },
                    { label: 'License Number', icon: Shield, value: profile.license_number || '—' },
                  ].map((field) => (
                    <div key={field.label}>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        {field.label}
                      </p>
                      <div className="flex items-center gap-2">
                        <field.icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">{field.value || '—'}</p>
                      </div>
                    </div>
                  ))}

                  <div className="sm:col-span-2">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Email Address
                    </p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      <p className="text-sm text-gray-700">{profile.email}</p>
                    </div>
                  </div>
                </div>

                {profile.bio && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Bio</p>
                    <p className="text-sm referraling-relaxed text-gray-700">{profile.bio}</p>
                  </div>
                )}

                {(profile as any).business_description && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Business Description
                    </p>
                    <p className="text-sm referraling-relaxed text-gray-700">{(profile as any).business_description}</p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {profile.website && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Business Website
                      </p>
                      <a
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-lw-rust hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}

                  {(profile as any).google_business_url && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Google Business Profile
                      </p>
                      <a
                        href={(profile as any).google_business_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-sm text-lw-rust hover:underline"
                      >
                        View Profile
                      </a>
                    </div>
                  )}

                  {(profile as any).years_in_business > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                        Years in Business
                      </p>
                      <p className="text-sm font-medium text-gray-900">{(profile as any).years_in_business}</p>
                    </div>
                  )}
                </div>

                {(profile as any).profile_slug && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Public Profile
                    </p>
                    <a
                      href={`/contractor/${(profile as any).profile_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-lw-rust hover:underline"
                    >
                      View Public Profile
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { id: 'company_name', label: 'Company Name', icon: Building2, type: 'text', placeholder: 'Your company name' },
                    { id: 'owner_name', label: 'Owner / Contact Name', icon: User, type: 'text', placeholder: 'Full name' },
                    {
                      id: 'phone',
                      label: 'Phone Number',
                      icon: Phone,
                      type: 'tel',
                      placeholder: '(615) 000-0000',
                      formatFn: (v: string) => {
                        const digits = v.replace(/\D/g, '').slice(0, 10);
                        if (digits.length <= 3) return digits.length ? `(${digits}` : '';
                        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                      },
                    },
                    { id: 'license_number', label: 'License Number', icon: Shield, type: 'text', placeholder: 'Optional' },
                  ].map((field) => (
                    <div key={field.id}>
                      <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                        {field.label}
                      </Label>
                      <div className="relative">
                        <field.icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          type={field.type}
                          value={profileEdit[field.id as keyof typeof profileEdit]}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const val = (field as any).formatFn ? (field as any).formatFn(raw) : raw;
                            setProfileEdit({ ...profileEdit, [field.id]: val });
                          }}
                          placeholder={field.placeholder}
                          className="border-gray-300 bg-white pl-9 text-gray-900 placeholder:text-gray-400 focus:border-lw-rust"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="sm:col-span-2">
                    <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="email"
                        value={profileEdit.email}
                        onChange={(e) => setProfileEdit({ ...profileEdit, email: e.target.value })}
                        placeholder="your@email.com"
                        className="border-gray-300 bg-white pl-9 text-gray-900 placeholder:text-gray-400 focus:border-lw-rust"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                      Changing your email will update your login credentials.
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Short Bio
                  </Label>
                  <textarea
                    value={profileEdit.bio}
                    onChange={(e) => setProfileEdit({ ...profileEdit, bio: e.target.value })}
                    placeholder="Brief tagline or summary..."
                    rows={2}
                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-lw-rust focus:outline-none focus:ring-2 focus:ring-lw-rust/10"
                  />
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Business Description
                  </Label>
                  <textarea
                    value={profileEdit.business_description}
                    onChange={(e) => setProfileEdit({ ...profileEdit, business_description: e.target.value })}
                    placeholder="Detailed description of your business, experience, and services..."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-lw-rust focus:outline-none focus:ring-2 focus:ring-lw-rust/10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Business Website
                    </Label>
                    <Input
                      type="url"
                      value={profileEdit.website}
                      onChange={(e) => setProfileEdit({ ...profileEdit, website: e.target.value })}
                      placeholder="https://..."
                      className="border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-lw-rust"
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                      Years in Business
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={profileEdit.years_in_business || ''}
                      onChange={(e) => setProfileEdit({ ...profileEdit, years_in_business: parseInt(e.target.value) || 0 })}
                      placeholder="e.g. 10"
                      className="border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-lw-rust"
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-500">
                    Google Business Profile URL
                  </Label>
                  <Input
                    type="url"
                    value={profileEdit.google_business_url}
                    onChange={(e) => setProfileEdit({ ...profileEdit, google_business_url: e.target.value })}
                    placeholder="https://g.page/..."
                    className="border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-lw-rust"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Service Areas */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-gray-900">Service Areas</h3>
            {(profile as any)._liveCounties && (profile as any)._liveCounties.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(profile as any)._liveCounties.map((county: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    <MapPin className="h-3 w-3 text-gray-400" />
                    {county.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No service areas added yet. Complete your application to add counties.
              </p>
            )}
          </div>

          {/* Trade Specialties */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-gray-900">Trade Specialties</h3>
            {(profile as any)._liveTrades && (profile as any)._liveTrades.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(profile as any)._liveTrades.map((trade: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full border border-lw-rust/20 bg-lw-rust/5 px-3 py-1 text-xs font-medium text-lw-rust"
                  >
                    <Briefcase className="h-3 w-3" />
                    {trade.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No trades selected yet. Complete your application to add specialties.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Company Logo */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-gray-900">Company Logo</h3>
            <div className="flex flex-col items-center gap-4">
              {profile.logo_url ? (
                <img
                  src={profile.logo_url}
                  alt="Company Logo"
                  className="h-24 w-24 rounded-lg border border-gray-200 bg-gray-50 p-2 object-contain"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                  <Building2 className="h-10 w-10 text-gray-300" />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleLogoUpload}
                disabled={uploading}
              />

              <div className="flex w-full gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      {profile.logo_url ? 'Replace Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>

                {profile.logo_url && (
                  <a
                    href={profile.logo_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'flex-1 border-gray-300 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Logo
                  </a>
                )}
              </div>

              <p className="text-center text-xs text-gray-400">PNG, JPG, WebP — max 5MB</p>

              {uploadError && (
                <div className="flex w-full items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <p className="text-xs text-red-700">{uploadError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-gray-900">Account Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Partner Status</span>
                <span className="font-medium capitalize text-gray-900">{profile.partner_status}</span>
              </div>

              {profile.tier && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium capitalize text-lw-rust">{profile.tier}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {profile.partner_status === PARTNER_STATUS.ACTIVE && (
                <div className="border-t border-gray-100 pt-3">
                  <Button
                    onClick={handleManageSubscription}
                    variant="outline"
                    size="sm"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    Manage Billing
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ComplianceDocuments
        contractorId={profile.id}
        userId={profile.user_id}
        licenseExpirationDate={profile.license_expiration_date}
        insuranceExpirationDate={profile.insurance_expiration_date}
      />
    </div>
  );
}
