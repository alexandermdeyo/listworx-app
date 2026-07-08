'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader as Loader2, Phone, Mail, Globe, User, Shield, Crown, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import Navigation from '@/components/Navigation';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PageShell } from '@/components/design-system';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StateItem {
  id: string;
  code: string;
  name: string;
}

interface CountyItem {
  id: string;
  name: string;
  state_code: string;
}

interface CategoryItem {
  id: string;
  name: string;
}

interface Contractor {
  id: string;
  company_name: string;
  owner_name: string;
  email: string;
  phone: string;
  website: string | null;
  bio?: string | null;
  trade?: string | null;
  years_in_business?: number | null;
  response_time?: string | null;
  ironclad_accepted?: boolean | null;
  founder_status?: boolean | null;
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (!digits) return '';
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatZipCode(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeClientType(role: string | null | undefined) {
  const normalized = String(role || '').toUpperCase();

  if (normalized === 'REALTOR') return 'Realtor';
  if (normalized === 'PROPERTY_MANAGER') return 'Property Manager';
  return 'Homeowner';
}

export default function RequestPage() {
  const router = useRouter();
  const supabase = createClient();

  const [authReady, setAuthReady] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matched, setMatched] = useState(false);

  const [states, setStates] = useState<StateItem[]>([]);
  const [counties, setCounties] = useState<CountyItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clientType: 'Homeowner',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    companyName: '',
    propertyAddressLine1: '',
    propertyCity: '',
    propertyStateCode: '',
    propertyCountyId: '',
    propertyZip: '',
    urgencyLevel: 'Standard',
    description: '',
  });

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/signup?redirect=/request');
        return;
      }

      const user = session.user;

      const { data: appUser, error: appUserError } = await supabase
        .from('users')
        .select('role, name, email')
        .eq('id', user.id)
        .maybeSingle();

      if (appUserError) {
        console.error('[request] app user lookup failed:', appUserError);
      }

      const role = String(appUser?.role || '').toUpperCase();

      if (role === 'CONTRACTOR') {
        router.push('/contractor-dashboard');
        return;
      }

      if (role === 'ADMIN') {
        router.push('/admin/crm');
        return;
      }

      if (role === 'REALTOR' || role === 'HOMEOWNER' || role === 'PROPERTY_MANAGER') {
        setDashboardUrl('/requestor-dashboard');
      }

      const { data: requestorProfile, error: requestorProfileError } = await supabase
        .from('requestor_profiles')
        .select('id, company_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (requestorProfileError) {
        console.error('[request] requestor profile lookup failed:', requestorProfileError);
      }

      setFormData((prev) => ({
        ...prev,
        clientType: normalizeClientType(appUser?.role),
        clientName: appUser?.name || '',
        clientEmail: appUser?.email || user.email || '',
        companyName: requestorProfile?.company_name || '',
      }));

      setAuthReady(true);
    };

    loadUser();
  }, [router, supabase]);

  useEffect(() => {
    if (authReady) {
      fetch('/api/states')
        .then((r) => r.json())
        .then((data) => setStates(Array.isArray(data) ? data : []))
        .catch(() => setStates([]));
    }
  }, [authReady]);

  useEffect(() => {
    if (!formData.propertyStateCode) {
      setCounties([]);
      return;
    }

    fetch(`/api/counties?state_code=${encodeURIComponent(formData.propertyStateCode)}`)
      .then((r) => r.json())
      .then((data) => setCounties(Array.isArray(data) ? data : []))
      .catch(() => setCounties([]));
  }, [formData.propertyStateCode]);

  useEffect(() => {
    if (!formData.propertyCountyId) {
      setCategories([]);
      setSelectedCategories([]);
      return;
    }

    fetch(
      `/api/available-trades?countyId=${encodeURIComponent(
        formData.propertyCountyId
      )}&stateCode=${encodeURIComponent(formData.propertyStateCode)}`
    )
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data?.categories) ? data.categories : []))
      .catch(() => setCategories([]));
  }, [formData.propertyCountyId, formData.propertyStateCode]);

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setMatched(false);
    setMatching(false);
    setSelectedCategories([]);
    setContractors([]);
    setRequestId(null);
    setFormData((prev) => ({
      ...prev,
      clientPhone: '',
      propertyAddressLine1: '',
      propertyCity: '',
      propertyStateCode: '',
      propertyCountyId: '',
      propertyZip: '',
      urgencyLevel: 'Standard',
      description: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCategories.length === 0) {
      alert('Please select at least one service.');
      return;
    }

    setLoading(true);
    setMatching(true);

    try {
      const createResponse = await fetch('/api/job-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, categoryIds: selectedCategories }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createData?.error || 'Failed to create request.');
      }

      const jobRequestId = createData?.jobRequestId;
      if (!jobRequestId) throw new Error('No request ID returned.');

      setRequestId(jobRequestId);

      const matchedContractors = Array.isArray(createData?.contractors)
        ? createData.contractors
        : [];

      setContractors(matchedContractors);
      setMatched(true);
      setMatching(false);

      if (matchedContractors.length > 0) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
      }
    } catch (err: any) {
      setMatching(false);
      alert(err.message || 'Job request saved, but matched contractors failed to load.');
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <PageShell surface="dark" className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </PageShell>
    );
  }

  if (matching) {
    return (
      <PageShell surface="dark">
        <Navigation />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Card className="w-full max-w-xl p-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Finding Your Referrals</h2>
            <p className="text-muted-foreground">
              Matching your request with vetted contractors now.
            </p>
          </Card>
        </div>
      </PageShell>
    );
  }

  if (matched) {
    return (
      <PageShell surface="dark">
        <Navigation />
        <div className="container mx-auto max-w-5xl px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-3">
              {contractors.length > 0 ? 'Your Referrals Are Ready' : 'Request Received'}
            </h1>
            <p className="text-muted-foreground">
              {contractors.length > 0
                ? `Here are your three vetted contractor matches. We've also sent this information to ${formData.clientEmail}, and you can find it anytime in your dashboard. Questions? Contact us at support@listworx.co.`
                : 'Your request was saved successfully, but no active contractors matched yet.'}
            </p>
          </div>

          {contractors.length > 0 ? (
            <>
              <div className="mb-6 rounded-xl border border-lw-rust/30 bg-lw-rust/10 p-4 text-sm text-zinc-200">These three contractors have been vetted by ListWorx and hold active IronClad Standards certification. Contact them directly — ListWorx does not manage scheduling or payments.</div>
              <div className="grid md:grid-cols-3 gap-6 mb-6">
              {contractors.map((contractor, index) => (
                <Card key={contractor.id} className="p-6">
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                      Referral {index + 1}
                    </div>
                    <h3 className="text-xl font-bold">{contractor.company_name}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {contractor.ironclad_accepted !== false && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-500">
                          <Shield className="h-3 w-3" /> IronClad
                        </span>
                      )}
                      {contractor.founder_status && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-500">
                          <Crown className="h-3 w-3" /> Founding Partner
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {contractor.owner_name}
                    </p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">Trade: {contractor.trade || 'Home service'}</p>
                    <p className="text-muted-foreground">Years in business: {contractor.years_in_business ?? 'Available on request'}</p>
                    <p className="text-muted-foreground">Response time: {contractor.response_time || 'Typically within 24 hours'}</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <a href={`tel:${contractor.phone}`} className="hover:text-primary">
                        {contractor.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <a href={`mailto:${contractor.email}`} className="hover:text-primary break-all">
                        {contractor.email}
                      </a>
                    </div>
                    {contractor.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <a
                          href={
                            contractor.website.startsWith('http')
                              ? contractor.website
                              : `https://${contractor.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary break-all"
                        >
                          {contractor.website}
                        </a>
                      </div>
                    )}
                    {contractor.bio && (
                      <p className="text-muted-foreground pt-2">{contractor.bio}</p>
                    )}
                    <a
                      href={`/contractors/${contractor.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-md bg-lw-rust px-3 py-2 text-sm font-medium text-white hover:bg-lw-rust-hover"
                    >
                      View Full Profile
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </div>
                </Card>
              ))}
              </div>
              <p className="mb-10 text-center text-sm text-zinc-400">Didn&apos;t hear back within 24 hours? Let us know at support@listworx.co and we&apos;ll follow up with the contractor on your behalf.</p>
            </>
          ) : (
            <Card className="p-8 text-center mb-10">
              <p className="text-muted-foreground">
                No contractors matched yet. Your request is still saved in your dashboard.
              </p>
            </Card>
          )}

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push('/requestor-dashboard')}>
              View My Requests
            </Button>
            <Button onClick={resetForm}>Submit Another Request</Button>
          </div>

          {requestId && (
            <p className="text-center text-xs text-muted-foreground mt-6">
              Request ID: {requestId}
            </p>
          )}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell surface="dark">
      <Navigation />
      {dashboardUrl && (
        <div className="w-full bg-zinc-900 border-l-4 border-lw-rust px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-zinc-300">
            You are already logged in. Want to go to your dashboard instead?
          </p>
          <Link
            href={dashboardUrl}
            className="text-sm font-semibold text-lw-rust hover:text-lw-rust-hover whitespace-nowrap ml-4"
          >
            Go to Dashboard →
          </Link>
        </div>
      )}
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
            Submit your job details below. We&apos;ll return exactly three vetted, IronClad-certified contractors in your area — instantly, in under 30 seconds. No account required.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>I am a *</Label>
                  <Select
                    value={formData.clientType}
                    onValueChange={(value) => setFormData({ ...formData, clientType: value })}
                  >
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
                  <Input
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    required
                  />
                </div>

                {formData.clientType !== 'Homeowner' && (
                  <div className="md:col-span-2">
                    <Label>Company Name *</Label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.clientPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, clientPhone: formatPhoneNumber(e.target.value) })
                    }
                    placeholder="(615) 555-1234"
                  />
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
                    onChange={(e) =>
                      setFormData({ ...formData, propertyAddressLine1: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label>City *</Label>
                  <Input
                    value={formData.propertyCity}
                    onChange={(e) => setFormData({ ...formData, propertyCity: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>State *</Label>
                  <Select
                    value={formData.propertyStateCode}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        propertyStateCode: value,
                        propertyCountyId: '',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>County *</Label>
                  <Select
                    value={formData.propertyCountyId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, propertyCountyId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {counties.map((county) => (
                        <SelectItem key={county.id} value={county.id}>
                          {county.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Zip Code *</Label>
                  <Input
                    value={formData.propertyZip}
                    onChange={(e) =>
                      setFormData({ ...formData, propertyZip: formatZipCode(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Job Type / Trade Needed *</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2">
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => handleCategoryToggle(category.id)}
                    />
                    <label htmlFor={category.id} className="text-sm cursor-pointer">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Job Details</h2>
              <div className="space-y-6">
                <div>
                  <Label>Urgency *</Label>
                  <Select
                    value={formData.urgencyLevel}
                    onValueChange={(value) => setFormData({ ...formData, urgencyLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flexible">Flexible</SelectItem>
                      <SelectItem value="Urgent">Within 1 week</SelectItem>
                      <SelectItem value="ASAP">Within 48 hours</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Job Description *</Label>
                  <Textarea
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.push('/')}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedCategories.length === 0}
                className="bg-lw-rust hover:bg-lw-rust-hover text-white"
              >
                {loading ? 'Submitting...' : 'Request a Referral'}
              </Button>
            </div>
          </form>
        </Card>
        </div>
      </section>
    </PageShell>
  );
}