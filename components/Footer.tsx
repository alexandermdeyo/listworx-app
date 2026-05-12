'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube, Music2, Lock } from 'lucide-react';

const socials = [
  { key: 'company_facebook_url', label: 'Facebook', icon: Facebook },
  { key: 'company_instagram_url', label: 'Instagram', icon: Instagram },
  { key: 'company_tiktok_url', label: 'TikTok', icon: Music2 },
  { key: 'company_linkedin_url', label: 'LinkedIn', icon: Linkedin },
  { key: 'company_youtube_url', label: 'YouTube', icon: Youtube },
];

type PublicContent = Record<string, { value: string | null; is_visible: boolean | null }>;

function getContent(content: PublicContent, key: string, fallback = '') {
  return content[key]?.value ?? fallback;
}

export default function Footer() {
  const [content, setContent] = useState({} as PublicContent);

  useEffect(() => {
    fetch('/api/site-content?page=global')
      .then(res => res.json())
      .then(data => setContent(data || {}))
      .catch((_e) => {});
  }, []);

  const supportEmail = getContent(content, 'company_support_email', 'support@listworx.co');
  const phone = getContent(content, 'company_phone', '');
  const tagline = getContent(content, 'footer_tagline', 'The contractor network built on trust, not transactions.');
  const visibleSocials = socials
    .map(item => ({ ...item, url: getContent(content, item.key, '').trim() }))
    .filter(item => item.url.length > 0);

  return (
    <footer className="bg-lw-dark text-zinc-400">
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-4">
            <Image src="/Listworx_wordmark_Tag_logo.png" alt="ListWorx" width={200} height={60} className="h-14 w-auto mb-4" />
            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">{tagline}</p>

            <div className="mt-6 space-y-3">
              {phone && (
                <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="flex items-center gap-2.5 text-sm text-zinc-400 hover:text-lw-rust transition-colors">
                  <Phone className="h-4 w-4 text-lw-rust flex-shrink-0" />
                  {phone}
                </a>
              )}

              {supportEmail && (
                <a href={`mailto:${supportEmail}`} className="flex items-center gap-2.5 text-sm text-zinc-400 hover:text-lw-rust transition-colors">
                  <Mail className="h-4 w-4 text-lw-rust flex-shrink-0" />
                  {supportEmail}
                </a>
              )}

              <div className="flex items-start gap-2.5 text-sm text-zinc-500">
                <MapPin className="h-4 w-4 text-lw-rust flex-shrink-0 mt-0.5" />
                <span>2147 Springdale Ln F104<br />Gallatin, TN 37066</span>
              </div>
            </div>

            {visibleSocials.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {visibleSocials.map(item => {
                  const Icon = item.icon;
                  return (
                    <a key={item.key} href={item.url} target="_blank" rel="noreferrer" aria-label={item.label} className="flex h-9 w-9 items-center justify-center rounded-full border border-lw-dark-border text-zinc-400 hover:border-lw-rust hover:text-lw-rust transition-colors">
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-2 md:col-start-6">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-300 mb-4">For Requestors</h4>
            <ul className="space-y-2.5 text-sm"><li><Link href="/request" className="hover:text-lw-rust transition-colors">Request a Contractor</Link></li><li><Link href="/realtors" className="hover:text-lw-rust transition-colors">How It Works</Link></li><li><Link href="/requestor-dashboard" className="hover:text-lw-rust transition-colors">Your Dashboard</Link></li></ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-300 mb-4 flex items-center gap-2">For Contractors<Image src="/Ironclad_Cert_Partner_Final_Logo.png" alt="IronClad" width={18} height={18} className="w-4 h-4 opacity-80" /></h4>
            <ul className="space-y-2.5 text-sm"><li><Link href="/apply" className="hover:text-lw-rust transition-colors">Apply to Join</Link></li><li><Link href="/contractors" className="hover:text-lw-rust transition-colors">Why Partner With Us</Link></li><li><Link href="/ironclad" className="hover:text-lw-rust transition-colors">IronClad Standards</Link></li></ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-300 mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm"><li><Link href="/about" className="hover:text-lw-rust transition-colors">About Us</Link></li><li><Link href="/contact" className="hover:text-lw-rust transition-colors">Contact</Link></li><li><Link href="/privacy" className="hover:text-lw-rust transition-colors">Privacy Policy</Link></li><li><Link href="/terms" className="hover:text-lw-rust transition-colors">Terms of Service</Link></li><li><Link href="/login" className="hover:text-lw-rust transition-colors">Login</Link></li></ul>
          </div>
        </div>

        <div className="border-t border-lw-dark-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-zinc-600">
          <p>&copy; 2026 ListWorx LLC. All rights reserved.</p>
          <div className="flex items-center gap-4"><p className="text-xs text-zinc-700">Built in Gallatin, TN</p><Link href="/login?redirect=/admin/crm" className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-lw-rust transition-colors"><Lock className="h-3.5 w-3.5" />Admin Login</Link></div>
        </div>
      </div>
    </footer>
  );
}
