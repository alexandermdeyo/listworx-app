'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

type Kind = 'supplier' | 'brokerage';

const COPY: Record<Kind, { orgLabel: string; orgPlaceholder: string; detailsLabel: string; detailsPlaceholder: string }> = {
  supplier: {
    orgLabel: 'Company name',
    orgPlaceholder: 'e.g. Gallatin Building Supply',
    detailsLabel: 'Tell us about your business',
    detailsPlaceholder: 'What you sell, where you’re located, who your customers are…',
  },
  brokerage: {
    orgLabel: 'Brokerage name',
    orgPlaceholder: 'e.g. Cumberland Realty Group',
    detailsLabel: 'Which market do you serve?',
    detailsPlaceholder: 'Counties, cities, or regions your brokerage covers…',
  },
};

export default function PartnerInquiryForm({ kind }: { kind: Kind }) {
  const c = COPY[kind];
  const [form, setForm] = useState({ org_name: '', contact_name: '', email: '', phone: '', details: '' });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/partner-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, ...form }),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ org_name: '', contact_name: '', email: '', phone: '', details: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-lw-rust/30 bg-lw-rust/[0.06] p-8 text-center">
        <p className="text-lg font-bold text-mkt-ink">Thanks — we&apos;ve got it.</p>
        <p className="mt-2 text-mkt-ink/70">
          We&apos;ll review your details and reach out within a couple of business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {status === 'error' && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700">
          Something went wrong. Try again, or email us at adeyo@listworx.co.
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="org_name" className="mb-1.5 block text-sm font-medium text-mkt-ink">
            {c.orgLabel} *
          </label>
          <Input id="org_name" required value={form.org_name} onChange={set('org_name')} placeholder={c.orgPlaceholder} />
        </div>
        <div>
          <label htmlFor="contact_name" className="mb-1.5 block text-sm font-medium text-mkt-ink">
            Contact name *
          </label>
          <Input id="contact_name" required value={form.contact_name} onChange={set('contact_name')} placeholder="Your full name" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-mkt-ink">
            Email *
          </label>
          <Input id="email" type="email" required value={form.email} onChange={set('email')} placeholder="you@company.com" />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-mkt-ink">
            Phone
          </label>
          <Input id="phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="(615) 555-0123" />
        </div>
      </div>

      <div>
        <label htmlFor="details" className="mb-1.5 block text-sm font-medium text-mkt-ink">
          {c.detailsLabel} *
        </label>
        <Textarea id="details" required rows={4} value={form.details} onChange={set('details')} placeholder={c.detailsPlaceholder} />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="w-full bg-lw-rust text-white hover:bg-lw-rust-hover sm:w-auto"
      >
        {submitting ? 'Sending…' : 'Send inquiry'}
        <Send className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
