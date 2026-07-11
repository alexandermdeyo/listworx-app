'use client';

import { Building2, ShieldCheck, MapPin, FileText, Star, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ACES_PARTNER, DEMO_COUNTIES, DEMO_TESTIMONIALS, DEMO_LICENSE_DOC, DEMO_INSURANCE_DOC } from '@/lib/demo/acesDemoData';

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProfileTab() {
  const { toast } = useToast();
  const profile = ACES_PARTNER;
  const counties = DEMO_COUNTIES.filter((c) => profile.service_area_counties.includes(c.id));

  function showDemoToast() {
    toast({ title: 'Demo Mode', description: 'This is a visual-only demo — no file was changed.' });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="h-20 w-20 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-9 w-9 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{profile.company_name}</h2>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-lw-rust">
                <ShieldCheck className="h-3 w-3" /> IronClad Verified
              </span>
            </div>
            <p className="text-sm text-gray-500">{profile.owner_name} · Owner</p>
            <p className="text-sm text-gray-600 mt-3 max-w-2xl">{profile.bio}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Company Logo</h3>
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
            <Building2 className="h-10 w-10 text-gray-300" />
          </div>
          <div className="flex w-full gap-2 max-w-sm">
            <button
              onClick={showDemoToast}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-4 w-4" /> Replace Logo
            </button>
            <button
              onClick={showDemoToast}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" /> Download Logo
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Trade Specialties</h3>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">{profile.trade}</span>
          </div>

          <h3 className="text-sm font-bold text-gray-900 mb-3 mt-5 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-lw-rust" /> Counties Served
          </h3>
          <div className="flex flex-wrap gap-2">
            {counties.map((c) => (
              <span key={c.id} className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {c.name}, {c.state_code}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-lw-rust" /> License &amp; Insurance
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">State License</span>
              <span className="font-semibold text-emerald-700">
                Verified{DEMO_LICENSE_DOC.expirationDate && ` · Exp. ${formatDate(DEMO_LICENSE_DOC.expirationDate)}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">General Liability Insurance</span>
              <span className="font-semibold text-emerald-700">
                Verified{DEMO_INSURANCE_DOC.expirationDate && ` · Exp. ${formatDate(DEMO_INSURANCE_DOC.expirationDate)}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Years in Business</span>
              <span className="font-semibold text-gray-900">{profile.years_in_business}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Response Time</span>
              <span className="font-semibold text-gray-900">{profile.response_time}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Reviews &amp; Testimonials</h3>
        <div className="space-y-4">
          {DEMO_TESTIMONIALS.map((t) => (
            <div key={t.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
              <div className="flex items-center gap-1 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? 'text-lw-rust fill-lw-rust' : 'text-gray-200'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-700 italic">&ldquo;{t.quote}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-1">{t.authorName} — {t.authorRole}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
