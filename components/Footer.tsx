import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Shield, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-lw-dark text-zinc-400">
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-4">
            <Image
              src="/Listworx_wordmark_Tag_logo.png"
              alt="ListWorx"
              width={200}
              height={60}
              className="h-14 w-auto mb-4"
            />
            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
              Connecting realtors, homeowners, and property managers with vetted,
              IronClad-certified contractors across the region.
            </p>

            <div className="mt-6 space-y-3">
              <a
                href="tel:615-362-4996"
                className="flex items-center gap-2.5 text-sm text-zinc-400 hover:text-lw-rust transition-colors"
              >
                <Phone className="h-4 w-4 text-lw-rust flex-shrink-0" />
                615-362-4996
              </a>

              <a
                href="mailto:adeyo@listworx.co"
                className="flex items-center gap-2.5 text-sm text-zinc-400 hover:text-lw-rust transition-colors"
              >
                <Mail className="h-4 w-4 text-lw-rust flex-shrink-0" />
                adeyo@listworx.co
              </a>

              <div className="flex items-start gap-2.5 text-sm text-zinc-500">
                <MapPin className="h-4 w-4 text-lw-rust flex-shrink-0 mt-0.5" />
                <span>
                  2147 Springdale Ln F104
                  <br />
                  Gallatin, TN 37066
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 md:col-start-6">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-300 mb-4">
              For Requestors
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/request" className="hover:text-lw-rust transition-colors">
                  Request a Contractor
                </Link>
              </li>
              <li>
                <Link href="/realtors" className="hover:text-lw-rust transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/requestor-dashboard" className="hover:text-lw-rust transition-colors">
                  Your Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-300 mb-4 flex items-center gap-2">
              For Contractors
              <Image
                src="/Ironclad_Cert_Partner_Final_Logo.png"
                alt="IronClad"
                width={18}
                height={18}
                className="w-4 h-4 opacity-80"
              />
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/apply" className="hover:text-lw-rust transition-colors">
                  Apply to Join
                </Link>
              </li>
              <li>
                <Link href="/contractors" className="hover:text-lw-rust transition-colors">
                  Why Partner With Us
                </Link>
              </li>
              <li>
                <Link href="/ironclad" className="hover:text-lw-rust transition-colors">
                  IronClad Standards
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-300 mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-lw-rust transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-lw-rust transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-lw-rust transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-lw-rust transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-lw-rust transition-colors">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-lw-dark-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-zinc-600">
          <p>&copy; 2026 ListWorx LLC. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <p className="text-xs text-zinc-700">Built in Gallatin, TN</p>
            <Link
              href="/login?redirect=/admin/crm"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-lw-rust transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}