'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader as Loader2, Printer, ArrowLeft } from 'lucide-react';

const TEMPLATES = [
  { id: 'service_announcement', name: 'Service Announcement', description: 'Promote a specific service to homeowners in your area.' },
  { id: 'before_after', name: 'Before & After Feature', description: 'Show off your work with a compelling before/after layout.' },
  { id: 'new_customer_intro', name: 'New Customer Introduction', description: 'Introduce your business to new potential customers.' },
  { id: 'job_completion', name: 'Job Completion Leave-Behind', description: 'Leave this with customers after finishing a job.' },
  { id: 'estimate_cover', name: 'Estimate Cover Sheet', description: 'Professional cover for any estimate package you provide.' },
  { id: 'referral_card', name: 'Referral Card', description: 'Encourage existing customers to refer friends and family.' },
];

export default function FlyerBuilderPage() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [fields, setFields] = useState<Record<string, string>>({});
  const [beforePhotoUrl, setBeforePhotoUrl] = useState('');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login?redirect=/contractor-dashboard/flyers'); return; }

      const { data: prof } = await supabase.from('contractor_profiles').select('*').eq('user_id', session.user.id).maybeSingle();
      setProfile(prof || {});

      const tier = (prof?.tier || '').toLowerCase();
      const hasActiveTier = prof?.subscription_status === 'active' && (tier === 'preferred' || tier === 'elite');

      let hasPurchase = false;
      if (!hasActiveTier) {
        const { data: purchases } = await supabase.from('contractor_purchases').select('item_name, purchase_type').eq('contractor_id', prof?.id);
        hasPurchase = (purchases || []).some((p: any) =>
          p.purchase_type === 'flyer_builder' || (p.item_name || '').toLowerCase().includes('flyer')
        );
      }

      setHasAccess(hasActiveTier || hasPurchase);

      if (prof) {
        setFields({
          business_name: prof.company_name || '',
          tagline: prof.tagline || '',
          phone: prof.phone || '',
          email: prof.email || '',
          website: prof.website || '',
          logo_url: prof.logo_url || '',
        });
      }

      setLoading(false);
    };
    init();
  }, []);

  const setField = (key: string, val: string) => setFields(prev => ({ ...prev, [key]: val }));

  const handleUpload = async (file: File, type: 'before' | 'after' | 'logo') => {
    if (!profile?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/${type}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('contractor-work-photos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('contractor-work-photos').getPublicUrl(path);
      if (type === 'before') setBeforePhotoUrl(urlData.publicUrl);
      else if (type === 'after') setAfterPhotoUrl(urlData.publicUrl);
      else setField('logo_url', urlData.publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#E8621A]" />
    </div>
  );

  if (!hasAccess) return (
    <div className="min-h-screen bg-zinc-950 py-16 px-4">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold text-white mb-3">Marketing Flyer Builder</h1>
        <p className="text-zinc-400 mb-6">The Flyer Builder is included with Preferred and Elite plans, or available as an add-on.</p>
        <Button onClick={() => router.push('/contractor-dashboard')} className="bg-[#E8621A] hover:bg-[#d45516] text-white">
          Upgrade Your Plan
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .flyer-preview, .flyer-preview * { visibility: visible; }
          .flyer-preview { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="min-h-screen bg-zinc-950 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Marketing Flyer Builder</h1>
            <p className="text-zinc-400 mt-1">Choose a template, customize it with your info and photos, then download as PDF.</p>
          </div>

          {!selectedTemplate ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map(t => (
                <div key={t.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col gap-3">
                  <h3 className="font-semibold text-white">{t.name}</h3>
                  <p className="text-sm text-zinc-400 flex-1">{t.description}</p>
                  <Button onClick={() => setSelectedTemplate(t.id)} className="bg-[#E8621A] hover:bg-[#d45516] text-white w-full">
                    Use This Template
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* LEFT: Editor */}
              <div className="space-y-4">
                <button onClick={() => setSelectedTemplate(null)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to templates
                </button>
                <h2 className="text-lg font-semibold text-white">
                  {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                </h2>

                {/* Base fields */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Business Info</h3>
                  {[
                    { key: 'business_name', label: 'Business Name' },
                    { key: 'tagline', label: 'Tagline' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'email', label: 'Email' },
                    { key: 'website', label: 'Website' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-zinc-300 text-sm">{label}</Label>
                      <Input value={fields[key] || ''} onChange={e => setField(key, e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white" />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label className="text-zinc-300 text-sm">Logo</Label>
                    <input type="file" accept="image/*" disabled={uploading}
                      onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')}
                      className="text-sm text-zinc-300" />
                  </div>
                </div>

                {/* Template-specific fields */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Template Details</h3>

                  {selectedTemplate === 'service_announcement' && <>
                    <TF label="Service Description" k="service_description" fields={fields} setField={setField} multi />
                    <TF label="Service Area" k="service_area" fields={fields} setField={setField} />
                    <TF label="Call to Action Text" k="cta_text" fields={fields} setField={setField} />
                  </>}

                  {selectedTemplate === 'before_after' && <>
                    <TF label="Job Type" k="job_type" fields={fields} setField={setField} />
                    <TF label="Caption" k="caption" fields={fields} setField={setField} />
                    <div className="space-y-1">
                      <Label className="text-zinc-300 text-sm">Before Photo</Label>
                      <input type="file" accept="image/*" disabled={uploading}
                        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'before')}
                        className="text-sm text-zinc-300" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-zinc-300 text-sm">After Photo</Label>
                      <input type="file" accept="image/*" disabled={uploading}
                        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'after')}
                        className="text-sm text-zinc-300" />
                    </div>
                  </>}

                  {selectedTemplate === 'new_customer_intro' && <>
                    <TF label="Short Bio" k="bio" fields={fields} setField={setField} multi />
                    <TF label="Specialty" k="specialty" fields={fields} setField={setField} />
                    <TF label="Years in Business" k="years_in_business" fields={fields} setField={setField} />
                  </>}

                  {selectedTemplate === 'job_completion' && <>
                    <TF label="Customer Name (optional)" k="customer_name" fields={fields} setField={setField} />
                    <TF label="Job Completed" k="job_type" fields={fields} setField={setField} />
                    <TF label="Completion Date" k="completion_date" fields={fields} setField={setField} />
                    <TF label="QR Code URL" k="qr_url" fields={{ ...fields, qr_url: fields.qr_url || `https://listworx.co/contractor/${profile?.id || ''}` }} setField={setField} />
                  </>}

                  {selectedTemplate === 'estimate_cover' && <>
                    <TF label="Customer Name" k="customer_name" fields={fields} setField={setField} />
                    <TF label="Job Address" k="job_address" fields={fields} setField={setField} />
                    <TF label="Estimate Date" k="estimate_date" fields={fields} setField={setField} />
                    <TF label="Job Description" k="job_description" fields={fields} setField={setField} multi />
                  </>}

                  {selectedTemplate === 'referral_card' && <>
                    <TF label="Short Pitch" k="pitch" fields={fields} setField={setField} multi />
                    <TF label="Offer Text (e.g. Free estimate)" k="offer_text" fields={fields} setField={setField} />
                  </>}
                </div>

                <Button onClick={() => window.print()} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">
                  <Printer className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </div>

              {/* RIGHT: Preview */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">Preview</h3>
                <FlyerPreview
                  template={selectedTemplate}
                  fields={fields}
                  beforePhotoUrl={beforePhotoUrl}
                  afterPhotoUrl={afterPhotoUrl}
                  profile={profile}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function TF({ label, k, fields, setField, multi }: { label: string; k: string; fields: Record<string, string>; setField: (k: string, v: string) => void; multi?: boolean }) {
  return (
    <div className="space-y-1">
      <Label className="text-zinc-300 text-sm">{label}</Label>
      {multi ? (
        <Textarea value={fields[k] || ''} onChange={e => setField(k, e.target.value)} rows={3}
          className="bg-zinc-800 border-zinc-700 text-white" />
      ) : (
        <Input value={fields[k] || ''} onChange={e => setField(k, e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-white" />
      )}
    </div>
  );
}

function FlyerPreview({ template, fields, beforePhotoUrl, afterPhotoUrl, profile }: any) {
  const isIronClad = profile?.ironclad_certified;
  const isFounder = profile?.founding_partner || profile?.founder_status;

  return (
    <div className="flyer-preview bg-white" style={{ aspectRatio: '8.5 / 11', fontFamily: 'Georgia, serif', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      {/* Header */}
      <div style={{ background: '#1a1a1a', color: 'white', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {fields.logo_url && <img src={fields.logo_url} alt="logo" style={{ height: 48, width: 48, objectFit: 'contain', borderRadius: 4 }} />}
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{fields.business_name || 'Your Business Name'}</div>
          {fields.tagline && <div style={{ fontSize: 13, color: '#E8621A', marginTop: 2 }}>{fields.tagline}</div>}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px', flex: 1 }}>
        {template === 'service_announcement' && (
          <>
            <div style={{ color: '#E8621A', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Now Offering</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>{fields.service_description || 'Your Service Here'}</div>
            <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 16 }}>Serving {fields.service_area || 'your area'}</div>
            {fields.cta_text && <div style={{ background: '#E8621A', color: 'white', padding: '10px 20px', display: 'inline-block', borderRadius: 6, fontSize: 14, fontWeight: 600 }}>{fields.cta_text}</div>}
          </>
        )}
        {template === 'before_after' && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>{fields.job_type || 'Job Type'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>BEFORE</div>
                {beforePhotoUrl ? <img src={beforePhotoUrl} alt="before" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 4 }} /> : <div style={{ width: '100%', height: 140, background: '#f3f4f6', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>No photo</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, fontWeight: 600 }}>AFTER</div>
                {afterPhotoUrl ? <img src={afterPhotoUrl} alt="after" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 4 }} /> : <div style={{ width: '100%', height: 140, background: '#f3f4f6', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 12 }}>No photo</div>}
              </div>
            </div>
            {fields.caption && <div style={{ fontSize: 13, color: '#4b5563', fontStyle: 'italic' }}>{fields.caption}</div>}
          </>
        )}
        {template === 'new_customer_intro' && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>About Us</div>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 12, lineHeight: 1.6 }}>{fields.bio || 'Your business description here.'}</div>
            {fields.specialty && <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 4 }}><strong>Specialty:</strong> {fields.specialty}</div>}
            {fields.years_in_business && <div style={{ fontSize: 13, color: '#4b5563' }}><strong>In Business:</strong> {fields.years_in_business} years</div>}
          </>
        )}
        {template === 'job_completion' && (
          <>
            <div style={{ color: '#E8621A', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Job Complete</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{fields.job_type || 'Job Description'}</div>
            {fields.customer_name && <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 4 }}>For: {fields.customer_name}</div>}
            {fields.completion_date && <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 12 }}>Completed: {fields.completion_date}</div>}
            <div style={{ fontSize: 12, color: '#9ca3af' }}>View our profile: {fields.qr_url || `https://listworx.co/contractor/${profile?.id || ''}`}</div>
          </>
        )}
        {template === 'estimate_cover' && (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>Estimate</div>
            {fields.customer_name && <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}><strong>Prepared for:</strong> {fields.customer_name}</div>}
            {fields.job_address && <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}><strong>Address:</strong> {fields.job_address}</div>}
            {fields.estimate_date && <div style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}><strong>Date:</strong> {fields.estimate_date}</div>}
            <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{fields.job_description || 'Job description here.'}</div>
          </>
        )}
        {template === 'referral_card' && (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Know someone who needs a contractor?</div>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 16, lineHeight: 1.6 }}>{fields.pitch || 'Your referral pitch here.'}</div>
            {fields.offer_text && (
              <div style={{ background: '#E8621A', color: 'white', padding: '10px 20px', display: 'inline-block', borderRadius: 6, fontSize: 14, fontWeight: 600 }}>
                {fields.offer_text}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
          {fields.phone && <span>{fields.phone}</span>}
          {fields.email && <span>{fields.email}</span>}
          {fields.website && <span>{fields.website}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>Vetted by ListWorx</span>
          {isIronClad && <span style={{ fontSize: 10, fontWeight: 700, color: '#E8621A' }}>⬡ IronClad Certified</span>}
          {isFounder && <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706' }}>★ Founding Partner</span>}
        </div>
      </div>
    </div>
  );
}
