'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { PageShell } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, Send } from 'lucide-react';
import { Reveal } from '@/components/motion';

const fieldClass =
  'w-full !border-mailer-border !bg-mailer-surface !text-white placeholder:!text-white/35 focus-visible:!bg-mailer-surface focus-visible:!text-white';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <PageShell surface="marketing" className="!bg-mailer-black !text-white">
      <Navigation variant="light" />

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-mailer-black">
        <div className="h-1 w-full bg-lw-rust" />
        <div className="container relative mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
          <Reveal>
            <p className="lw-label-lg mb-3">Contact</p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
              Get in touch with ListWorx.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/65">
              Questions about the network, your account, or a referral? Send a note and we&apos;ll
              get back to you within one business day.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ================= FORM + INFO ================= */}
      <section className="bg-mailer-ink py-16 md:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-12 md:grid-cols-2">
            <Reveal>
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                Send us a message
              </h2>

              {submitStatus === 'success' && (
                <div className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                  <p className="font-semibold text-green-400">
                    Thanks — your message is in. We&apos;ll be in touch soon.
                  </p>
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <p className="font-semibold text-red-400">
                    Something went wrong. Try again, or email us directly.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-white/80">
                    Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
                    Email *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-white/80">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(615) 555-0123"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-medium text-white/80">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    rows={6}
                    className={fieldClass}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full bg-lw-rust text-white hover:bg-lw-rust-hover"
                >
                  {isSubmitting ? 'Sending...' : 'Send message'}
                  <Send className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </Reveal>

            <Reveal delay={80} className="space-y-6">
              <div className="rounded-2xl border border-mailer-border bg-mailer-card p-8">
                <h2 className="text-2xl font-bold tracking-tight text-white">Reach us directly</h2>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-white/10 p-3">
                      <Phone className="h-6 w-6 text-lw-rust" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">Phone</h3>
                      <a
                        href="tel:615-362-4996"
                        className="text-white/80 transition-colors hover:text-lw-rust hover:underline"
                      >
                        615-362-4996
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-white/10 p-3">
                      <Mail className="h-6 w-6 text-lw-rust" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-white">Email</h3>
                      <a
                        href="mailto:adeyo@listworx.co"
                        className="text-white/80 transition-colors hover:text-lw-rust hover:underline"
                      >
                        adeyo@listworx.co
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-mailer-border bg-mailer-card p-6">
                <h3 className="mb-3 font-semibold text-white">Office hours</h3>
                <div className="space-y-2 text-sm text-white/65">
                  <div className="flex justify-between">
                    <span>Monday – Friday</span>
                    <span className="font-medium text-white">9:00 AM – 5:00 PM CST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday – Sunday</span>
                    <span className="font-medium text-white">Closed</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
