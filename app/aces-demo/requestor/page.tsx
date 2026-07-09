'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader as Loader2, Phone, Mail, Shield, Crown, User } from 'lucide-react';
import { PageShell } from '@/components/design-system';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import DemoTopNav from '../DemoTopNav';
import ContractorProfileModal from './ContractorProfileModal';
import {
  DEMO_STATES,
  DEMO_COUNTIES,
  DEMO_CATEGORIES,
  DEMO_PREFILL_REQUEST,
  runDemoMatching,
  type DemoContractorProfile,
  type DemoTierId,
} from '@/lib/demo/acesDemoData';

const TIER_BADGE_LABEL: Record<DemoTierId, string> = {
  basic: 'Basic',
  preferred: 'Preferred',
  elite: 'Elite',
};

export default function RequestorDemoPage() {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    clientType: 'Realtor',
    clientName: DEMO_PREFILL_REQUEST.clientName,
    companyName: DEMO_PREFILL_REQUEST.companyName,
    clientEmail: DEMO_PREFILL_REQUEST.clientEmail,
    clientPhone: DEMO_PREFILL_REQUEST.clientPhone,
    propertyAddressLine1: DEMO_PREFILL_REQUEST.propertyAddress,
    propertyCity: DEMO_PREFILL_REQUEST.propertyCity,
    propertyStateCode: DEMO_PREFILL_REQUEST.propertyState,
    propertyCountyId: DEMO_PREFILL_REQUEST.propertyCountyId,
    propertyZip: DEMO_PREFILL_REQUEST.propertyZip,
    urgencyLevel: DEMO_PREFILL_REQUEST.urgency,
    description: DEMO_PREFILL_REQUEST.description,
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([DEMO_PREFILL_REQUEST.categoryId]);
  const [matching, setMatching] = useState(false);
  const [matched, setMatched] = useState(false);
  const [contractors, setContractors] = useState<DemoContractorProfile[]>([]);
  const [profileModalContractor, setProfileModalContractor] = useState<DemoContractorProfile | null>(null);

  const counties = useMemo(
    () => DEMO_COUNTIES.filter((c) => c.state_code === formData.propertyStateCode),
    [formData.propertyStateCode]
  );

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (selectedCategories.length === 0) {
      toast({ title: 'Select a service', description: 'Choose at least one job type before submitting.' });
      return;
    }

    setMatching(true);

    // Simulate a brief "matching" moment like the real flow, then run the
    // local demo matching function — no API call, no Supabase.
    setTimeout(() => {
      const results = runDemoMatching({
        countyId: formData.propertyCountyId,
        categoryIds: selectedCategories,
      });
      setContractors(results);
      setMatching(false);
      setMatched(true);
    }, 900);
  }

  function resetForm() {
    setMatched(false);
    setMatching(false);
    setContractors([]);
  }

  if (matching) {
    return (
      <PageShell surface="dark">
        <DemoTopNav />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Card className="w-full max-w-xl p-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Finding Your Referrals</h2>
            <p className="text-muted-foreground">Matching your request with vetted contractors now.</p>
          </Card>
        </div>
      </PageShell>
    );
  }

  if (matched) {
    return (
      <PageShell surface="dark">
        <DemoTopNav />
        <div className="container mx-auto max-w-5xl px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3">Your Referrals Are Ready</h1>
            <p className="text-muted-foreground">
              Here are your three vetted contractor matches. This is a demo — nothing was actually sent to{' '}
              {formData.clientEmail}.
            </p>
          </div>

          <div className="mb-6 rounded-xl border border-lw-rust/30 bg-lw-rust/10 p-4 text-sm text-zinc-200">
            These three contractors have been vetted by ListWorx and hold active IronClad Standards
            certification. Contact them directly — ListWorx does not manage scheduling or payments.
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {contractors.map((contractor, index) => (
              <Card key={contractor.id} className="p-6 flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Referral {index + 1}</div>
                    {contractor.tier && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#E8621A' }}>
                        {TIER_BADGE_LABEL[contractor.tier]}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold">{contractor.company_name}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {contractor.ironclad_accepted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-500">
                        <Shield className="h-3 w-3" /> IronClad
                      </span>
                    )}
                    {contractor.founding_partner_badge && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-500">
                        <Crown className="h-3 w-3" /> Founding Partner
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <User className="h-3 w-3" />
                    {contractor.owner_name}
                  </p>
                </div>

                <div className="space-y-2 text-sm flex-1">
                  <p className="text-muted-foreground">Trade: {contractor.trade}</p>
                  <p className="text-muted-foreground">
                    {DEMO_COUNTIES.find((c) => c.id === formData.propertyCountyId)?.name} County, {contractor.service_area_state}
                  </p>
                  <p className="text-muted-foreground">
                    ★ {contractor.rating.toFixed(1)} ({contractor.review_count} reviews)
                  </p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary" /> {contractor.phone}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground break-all">
                    <Mail className="h-4 w-4 text-primary" /> {contractor.email}
                  </div>
                </div>

                <button
                  onClick={() => setProfileModalContractor(contractor)}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-lw-rust px-3 py-2 text-sm font-medium text-white hover:bg-lw-rust-hover transition-colors"
                >
                  View Full Profile
                </button>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <Link href="/aces-demo/requestor/dashboard">
              <Button className="text-white font-semibold" style={{ backgroundColor: '#E8621A' }}>
                Go to My Dashboard
              </Button>
            </Link>
            <Button variant="outline" onClick={resetForm}>Submit Another Request</Button>
          </div>
        </div>

        <ContractorProfileModal
          contractor={profileModalContractor}
          open={!!profileModalContractor}
          onOpenChange={(open) => !open && setProfileModalContractor(null)}
        />
        <Toaster />
      </PageShell>
    );
  }

  return (
    <PageShell surface="dark">
      <DemoTopNav />
      <section className="relative overflow-hidden py-16">
        <img
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1920&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <img
              src="/Ironclad_Standards_Logo.png"
              alt=""
              className="mx-auto mb-6 h-20 md:h-24 w-auto drop-shadow-md"
              aria-hidden="true"
            />
            <h1 className="text-3xl sm:text-5xl font-bold mb-4 break-words">Request a Contractor Referral</h1>
            <p className="text-xl text-muted-foreground">
              Demo walkthrough of the ListWorx request form, pre-filled as Jessica Kane of Keller Williams Realty.
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Your Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label>I am a *</Label>
                    <Select value={formData.clientType} onValueChange={(value) => setFormData({ ...formData, clientType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Realtor">Realtor</SelectItem>
                        <SelectItem value="Property Manager">Property Manager</SelectItem>
                        <SelectItem value="Homeowner">Homeowner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Full Name *</Label>
                    <Input value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} required />
                  </div>

                  {formData.clientType !== 'Homeowner' && (
                    <div className="md:col-span-2">
                      <Label>Company Name *</Label>
                      <Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required />
                    </div>
                  )}

                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={formData.clientEmail} onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })} required />
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <Input value={formData.clientPhone} onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })} />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Property Location</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label>Property Address *</Label>
                    <Input
                      value={formData.propertyAddressLine1}
                      onChange={(e) => setFormData({ ...formData, propertyAddressLine1: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>City *</Label>
                    <Input value={formData.propertyCity} onChange={(e) => setFormData({ ...formData, propertyCity: e.target.value })} required />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Select
                      value={formData.propertyStateCode}
                      onValueChange={(value) => setFormData({ ...formData, propertyStateCode: value, propertyCountyId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEMO_STATES.map((s) => (
                          <SelectItem key={s.id} value={s.code}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>County *</Label>
                    <Select
                      value={formData.propertyCountyId}
                      onValueChange={(value) => setFormData({ ...formData, propertyCountyId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        {counties.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Zip Code</Label>
                    <Input value={formData.propertyZip} onChange={(e) => setFormData({ ...formData, propertyZip: e.target.value })} />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Job Type / Trade Needed *</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DEMO_CATEGORIES.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-white/5">
                      <Checkbox checked={selectedCategories.includes(cat.id)} onCheckedChange={() => toggleCategory(cat.id)} />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Job Details</h2>
                <div className="space-y-6">
                  <div>
                    <Label>Urgency</Label>
                    <Select value={formData.urgencyLevel} onValueChange={(value) => setFormData({ ...formData, urgencyLevel: value as typeof formData.urgencyLevel })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                        <SelectItem value="WITHIN_MONTH">Within 1 month</SelectItem>
                        <SelectItem value="WITHIN_WEEK">Within 1 week</SelectItem>
                        <SelectItem value="IMMEDIATE">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Job Description *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full">
                Request a Referral
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Demo mode — submitting runs the sample matching logic locally. No account created, no data sent anywhere.
              </p>
            </form>
          </Card>
        </div>
      </section>
      <Toaster />
    </PageShell>
  );
}
