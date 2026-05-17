'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase-browser';
import { PARTNER_STATUS } from '@/lib/partner-status';
import { ApplicationFormState, County } from './types';
import {
  Building2,
  MapPin,
  Briefcase,
  FileText,
  Shield,
  Star,
  CircleAlert as AlertCircle,
  CircleCheck as CheckCircle2,
  Loader as Loader2,
  ChevronDown,
  Info,
  ExternalLink,
  Search,
  ChevronRight,
  Upload,
  X,
} from 'lucide-react';

interface Trade {
  id: string;
  name: string;
}

interface ApplicationFormProps {
  userId: string;
  userEmail: string;
  existingProfile?: any;
  onSuccess: () => void;
}

function getSavedCountyIds(existingProfile: any): string[] {
  if (!existingProfile) return [];
  const live = existingProfile._liveCounties;
  if (Array.isArray(live) && live.length > 0) {
    return live.map((c: any) => c.id).filter(Boolean);
  }
  return [];
}

function getSavedTradeIds(existingProfile: any): string[] {
  if (!existingProfile) return [];
  const live = existingProfile._liveTrades;
  if (Array.isArray(live) && live.length > 0) {
    return live.map((t: any) => t.id).filter(Boolean);
  }
  return [];
}

const STEPS = [
  { id: 1, label: 'Business Info' },
  { id: 2, label: 'Compliance' },
  { id: 3, label: 'Service Area' },
  { id: 4, label: 'Trades' },
  { id: 5, label: 'Reviews' },
  { id: 6, label: 'Agreements' },
];

const inputClass =
  'border bg-white text-gray-900 border-gray-300 placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500 h-10';
const textareaClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none min-h-[80px]';

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2.5 rounded-lg bg-lw-surface border border-lw-border-light">
        <Icon className="h-5 w-5 text-lw-rust" />
      </div>
      <div>
        <h3 className="font-bold text-lw-text text-base">{title}</h3>
        {description && <p className="text-lw-text/50 text-sm mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        <Label className="text-gray-700 text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        {hint && (
          <div className="group relative">
            <Info className="h-3.5 w-3.5 text-lw-text/30 cursor-help" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-52 bg-white text-xs text-lw-text/70 rounded-lg p-2.5 border border-lw-border-light shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
              {hint}
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active
                    ? 'bg-lw-rust border-lw-rust text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                  active ? 'text-lw-rust' : done ? 'text-emerald-600' : 'text-lw-text/30'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-px w-8 sm:w-12 mx-1 flex-shrink-0 mb-4 transition-all ${
                  current > step.id ? 'bg-emerald-500' : 'bg-lw-border-light'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ApplicationForm({
  userId,
  userEmail,
  existingProfile,
  onSuccess,
}: ApplicationFormProps) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ApplicationFormState>({
    first_name: existingProfile?.owner_name?.split(' ')?.[0] || '',
    last_name: existingProfile?.owner_name?.split(' ')?.slice(1).join(' ') || '',
    company_name: existingProfile?.company_name || '',
    owner_name: existingProfile?.owner_name || '',
    phone: existingProfile?.phone || '',
    years_in_business: existingProfile?.years_in_business ? String(existingProfile.years_in_business) : '',
    primary_county: existingProfile?.service_area_counties?.[0] || '',
    website: existingProfile?.website || '',
    bio: existingProfile?.bio || '',
    license_number: existingProfile?.license_number || '',
    license_expiration_date: existingProfile?.license_expiration_date || '',
    insurance_expiration_date: existingProfile?.insurance_expiration_date || '',
    license_document_url: existingProfile?.license_document_url || '',
    insurance_document_url: existingProfile?.insurance_document_url || '',
    google_review_url: existingProfile?.google_review_url || '',
    yelp_url: existingProfile?.yelp_url || '',
    bbb_url: existingProfile?.bbb_url || '',
    facebook_url: existingProfile?.facebook_url || '',
    instagram_url: existingProfile?.instagram_url || '',
    selectedCounties: [],
    selectedTrades: [],
    selectedState: existingProfile?.service_area_state || '',
    agreed_to_standards: existingProfile?.agreed_to_standards || false,
    agreed_to_communications: existingProfile?.agreed_to_communications || false,
    agreed_to_privacy_policy: existingProfile?.agreed_to_privacy_policy || false,
    volume_acknowledged: existingProfile?.volume_acknowledged || false,
  });

  const [serviceStates, setServiceStates] = useState<{ code: string; name: string }[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loadingCounties, setLoadingCounties] = useState(false);
  const [countyLoadError, setCountyLoadError] = useState('');
  const [loadingTrades, setLoadingTrades] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<'license' | 'insurance' | null>(null);
  const [docUploadError, setDocUploadError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countySearch, setCountySearch] = useState('');
  const [tradeSearch, setTradeSearch] = useState('');

  useEffect(() => {
    loadTrades();
    fetch('/api/states')
      .then((r) => r.json())
      .then((data) => setServiceStates(Array.isArray(data) ? data : []))
      .catch(() => setServiceStates([]));
  }, []);

  const existingProfileRef = useRef(existingProfile);

  useEffect(() => {
    const stateCode = form.selectedState;
    setCounties([]);
    setCountySearch('');
    setCountyLoadError('');
    if (!stateCode) return;

    let cancelled = false;
    setLoadingCounties(true);

    supabase
      .from('counties')
      .select('id, name, state_code')
      .eq('state_code', stateCode)
      .order('name', { ascending: true })
      .then(({ data, error: loadErr }) => {
        if (cancelled) return;
        if (loadErr) {
          setCountyLoadError('Failed to load counties. Please try again.');
          setCounties([]);
          setLoadingCounties(false);
          return;
        }
        const countyList: County[] = data || [];
        setCounties(countyList);
        setLoadingCounties(false);

        const savedIds = new Set<string>(getSavedCountyIds(existingProfileRef.current));
        if (countyList.length > 0 && savedIds.size > 0) {
          const matched = countyList.filter(c => savedIds.has(c.id)).map(c => c.id);
          if (matched.length > 0) {
            setForm(prev => ({ ...prev, selectedCounties: matched }));
          }
        }
      });

    return () => { cancelled = true; };
  }, [form.selectedState, supabase]);

  function retryLoadCounties(stateCode: string) {
    if (!stateCode) return;
    setCounties([]);
    setCountySearch('');
    setCountyLoadError('');
    setLoadingCounties(true);

    supabase
      .from('counties')
      .select('id, name, state_code')
      .eq('state_code', stateCode)
      .order('name', { ascending: true })
      .then(({ data, error: loadErr }) => {
        if (loadErr) {
          setCountyLoadError('Failed to load counties. Please try again.');
          setCounties([]);
          setLoadingCounties(false);
          return;
        }
        setCounties(data || []);
        setLoadingCounties(false);
      });
  }

  async function loadTrades() {
    setLoadingTrades(true);
    try {
      const { data, error: loadErr } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (loadErr) throw loadErr;

      const tradeList: Trade[] = data || [];
      setTrades(tradeList);

      const savedTradeIds = new Set<string>(getSavedTradeIds(existingProfile));
      if (savedTradeIds.size > 0) {
        const matched = tradeList.filter(t => savedTradeIds.has(t.id)).map(t => t.id);
        if (matched.length > 0) {
          setForm(prev => ({ ...prev, selectedTrades: matched }));
        }
      }
    } catch (err: any) {
      console.error('[ApplicationForm] Trades load error:', err);
    } finally {
      setLoadingTrades(false);
    }
  }

  const filteredTrades = tradeSearch.trim()
    ? trades.filter(t => t.name.toLowerCase().includes(tradeSearch.trim().toLowerCase()))
    : trades;

  function toggleCounty(id: string) {
    setForm(prev => ({
      ...prev,
      selectedCounties: prev.selectedCounties.includes(id)
        ? prev.selectedCounties.filter(c => c !== id)
        : [...prev.selectedCounties, id],
    }));
  }

  function toggleTrade(id: string) {
    setForm(prev => ({
      ...prev,
      selectedTrades: prev.selectedTrades.includes(id)
        ? prev.selectedTrades.filter(t => t !== id)
        : [...prev.selectedTrades, id],
    }));
  }

  function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits.length ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function set(field: keyof ApplicationFormState, value: any) {
    if (field === 'phone') {
      setForm(prev => ({ ...prev, phone: formatPhone(String(value)) }));
      return;
    }
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleDocumentUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'license' | 'insurance'
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setDocUploadError('File must be under 10MB.');
      e.target.value = '';
      return;
    }
    setDocUploadError('');
    setUploadingDoc(docType);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');
      const ext = file.name.split('.').pop() || 'pdf';
      const path = `${user.id}/applications/${docType}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('contractor-documents')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('contractor-documents')
        .getPublicUrl(path);
      const fieldKey = docType === 'license' ? 'license_document_url' : 'insurance_document_url';
      setForm(prev => ({ ...prev, [fieldKey]: urlData.publicUrl }));
    } catch (err: any) {
      setDocUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingDoc(null);
      e.target.value = '';
    }
  }

  function validateStep(s: number): string {
    if (s === 1) {
      if (!form.first_name.trim()) return 'First name is required.';
      if (!form.last_name.trim()) return 'Last name is required.';
      if (!form.company_name.trim()) return 'Business name is required.';
      if (!form.phone.trim()) return 'Phone number is required.';
      if (!form.years_in_business.trim()) return 'Years in business is required.';
    }
    if (s === 2) {
      if (!form.insurance_expiration_date) return 'Insurance expiration date is required.';
      if (!form.license_document_url) return 'Please upload your contractor license document.';
      if (!form.insurance_document_url) return 'Please upload your insurance certificate.';
    }
    if (s === 3) {
      if (!form.selectedState) return 'Please select a service state.';
      if (form.selectedCounties.length === 0) return 'Please select at least one county.';
    }
    if (s === 4) {
      if (form.selectedTrades.length === 0) return 'Please select at least one trade specialty.';
    }
    if (s === 5) {
      if (!form.google_review_url.trim()) return 'Please provide at least your Google Reviews link.';
    }
    if (s === 6) {
      if (!form.agreed_to_standards) return 'You must agree to IronClad Standards.';
      if (!form.agreed_to_communications) return 'You must agree to the Terms of Service.';
      if (!form.agreed_to_privacy_policy) return 'You must agree to the Privacy Policy.';
      if (!form.volume_acknowledged) return 'You must acknowledge that referral volume is not guaranteed.';
    }
    return '';
  }

  function handleNext() {
    const msg = validateStep(step);
    if (msg) { setError(msg); return; }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length));
  }

  function handleBack() {
    setError('');
    setStep(s => Math.max(s - 1, 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = validateStep(6);
    if (msg) { setError(msg); return; }
    setError('');
    setSubmitting(true);

    const selectedCountyNames = counties
      .filter(c => form.selectedCounties.includes(c.id))
      .map(c => c.name);

    const profileUpdates = {
      company_name: form.company_name.trim(),
      owner_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
      phone: form.phone.trim(),
      website: form.website.trim() || null,
      bio: form.bio.trim() || null,
      license_number: form.license_number.trim() || null,
      license_expiration_date: form.license_expiration_date || null,
      insurance_expiration_date: form.insurance_expiration_date || null,
      license_document_url: form.license_document_url || null,
      insurance_document_url: form.insurance_document_url || null,
      google_review_url: form.google_review_url.trim() || null,
      yelp_url: form.yelp_url.trim() || null,
      bbb_url: form.bbb_url.trim() || null,
      facebook_url: form.facebook_url.trim() || null,
      instagram_url: form.instagram_url.trim() || null,
      agreed_to_standards: form.agreed_to_standards,
      agreed_to_communications: form.agreed_to_communications,
      agreed_to_privacy_policy: form.agreed_to_privacy_policy,
      service_area_state: form.selectedState,
      service_area_counties: selectedCountyNames,
      partner_status: PARTNER_STATUS.APPLIED,
      updated_at: new Date().toISOString(),
    };

    try {
      let contractorProfileId: string;

      if (existingProfile?.id) {
        const { error: updateErr } = await supabase
          .from('contractor_profiles')
          .update(profileUpdates)
          .eq('user_id', userId);
        if (updateErr) throw updateErr;
        contractorProfileId = existingProfile.id;
      } else {
        const { data: newProfile, error: insertErr } = await supabase
          .from('contractor_profiles')
          .insert({ ...profileUpdates, user_id: userId, email: userEmail })
          .select('id')
          .single();
        if (insertErr) throw insertErr;
        contractorProfileId = newProfile.id;
      }

      const { error: deleteCountiesErr } = await supabase
        .from('contractor_counties')
        .delete()
        .eq('contractor_id', contractorProfileId);
      if (deleteCountiesErr) throw deleteCountiesErr;

      if (form.selectedCounties.length > 0) {
        const countyRows = form.selectedCounties.map(countyId => ({
          contractor_id: contractorProfileId,
          county_id: countyId,
        }));
        const { error: insertCountiesErr } = await supabase
          .from('contractor_counties')
          .insert(countyRows);
        if (insertCountiesErr) throw insertCountiesErr;
      }

      const { error: deleteCategoriesErr } = await supabase
        .from('contractor_categories')
        .delete()
        .eq('contractor_id', contractorProfileId);
      if (deleteCategoriesErr) throw deleteCategoriesErr;

      if (form.selectedTrades.length > 0) {
        const categoryRows = form.selectedTrades.map(categoryId => ({
          contractor_id: contractorProfileId,
          category_id: categoryId,
        }));
        const { error: insertCategoriesErr } = await supabase
          .from('contractor_categories')
          .insert(categoryRows);
        if (insertCategoriesErr) throw insertCategoriesErr;
      }

      await fetch('/api/contractor-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: userEmail,
          phone: form.phone.trim(),
          business_name: form.company_name.trim(),
          trade: trades.find((trade) => trade.id === form.selectedTrades[0])?.name || 'Other',
          years_in_business: Number(form.years_in_business) || null,
          primary_county: selectedCountyNames[0] || form.primary_county || 'Other',
          primary_state: form.selectedState || null,
          business_description: form.bio.trim(),
          website: form.website.trim() || null,
          license_number: form.license_number.trim() || null,
          license_expiration_date: form.license_expiration_date || null,
          insurance_expiration_date: form.insurance_expiration_date || null,
          license_document_url: form.license_document_url || null,
          insurance_document_url: form.insurance_document_url || null,
          google_review_url: form.google_review_url.trim() || null,
          yelp_url: form.yelp_url.trim() || null,
          bbb_url: form.bbb_url.trim() || null,
          facebook_url: form.facebook_url.trim() || null,
          instagram_url: form.instagram_url.trim() || null,
          ironclad_acknowledged: form.agreed_to_standards,
          volume_acknowledged: form.volume_acknowledged,
        }),
      }).catch((applicationError) => console.error('contractor_applications insert error:', applicationError));

      fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-contractor-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            type: 'application_received',
            to: userEmail,
            contractorName: form.owner_name.trim(),
            companyName: form.company_name.trim(),
          }),
        }
      ).catch(err => console.error('application_received email error:', err));

      setSuccess(true);
    } catch (err: any) {
      console.error('Application submit error:', err);
      setError('Failed to submit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white text-gray-900 rounded-2xl border border-emerald-200 p-10 text-center shadow-sm">
        <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-[#2F2F2F] mb-2">Application Submitted</h2>
        <p className="text-[#2F2F2F]/60 text-sm max-w-md mx-auto">
          Your application has been received. Our team reviews every application personally and will contact you within 72 hours.
        </p>
        <p className="text-[#2F2F2F]/50 text-sm max-w-md mx-auto mt-2">
          In the meantime, follow us on Facebook and Instagram @listworx for network updates.
        </p>
        <div className="mt-6">
          <Button
            type="button"
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => window.location.assign('/')}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const filteredCounties = countySearch.trim()
    ? counties.filter(c => c.name.toLowerCase().includes(countySearch.toLowerCase()))
    : counties;

  const selectedCountyNames = counties
    .filter(c => form.selectedCounties.includes(c.id))
    .map(c => c.name);

  return (
    <div className="bg-white text-gray-900 rounded-2xl border border-lw-border-light overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-lw-border-light bg-gradient-to-r from-lw-rust/5 to-transparent">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-lw-rust/10 border border-lw-rust/20">
            <Shield className="h-5 w-5 text-lw-rust" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-lw-text">Apply to Join the ListWorx Network</h2>
            <p className="text-lw-text/50 text-sm mt-0.5">
              Applications are reviewed by our team within 72 hours. We vet every contractor before approving network access. After approval, you will receive instructions to complete your subscription and claim your Founding Partner spot if one is still available in your trade and county.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        <StepIndicator current={step} />
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* STEP 1: Business Information */}
        {step === 1 && (
          <div>
            <SectionHeader
              icon={Building2}
              title="Business Information"
              description="Your company details shown on your contractor profile"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="First Name" required>
                <Input
                  value={form.first_name}
                  onChange={e => set('first_name', e.target.value)}
                  placeholder="John"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Last Name" required>
                <Input
                  value={form.last_name}
                  onChange={e => set('last_name', e.target.value)}
                  placeholder="Smith"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Business Name" required>
                <Input
                  value={form.company_name}
                  onChange={e => set('company_name', e.target.value)}
                  placeholder="Acme Contractors LLC"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Email Address" required>
                <Input value={userEmail} disabled className={inputClass} />
              </FormField>
              <FormField label="Phone Number" required>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="(615) 000-0000"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Years in Business" required>
                <Input
                  type="number"
                  min="0"
                  value={form.years_in_business}
                  onChange={e => set('years_in_business', e.target.value)}
                  placeholder="10"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Business Website">
                <Input
                  type="url"
                  value={form.website}
                  onChange={e => set('website', e.target.value)}
                  placeholder="https://www.yourcompany.com"
                  className={inputClass}
                />
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="Business Description">
                <textarea
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  placeholder="Brief description of your business, experience, and what sets you apart..."
                  className={textareaClass}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* STEP 2: Licensing & Insurance */}
        {step === 2 && (
          <div>
            <SectionHeader
              icon={FileText}
              title="Licensing & Insurance"
              description="Required for IronClad Standards verification"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                label="License Number"
                hint="Your state contractor license number — used to verify your credentials"
              >
                <Input
                  value={form.license_number}
                  onChange={e => set('license_number', e.target.value)}
                  placeholder="e.g. TN-CON-123456"
                  className={inputClass}
                />
              </FormField>
              <FormField label="License Expiration Date">
                <Input
                  type="date"
                  value={form.license_expiration_date}
                  onChange={e => set('license_expiration_date', e.target.value)}
                  className={inputClass}
                />
              </FormField>
              <FormField label="Insurance Expiration Date" required>
                <Input
                  type="date"
                  value={form.insurance_expiration_date}
                  onChange={e => set('insurance_expiration_date', e.target.value)}
                  className={inputClass}
                />
              </FormField>
            </div>
            {docUploadError && (
              <div className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded-lg p-3 border border-red-200">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-red-500" />
                <p>{docUploadError}</p>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {/* License document upload */}
              <div className="rounded-lg border border-lw-border-light bg-lw-surface p-4">
                <p className="text-sm font-medium text-lw-text mb-2">
                  Contractor License Document <span className="text-red-500">*</span>
                </p>
                {form.license_document_url ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <a
                      href={form.license_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-lw-rust hover:underline truncate"
                    >
                      License uploaded — click to view
                    </a>
                    <button
                      type="button"
                      onClick={() => set('license_document_url', '')}
                      className="ml-auto text-xs text-lw-text/40 hover:text-lw-text"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleDocumentUpload(e, 'license')}
                      disabled={uploadingDoc !== null}
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-lw-rust text-lw-rust text-xs font-medium hover:bg-lw-rust/5 transition-colors">
                      {uploadingDoc === 'license' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {uploadingDoc === 'license' ? 'Uploading...' : 'Upload License'}
                    </span>
                    <span className="text-xs text-lw-text/40">PDF, JPG, or PNG — max 10MB</span>
                  </label>
                )}
              </div>

              {/* Insurance document upload */}
              <div className="rounded-lg border border-lw-border-light bg-lw-surface p-4">
                <p className="text-sm font-medium text-lw-text mb-2">
                  Insurance Certificate <span className="text-red-500">*</span>
                </p>
                {form.insurance_document_url ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <a
                      href={form.insurance_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-lw-rust hover:underline truncate"
                    >
                      Insurance uploaded — click to view
                    </a>
                    <button
                      type="button"
                      onClick={() => set('insurance_document_url', '')}
                      className="ml-auto text-xs text-lw-text/40 hover:text-lw-text"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleDocumentUpload(e, 'insurance')}
                      disabled={uploadingDoc !== null}
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-lw-rust text-lw-rust text-xs font-medium hover:bg-lw-rust/5 transition-colors">
                      {uploadingDoc === 'insurance' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {uploadingDoc === 'insurance' ? 'Uploading...' : 'Upload Insurance'}
                    </span>
                    <span className="text-xs text-lw-text/40">PDF, JPG, or PNG — max 10MB</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Service Area */}
        {step === 3 && (
          <div>
            <SectionHeader
              icon={MapPin}
              title="Service Area"
              description="Select the state and counties where you provide services"
            />

            <div className="mb-4">
              <Label className="text-gray-700 text-sm font-medium mb-2 block">
                Service State <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <select
                  value={form.selectedState}
                  onChange={e => {
                    setForm(prev => ({
                      ...prev,
                      selectedState: e.target.value,
                      selectedCounties: [],
                    }));
                  }}
                  className="w-full appearance-none bg-white border border-gray-300 text-gray-900 rounded-md px-3 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  <option value="" className="text-lw-text/40">Select a state...</option>
                  {serviceStates.map(state => (
                    <option key={state.code} value={state.code} className="text-lw-text">
                      {state.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-lw-text/40 pointer-events-none" />
              </div>
            </div>

            {form.selectedState && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-700 text-sm font-medium">
                    Counties <span className="text-red-500">*</span>
                    {loadingCounties && (
                      <span className="text-xs text-lw-text/40 ml-2 inline-flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                      </span>
                    )}
                  </Label>
                  {form.selectedCounties.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-lw-rust font-medium">
                        {form.selectedCounties.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, selectedCounties: [] }))}
                        className="text-xs text-lw-text/40 hover:text-lw-text transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                {countyLoadError && (
                  <div className="mb-3 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
                    <span className="text-xs text-red-700">{countyLoadError}</span>
                    <button
                      type="button"
                      onClick={() => retryLoadCounties(form.selectedState)}
                      className="text-xs text-lw-rust hover:text-lw-rust-hover transition-colors ml-3 font-medium"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {form.selectedCounties.length > 0 && selectedCountyNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedCountyNames.map(name => {
                      const county = counties.find(c => c.name === name);
                      return (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-lw-rust/10 text-lw-rust border border-lw-rust/20"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => county && toggleCounty(county.id)}
                            className="hover:text-lw-rust-hover transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {!loadingCounties && counties.length > 0 && (
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-lw-text/30 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search counties..."
                      value={countySearch}
                      onChange={e => setCountySearch(e.target.value)}
                      className="w-full bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-72 overflow-y-auto border border-lw-border-light rounded-xl p-3 bg-lw-surface">
                  {loadingCounties ? (
                    <div className="col-span-3 flex items-center justify-center py-6 gap-2 text-lw-text/40">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading counties...</span>
                    </div>
                  ) : filteredCounties.length === 0 ? (
                    <p className="text-sm text-lw-text/40 col-span-3 py-4 text-center">
                      {countySearch
                        ? 'No counties match your search.'
                        : countyLoadError
                        ? 'Failed to load — use the retry button above.'
                        : 'No counties available for this state.'}
                    </p>
                  ) : (
                    filteredCounties.map(county => {
                      const selected = form.selectedCounties.includes(county.id);
                      return (
                        <label
                          key={county.id}
                          className={`flex items-center gap-2 cursor-pointer text-sm p-2 rounded-lg border transition-all ${
                            selected
                              ? 'border-lw-rust/30 bg-lw-rust/8'
                              : 'border-transparent hover:bg-lw-surface'
                          }`}
                          onClick={() => toggleCounty(county.id)}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all pointer-events-none ${
                              selected ? 'bg-lw-rust border-lw-rust' : 'border-lw-border-light'
                            }`}
                          >
                            {selected && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <span className={selected ? 'text-lw-text font-medium' : 'text-lw-text/70'}>
                            {county.name}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>

                {!loadingCounties && counties.length > 0 && (
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setForm(prev => ({
                          ...prev,
                          selectedCounties: filteredCounties.map(c => c.id),
                        }))
                      }
                      className="text-xs text-lw-rust hover:text-lw-rust-hover transition-colors"
                    >
                      {countySearch.trim() ? 'Select filtered' : 'Select all'}
                    </button>
                    {form.selectedCounties.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, selectedCounties: [] }))}
                        className="text-xs text-lw-text/40 hover:text-lw-text transition-colors"
                      >
                        Deselect all
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Trade Specialties */}
        {step === 4 && (
          <div>
            <SectionHeader
              icon={Briefcase}
              title="Trade Specialties"
              description="Select all trades you provide"
            />

            {form.selectedTrades.length > 0 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-lw-rust font-medium">
                  {form.selectedTrades.length} trade{form.selectedTrades.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, selectedTrades: [] }))}
                  className="text-xs text-lw-text/40 hover:text-lw-text transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-lw-text/30 pointer-events-none" />
              <input
                type="text"
                placeholder="Search trades..."
                value={tradeSearch}
                onChange={e => setTradeSearch(e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-md pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>

            {loadingTrades ? (
              <div className="flex items-center justify-center py-8 gap-2 text-lw-text/40">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading trades...</span>
              </div>
            ) : filteredTrades.length === 0 ? (
              <div className="text-center py-8 text-lw-text/40 text-sm">
                {tradeSearch ? 'No trades match your search.' : 'No trade categories available.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-80 overflow-y-auto border border-lw-border-light rounded-xl p-3 bg-lw-surface">
                {filteredTrades.map(trade => {
                  const selected = form.selectedTrades.includes(trade.id);
                  return (
                    <label
                      key={trade.id}
                      className={`flex items-center gap-2.5 cursor-pointer text-sm p-2.5 rounded-lg border transition-all ${
                        selected
                          ? 'border-lw-rust/30 bg-lw-rust/8 text-lw-text'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-300 hover:text-gray-900'
                      }`}
                      onClick={() => toggleTrade(trade.id)}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all pointer-events-none ${
                          selected ? 'bg-lw-rust border-lw-rust' : 'border-lw-border-light'
                        }`}
                      >
                        {selected && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                      </div>
                      {trade.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Reviews & References */}
        {step === 5 && (
          <div>
            <SectionHeader
              icon={Star}
              title="Reviews & References"
              description="Help us verify your reputation — at least your Google Reviews link is required"
            />
            <div className="space-y-4">
              <FormField label="Google Reviews Link" required hint="Your Google Business review page — e.g. https://g.page/r/your-profile/review">
                <Input
                  type="url"
                  value={form.google_review_url}
                  onChange={e => set('google_review_url', e.target.value)}
                  placeholder="https://g.page/r/your-profile/review"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Yelp Profile" hint="Your Yelp business page">
                <Input
                  type="url"
                  value={form.yelp_url}
                  onChange={e => set('yelp_url', e.target.value)}
                  placeholder="https://yelp.com/biz/your-business"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Better Business Bureau (BBB)" hint="Your BBB listing, if applicable">
                <Input
                  type="url"
                  value={form.bbb_url}
                  onChange={e => set('bbb_url', e.target.value)}
                  placeholder="https://bbb.org/us/your-listing"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Facebook Business Page">
                <Input
                  type="url"
                  value={form.facebook_url}
                  onChange={e => set('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/your-business"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Instagram">
                <Input
                  type="url"
                  value={form.instagram_url}
                  onChange={e => set('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/your-business"
                  className={inputClass}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* STEP 6: Agreements */}
        {step === 6 && (
          <div>
            <SectionHeader
              icon={Shield}
              title="Agreements"
              description="Required to complete your application"
            />
            <div className="space-y-3">
              {[
                {
                  field: 'agreed_to_standards' as keyof ApplicationFormState,
                  label: 'I understand ListWorx requires IronClad Standards compliance including 24-hour response, valid insurance, and professional conduct. I agree to uphold',
                  linkText: 'IronClad Standards',
                  linkHref: '/ironclad',
                  suffix: 'for all work performed through the ListWorx network.',
                },
                {
                  field: 'agreed_to_communications' as keyof ApplicationFormState,
                  label: 'I agree to the',
                  linkText: 'Terms of Service',
                  linkHref: '/terms',
                  suffix: '',
                },
                {
                  field: 'agreed_to_privacy_policy' as keyof ApplicationFormState,
                  label: 'I agree to the',
                  linkText: 'Privacy Policy',
                  linkHref: '/privacy',
                  suffix: '',
                },
                {
                  field: 'volume_acknowledged' as keyof ApplicationFormState,
                  label: 'I understand referral volume is not guaranteed.',
                  linkText: '',
                  linkHref: '',
                  suffix: '',
                },
              ].map(item => (
                <label key={item.field} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      form[item.field]
                        ? 'bg-lw-rust border-lw-rust'
                        : 'border-lw-border-light group-hover:border-lw-rust/50'
                    }`}
                    onClick={() => set(item.field, !form[item.field])}
                  >
                    {form[item.field] && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-lw-text/70 text-sm leading-relaxed">
                    {item.label}{' '}
                    {item.linkText && (
                      <a
                        href={item.linkHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lw-rust hover:text-lw-rust-hover underline-offset-2 hover:underline inline-flex items-center gap-0.5"
                        onClick={e => e.stopPropagation()}
                      >
                        {item.linkText}
                        <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    )}{' '}
                    {item.suffix}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 bg-lw-surface border border-lw-border-light rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-lw-text/60 uppercase tracking-wide">
                What happens next
              </p>
              {[
                'Our team reviews your application within 72 hours.',
                "You'll receive an email notification with the decision.",
                'Approved applicants unlock subscription plans and full dashboard access.',
                'Referral tools activate after approval and subscription setup.',
              ].map((line, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-lw-text/50">
                  <ChevronRight className="h-3.5 w-3.5 text-lw-rust flex-shrink-0 mt-0.5" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-lw-border-light">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="text-gray-700 hover:text-gray-900 disabled:text-gray-400 disabled:opacity-100"
          >
            Back
          </Button>

          <div className="flex items-center gap-1">
            {STEPS.map(s => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${
                  s.id === step
                    ? 'w-6 bg-lw-rust'
                    : s.id < step
                    ? 'w-3 bg-emerald-500'
                    : 'w-3 bg-lw-border-light'
                }`}
              />
            ))}
          </div>

          {step < STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-orange-600 text-white hover:bg-orange-700 font-semibold"
            >
              Continue
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-orange-600 text-white hover:bg-orange-700 font-semibold h-10 px-6"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Submit My Application
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
