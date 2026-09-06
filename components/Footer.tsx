'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Linkedin, Mail, Phone, Youtube, Music2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Public marketing routes get the light theme; everything else (dashboards, admin,
// auth, the ACES demo, token-gated feedback) keeps the existing dark footer.
const MARKETING_EXACT_PATHS = new Set([
  '/',
  '/about',
  '/academy',
  '/apply',
  '/become-a-supplier-partner',
  '/become-a-brokerage-partner',
  '/blog',
  '/contact',
  '/contractors',
  '/faq',
  '/founding-partner',
  '/ironclad',
  '/pricing',
  '/privacy',
  '/realtors',
  '/terms',
  '/media',
  '/request',
]);
const MARKETING_PREFIXES = [
  '/blog/',
  '/contractors/',
  '/contractor/',
  '/partners/aces',
  '/listing-studio',
];

function isMarketingPath(pathname: string) {
  if (MARKETING_EXACT_PATHS.has(pathname)) return true;
  return MARKETING_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

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
  const pathname = usePathname();
  const light = isMarketingPath(pathname || '');
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
    <footer className={cn(light ? 'bg-white text-mkt-ink/80' : 'bg-lw-dark text-zinc-400')}>
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-4">
            <Link href="/" className="mb-4 flex items-center" aria-label="ListWorx home">
              <img
                src="/Listworx_wordmark_logo.png"
                alt="ListWorx"
                className="h-8 w-auto"
              />
            </Link>
            <p className={cn('text-sm leading-relaxed max-w-xs', light ? 'text-mkt-ink/70' : 'text-zinc-500')}>{tagline}</p>

            <div className="mt-6 space-y-3">
              {phone && (
                <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className={cn('flex items-center gap-2.5 text-sm hover:text-lw-rust transition-colors', light ? 'text-mkt-ink/80' : 'text-zinc-400')}>
                  <Phone className="h-4 w-4 text-lw-rust flex-shrink-0" />
                  {phone}
                </a>
              )}

              {supportEmail && (
                <a href={`mailto:${supportEmail}`} className={cn('flex items-center gap-2.5 text-sm hover:text-lw-rust transition-colors', light ? 'text-mkt-ink/80' : 'text-zinc-400')}>
                  <Mail className="h-4 w-4 text-lw-rust flex-shrink-0" />
                  {supportEmail}
                </a>
              )}
            </div>

            {visibleSocials.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-3">
                {visibleSocials.map(item => {
                  const Icon = item.icon;
                  return (
                    <a key={item.key} href={item.url} target="_blank" rel="noreferrer" aria-label={item.label} className={cn('flex h-9 w-9 items-center justify-center rounded-full border hover:border-lw-rust hover:text-lw-rust transition-colors', light ? 'border-zinc-200 text-mkt-ink/70' : 'border-lw-dark-border text-zinc-400')}>
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-2 md:col-start-5">
            <h4 className={cn('text-xs font-semibold uppercase tracking-widest mb-4', light ? 'text-mkt-ink' : 'text-zinc-300')}>For Homeowners</h4>
            <ul className="space-y-2.5 text-sm"><li><Link href="/request" className="hover:text-lw-rust transition-colors">Request a Contractor</Link></li><li><Link href="/#how-it-works" className="hover:text-lw-rust transition-colors">How It Works</Link></li><li><Link href="/realtors" className="hover:text-lw-rust transition-colors">For Realtors</Link></li><li><Link href="/requestor-dashboard" className="hover:text-lw-rust transition-colors">Your Dashboard</Link></li></ul>
          </div>

          <div className="md:col-span-2">
            <h4 className={cn('text-xs font-semibold uppercase tracking-widest mb-4 flex items-center gap-2', light ? 'text-mkt-ink' : 'text-zinc-300')}>For Contractors<Image src="/Ironclad_Cert_Partner_Final_Logo.png" alt="IronClad" width={18} height={18} className="w-4 h-4 opacity-80" /></h4>
            <ul className="space-y-2.5 text-sm"><li><Link href="/apply" className="hover:text-lw-rust transition-colors">Apply to Join</Link></li><li><Link href="/contractors" className="hover:text-lw-rust transition-colors">Why Partner With Us</Link></li><li><Link href="/ironclad" className="hover:text-lw-rust transition-colors">IronClad Standards</Link></li></ul>
          </div>

          <div className="md:col-span-2">
            <h4 className={cn('text-xs font-semibold uppercase tracking-widest mb-4', light ? 'text-mkt-ink' : 'text-zinc-300')}>Company</h4>
            <ul className="space-y-2.5 text-sm"><li><Link href="/about" className="hover:text-lw-rust transition-colors">About Us</Link></li><li><Link href="/contact" className="hover:text-lw-rust transition-colors">Contact</Link></li><li><Link href="/faq" className="hover:text-lw-rust transition-colors">FAQ</Link></li><li><Link href="/privacy" className="hover:text-lw-rust transition-colors">Privacy Policy</Link></li><li><Link href="/terms" className="hover:text-lw-rust transition-colors">Terms of Service</Link></li><li><Link href="/login" className="hover:text-lw-rust transition-colors">Login</Link></li></ul>
          </div>

          <div className="md:col-span-2">
            <h4 className={cn('text-xs font-semibold uppercase tracking-widest mb-4', light ? 'text-mkt-ink' : 'text-zinc-300')}>Partner With Us</h4>
            <ul className="space-y-2.5 text-sm"><li><Link href="/become-a-supplier-partner" className="hover:text-lw-rust transition-colors">Supplier Partners</Link></li><li><Link href="/become-a-brokerage-partner" className="hover:text-lw-rust transition-colors">Brokerage Partners</Link></li></ul>
          </div>
        </div>

        <div className={cn('border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm', light ? 'border-zinc-200 text-mkt-ink/60' : 'border-lw-dark-border text-zinc-600')}>
          <p>&copy; 2026 ListWorx LLC. All rights reserved.</p>
          <div className="flex items-center gap-4"><p className={cn('text-xs', light ? 'text-mkt-ink/50' : 'text-zinc-700')}>Built in Gallatin, TN</p><Link href="/login?redirect=/admin/crm" className={cn('inline-flex items-center gap-1.5 text-xs hover:text-lw-rust transition-colors', light ? 'text-mkt-ink/50' : 'text-zinc-600')}><Lock className="h-3.5 w-3.5" />Admin Login</Link></div>
        </div>
      </div>
    </footer>
  );
}
