'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Copy,
  Check,
  ChevronLeft,
  Loader2,
  Wand2,
  FileText,
  Mail,
  Home,
  Share2,
  Globe,
  RefreshCw,
  Zap,
  Calendar,
  Image,
} from 'lucide-react';
import type { RealtorProfile } from './SubscriptionCards';

// ─── Types ────────────────────────────────────────────────────────────────────

type Asset = {
  id: string;
  listing_id: string;
  asset_type: string;
  content: string;
  version: number;
};

type Listing = {
  id: string;
  user_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  price: number;
  description: string;
  brand_name: string | null;
  brand_phone: string | null;
  brand_email: string | null;
  brand_color: string | null;
  slug: string;
  status: string;
  created_at: string;
  listing_assets?: Asset[];
};

type GeneratedContent = Record<string, string>;

type FormData = {
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: string;
  baths: string;
  sqft: string;
  price: string;
  description: string;
  brand_name: string;
  brand_phone: string;
  brand_email: string;
  brand_color: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, number> = {
  starter:   8,
  agent:     25,
  pro_agent: 60,
};

const EMPTY_FORM: FormData = {
  address:     '',
  city:        '',
  state:       'TN',
  zip:         '',
  beds:        '',
  baths:       '',
  sqft:        '',
  price:       '',
  description: '',
  brand_name:  '',
  brand_phone: '',
  brand_email: '',
  brand_color: '#ff6600',
};

const CONTENT_CARDS: {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  emailKeys?: string[];
}[] = [
  { key: 'instagram_caption_1',    label: 'Instagram Caption 1',          icon: Image },
  { key: 'instagram_caption_2',    label: 'Instagram Caption 2',          icon: Image },
  { key: 'instagram_caption_3',    label: 'Instagram Caption 3',          icon: Image },
  { key: 'facebook_post',          label: 'Facebook Post',                 icon: Share2 },
  { key: 'linkedin_post',          label: 'LinkedIn Post',                 icon: Globe },
  { key: 'email',                  label: 'Email',                         icon: Mail,
    emailKeys: ['email_subject', 'email_body'] },
  { key: 'open_house_announcement',label: 'Open House Announcement',       icon: Calendar },
  { key: 'description_rewrite',    label: 'Property Description Rewrite',  icon: FileText },
];

// ─── Small components ─────────────────────────────────────────────────────────

function UsageBar({
  remaining,
  total,
}: {
  remaining: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full bg-zinc-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-lw-rust transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400 whitespace-nowrap">
        {remaining} / {total} remaining
      </span>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400 mb-1.5">
        {label}
        {required && <span className="text-lw-rust ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lw-rust/50 focus:border-lw-rust transition';

// ─── Main component ───────────────────────────────────────────────────────────

export function ListingStudio({
  realtorProfile,
}: {
  realtorProfile: RealtorProfile;
}) {
  const [view, setView]                   = useState<'list' | 'create' | 'generated'>('list');
  const [listings, setListings]           = useState<Listing[]>([]);
  const [currentListing, setCurrentListing] = useState<Listing | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [copiedKey, setCopiedKey]         = useState<string | null>(null);
  const [formData, setFormData]           = useState<FormData>(EMPTY_FORM);
  const [remainingPackages, setRemainingPackages] = useState(
    realtorProfile.content_packages_remaining
  );

  const tier      = realtorProfile.listing_studio_tier || 'starter';
  const planLimit = PLAN_LIMITS[tier] || 8;

  // ── Load listings ──────────────────────────────────────────────────────────

  const loadListings = useCallback(async () => {
    try {
      const res = await fetch('/api/listing-studio/listings');
      if (!res.ok) throw new Error('Failed to load listings');
      const data = await res.json();
      setListings(data.listings || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  // ── Clipboard copy ─────────────────────────────────────────────────────────

  async function handleCopy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Clipboard API not available — silently ignore
    }
  }

  // ── Content generation ─────────────────────────────────────────────────────

  async function runGenerate(listingId: string): Promise<GeneratedContent> {
    const res = await fetch('/api/listing-studio/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Generation failed');
    return data.parsed as GeneratedContent;
  }

  // ── Form submission ────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let listingId: string;

      if (currentListing) {
        // Re-generating content for an existing listing — skip creation
        listingId = currentListing.id;
      } else {
        // New listing — create the DB record first
        const listingRes = await fetch('/api/listing-studio/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            beds:  Number(formData.beds),
            baths: Number(formData.baths),
            sqft:  Number(formData.sqft),
            price: Number(formData.price),
          }),
        });
        const listingData = await listingRes.json();
        if (!listingRes.ok) throw new Error(listingData.error || 'Failed to create listing');
        setCurrentListing(listingData.listing);
        listingId = listingData.listing.id;
      }

      // Switch to generating state before the API call
      setIsSubmitting(false);
      setIsGenerating(true);

      const content = await runGenerate(listingId);
      setGeneratedContent(content);
      setRemainingPackages((prev) => Math.max(0, prev - 1));
      await loadListings();
      setView('generated');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      setIsGenerating(false);
    }
  }

  // ── Regenerate all content for current listing ─────────────────────────────

  async function handleRegenerate() {
    if (!currentListing) return;
    setIsGenerating(true);
    setError(null);
    try {
      const content = await runGenerate(currentListing.id);
      setGeneratedContent(content);
      setRemainingPackages((prev) => Math.max(0, prev - 1));
      await loadListings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Navigation helpers ─────────────────────────────────────────────────────

  function handleNewListing() {
    setCurrentListing(null);
    setGeneratedContent(null);
    setFormData(EMPTY_FORM);
    setError(null);
    setView('create');
  }

  function handleGenerateForExisting(listing: Listing) {
    setCurrentListing(listing);
    setGeneratedContent(null);
    setFormData({
      address:     listing.address,
      city:        listing.city,
      state:       listing.state,
      zip:         listing.zip,
      beds:        String(listing.beds),
      baths:       String(listing.baths),
      sqft:        String(listing.sqft),
      price:       String(listing.price),
      description: listing.description,
      brand_name:  listing.brand_name  || '',
      brand_phone: listing.brand_phone || '',
      brand_email: listing.brand_email || '',
      brand_color: listing.brand_color || '#ff6600',
    });
    setError(null);
    setView('create');
  }

  function handleViewContent(listing: Listing) {
    const content = (listing.listing_assets || []).reduce<GeneratedContent>(
      (acc, a) => ({ ...acc, [a.asset_type]: a.content }),
      {}
    );
    setCurrentListing(listing);
    setGeneratedContent(content);
    setError(null);
    setView('generated');
  }

  function handleBackToList() {
    setCurrentListing(null);
    setGeneratedContent(null);
    setError(null);
    setView('list');
  }

  // ── Field helpers ──────────────────────────────────────────────────────────

  function field(key: keyof FormData) {
    return {
      value: formData[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">

      {/* ── SECTION A — List view ─────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wand2 className="h-5 w-5 text-lw-rust" />
                <h3 className="text-xl font-bold text-white">Listing Studio</h3>
              </div>
              <div className="mt-2 max-w-sm">
                <UsageBar remaining={remainingPackages} total={planLimit} />
              </div>
            </div>
            <Button
              onClick={handleNewListing}
              className="bg-lw-rust hover:bg-lw-rust-hover text-white font-semibold shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Listing
            </Button>
          </div>

          {error && (
            <Alert className="mb-4 bg-red-950/40 border-red-800">
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {/* Listing cards */}
          {listings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center">
              <Wand2 className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400 text-sm mb-1">No listings yet.</p>
              <p className="text-zinc-600 text-xs">
                Create your first one to generate marketing content.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((listing) => {
                const hasContent = (listing.listing_assets || []).length > 0;
                return (
                  <div
                    key={listing.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {listing.address}, {listing.city}, {listing.state}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <span>{formatDate(listing.created_at)}</span>
                        <span>·</span>
                        <span>
                          {listing.beds}bd · {listing.baths}ba · {listing.sqft?.toLocaleString()} sqft
                        </span>
                        <span>·</span>
                        <span>{formatPrice(listing.price)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasContent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewContent(listing)}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
                        >
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                          View Content
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleGenerateForExisting(listing)}
                        className="bg-lw-rust hover:bg-lw-rust-hover text-white text-xs"
                      >
                        <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                        Generate Content
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION B — Create / generate form ───────────────────────────── */}
      {view === 'create' && (
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleBackToList}
              className="text-zinc-400 hover:text-white transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h3 className="text-xl font-bold text-white">
                {currentListing ? 'Regenerate Content' : 'New Listing'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {currentListing
                  ? `${currentListing.address}, ${currentListing.city}`
                  : 'Fill in the listing details to generate marketing content'}
              </p>
            </div>
          </div>

          {/* Loading overlay */}
          {(isSubmitting || isGenerating) && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-10 text-center mb-6">
              <Loader2 className="h-8 w-8 text-lw-rust animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold mb-1">
                {isSubmitting ? 'Saving listing...' : 'Generating your content...'}
              </p>
              {isGenerating && (
                <p className="text-zinc-400 text-sm">This takes about 30 seconds.</p>
              )}
            </div>
          )}

          {error && (
            <Alert className="mb-4 bg-red-950/40 border-red-800">
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {!isSubmitting && !isGenerating && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Property Details */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-lw-rust mb-4">
                  Property Details
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <FormField label="Street Address" required>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="123 Main St"
                        required
                        {...field('address')}
                      />
                    </FormField>
                  </div>
                  <FormField label="City" required>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Nashville"
                      required
                      {...field('city')}
                    />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="State" required>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="TN"
                        maxLength={2}
                        required
                        {...field('state')}
                      />
                    </FormField>
                    <FormField label="Zip" required>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="37201"
                        required
                        {...field('zip')}
                      />
                    </FormField>
                  </div>
                  <FormField label="Beds" required>
                    <input
                      type="number"
                      className={inputClass}
                      placeholder="3"
                      min={0}
                      step={1}
                      required
                      {...field('beds')}
                    />
                  </FormField>
                  <FormField label="Baths" required>
                    <input
                      type="number"
                      className={inputClass}
                      placeholder="2"
                      min={0}
                      step={0.5}
                      required
                      {...field('baths')}
                    />
                  </FormField>
                  <FormField label="Sqft" required>
                    <input
                      type="number"
                      className={inputClass}
                      placeholder="1800"
                      min={0}
                      required
                      {...field('sqft')}
                    />
                  </FormField>
                  <FormField label="List Price ($)" required>
                    <input
                      type="number"
                      className={inputClass}
                      placeholder="425000"
                      min={0}
                      required
                      {...field('price')}
                    />
                  </FormField>
                  <div className="sm:col-span-2">
                    <FormField label="Property Description" required>
                      <textarea
                        className={`${inputClass} min-h-[120px] resize-y`}
                        placeholder="Paste your MLS description here or describe the property..."
                        required
                        rows={5}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Brand Details */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-lw-rust mb-4">
                  Your Brand
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Agent / Team Name" required>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Jane Smith Realty"
                      required
                      {...field('brand_name')}
                    />
                  </FormField>
                  <FormField label="Phone" required>
                    <input
                      type="tel"
                      className={inputClass}
                      placeholder="(615) 555-0100"
                      required
                      {...field('brand_phone')}
                    />
                  </FormField>
                  <FormField label="Email" required>
                    <input
                      type="email"
                      className={inputClass}
                      placeholder="jane@example.com"
                      required
                      {...field('brand_email')}
                    />
                  </FormField>
                  <FormField label="Brand Color">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-10 w-16 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer p-1"
                        {...field('brand_color')}
                      />
                      <span className="text-zinc-400 text-sm font-mono">
                        {formData.brand_color}
                      </span>
                    </div>
                  </FormField>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToList}
                  className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-lw-rust hover:bg-lw-rust-hover text-white font-semibold flex-1 sm:flex-none"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate My Content
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── SECTION C — Generated content view ───────────────────────────── */}
      {view === 'generated' && generatedContent && currentListing && (
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <button
                onClick={handleBackToList}
                className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm mb-2 transition"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to listings
              </button>
              <h3 className="text-xl font-bold text-white">
                {currentListing.address}, {currentListing.city}
              </h3>
              <p className="text-sm text-zinc-500 mt-0.5">Your Marketing Content</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isGenerating || remainingPackages <= 0}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate All
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert className="mb-4 bg-red-950/40 border-red-800">
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {/* Content cards grid */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {CONTENT_CARDS.map((card) => {
              // Email card combines subject + body
              const isEmail = !!card.emailKeys;
              const displayText = isEmail
                ? `Subject: ${generatedContent.email_subject || ''}\n\n${generatedContent.email_body || ''}`
                : generatedContent[card.key] || '';
              const copyText = displayText;
              const isCopied = copiedKey === card.key;
              const Icon = card.icon;

              return (
                <div
                  key={card.key}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-3"
                >
                  {/* Card header */}
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-lw-rust shrink-0" />
                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-300">
                      {card.label}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {isEmail ? (
                      <div className="space-y-2">
                        <div className="rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2">
                          <p className="text-xs text-zinc-500 mb-0.5">Subject</p>
                          <p className="text-sm text-white">
                            {generatedContent.email_subject || '—'}
                          </p>
                        </div>
                        <div className="rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2">
                          <p className="text-xs text-zinc-500 mb-0.5">Body</p>
                          <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                            {generatedContent.email_body || '—'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                        {displayText || '—'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(card.key, copyText)}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs h-8"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 mr-1.5" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRegenerate}
                      disabled={isGenerating || remainingPackages <= 0}
                      className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs h-8"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Usage summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-lw-rust shrink-0" />
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-white">{remainingPackages}</span>
              {' '}content package{remainingPackages !== 1 ? 's' : ''} remaining this month
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
