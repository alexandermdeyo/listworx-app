'use client';

import {
  Building2,
  ShieldCheck,
  MapPin,
  FileText,
  Star,
  Upload,
  Download,
  User,
  Phone,
  Mail,
  Shield,
  CreditCard,
  Briefcase,
  ChevronRight,
  FileBadge,
  FileCheck,
  CalendarDays,
  CircleCheck as CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  ACES_PARTNER,
  DEMO_COUNTIES,
  DEMO_TESTIMONIALS,
  DEMO_LICENSE_DOC,
  DEMO_INSURANCE_DOC,
} from '@/lib/demo/acesDemoData';

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isExpiringSoonOrExpired(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  return d <= thirtyDays;
}

const DOC_STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  APPROVED: { label: 'Verified', classes: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  PENDING: { label: 'Pending Review', classes: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  REJECTED: { label: 'Needs Update', classes: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
  EXPIRED: { label: 'Expired', classes: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
};

export default function ProfileTab() {
  const { toast } = useToast();
  const profile = ACES_PARTNER;
  const counties = DEMO_COUNTIES.filter((c) => profile.service_area_counties.includes(c.id));

  function showDemoToast() {
    toast({ title: 'Demo Mode', description: 'This is a visual-only demo — no changes were saved.' });
  }

  const licenseExpiring = isExpiringSoonOrExpired(DEMO_LICENSE_DOC.expirationDate);
  const insuranceExpiring = isExpiringSoonOrExpired(DEMO_INSURANCE_DOC.expirationDate);
  const hasExpiryWarning = licenseExpiring || insuranceExpiring;

  return (
    <div className="space-y-6">
      {/* Header: name, email, status badge, IronClad badge */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="h-16 w-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-8 w-8 text-gray-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{profile.company_name}</h1>
              <p className="text-gray-500 text-sm mt-0.5 truncate">{profile.owner_name} · {profile.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-800 border-emerald-300 capitalize">
                  <CheckCircle2 className="h-3 w-3" />
                  {profile.partner_status}
                </span>
                {profile.tier && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-lw-rust/10 text-lw-rust border border-lw-rust/20 capitalize">
                    {profile.tier} Plan
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-lw-rust">
                  <ShieldCheck className="h-3 w-3" /> IronClad Verified
                </span>
              </div>
            </div>
          </div>

          <img
            src="/Ironclad_Cert_Partner_Final_Logo.png"
            alt="IronClad Certified Partner"
            className="h-16 w-auto flex-shrink-0"
          />
        </div>

        {hasExpiryWarning && (
          <div className="mt-6 rounded-xl p-4 bg-orange-50 border border-lw-rust/30">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-lw-rust flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                {licenseExpiring && (
                  <p className="text-sm font-semibold text-lw-rust">
                    ⚠️ Your License expires on {formatDate(DEMO_LICENSE_DOC.expirationDate)}. Please update it to stay active.
                  </p>
                )}
                {insuranceExpiring && (
                  <p className="text-sm font-semibold text-lw-rust">
                    ⚠️ Your Insurance expires on {formatDate(DEMO_INSURANCE_DOC.expirationDate)}. Please update it to stay active.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl p-4 bg-orange-50 border border-orange-200">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-lw-rust flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">IronClad Standards: Active ✓</p>
              <p className="text-gray-600 text-sm mt-0.5">Your IronClad status is active. You are eligible to receive referrals.</p>
              <div className="flex items-center gap-1.5 mt-2">
                <ChevronRight className="h-3.5 w-3.5 text-lw-rust flex-shrink-0" />
                <p className="text-sm font-medium text-lw-rust">Keep your profile and service areas up to date for best results.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Company Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Company Information</h3>
              <button
                onClick={showDemoToast}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                Edit Profile
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Company Name', icon: Building2, value: profile.company_name },
                  { label: 'Owner / Contact Name', icon: User, value: profile.owner_name },
                  { label: 'Phone Number', icon: Phone, value: profile.phone },
                  { label: 'License Number', icon: Shield, value: profile.license_number || '—' },
                ].map((field) => (
                  <div key={field.label}>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">{field.label}</p>
                    <div className="flex items-center gap-2">
                      <field.icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                      <p className="text-sm font-medium text-gray-900">{field.value || '—'}</p>
                    </div>
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Email Address</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <p className="text-sm text-gray-700">{profile.email}</p>
                  </div>
                </div>
              </div>

              {profile.bio && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Bio</p>
                  <p className="text-sm leading-relaxed text-gray-700">{profile.bio}</p>
                </div>
              )}

              {profile.business_description && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Business Description</p>
                  <p className="text-sm leading-relaxed text-gray-700">{profile.business_description}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {profile.website && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Business Website</p>
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-lw-rust hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}

                {profile.google_business_url && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Google Business Profile</p>
                    <a
                      href={profile.google_business_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-lw-rust hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                )}

                {profile.years_in_business > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Years in Business</p>
                    <p className="text-sm font-medium text-gray-900">{profile.years_in_business}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-gray-900">Service Areas</h3>
            <div className="flex flex-wrap gap-2">
              {counties.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  <MapPin className="h-3 w-3 text-gray-400" />
                  {c.name}, {c.state_code}
                </span>
              ))}
            </div>
          </div>

          {/* Trade Specialties */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-gray-900">Trade Specialties</h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lw-rust/20 bg-lw-rust/5 px-3 py-1 text-xs font-medium text-lw-rust">
                <Briefcase className="h-3 w-3" />
                {profile.trade}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Company Logo */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-gray-900">Company Logo</h3>
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                <Building2 className="h-10 w-10 text-gray-300" />
              </div>

              <div className="flex w-full gap-2">
                <button
                  onClick={showDemoToast}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-4 w-4" /> Replace Logo
                </button>
                <button
                  onClick={showDemoToast}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4" /> Download Logo
                </button>
              </div>

              <p className="text-center text-xs text-gray-400">PNG, JPG, WebP — max 5MB</p>
            </div>
          </div>

          {/* Account Details */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-gray-900">Account Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Partner Status</span>
                <span className="font-medium capitalize text-gray-900">{profile.partner_status}</span>
              </div>

              {profile.tier && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium capitalize text-lw-rust">{profile.tier}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Member Since</span>
                <span className="font-medium text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <button
                  onClick={showDemoToast}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  Manage Billing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance and Documents */}
      <div>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900">Compliance &amp; Documents</h2>
          <p className="text-gray-500 text-sm mt-0.5">Your license and insurance verification status</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { icon: FileBadge, label: 'Proof of License', description: 'Your current contractor license.', doc: DEMO_LICENSE_DOC },
            { icon: FileCheck, label: 'Proof of Insurance', description: 'Your Certificate of Insurance (COI).', doc: DEMO_INSURANCE_DOC },
          ].map(({ icon: Icon, label, description, doc }) => {
            const status = DOC_STATUS_CONFIG[doc.status];
            return (
              <div key={label} className="bg-white text-gray-900 rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
                <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 flex-shrink-0">
                      <Icon className="h-5 w-5 text-lw-rust" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{description}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${status.classes}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-4 flex-1 space-y-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-900 text-sm font-medium truncate" title={doc.fileName}>{doc.fileName}</p>
                  </div>

                  {doc.expirationDate && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs border bg-gray-100 border-gray-300 text-gray-700">
                      <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        Expires: <span className="font-semibold">{formatDate(doc.expirationDate)}</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-5 pb-5 flex items-center gap-2">
                  <button
                    onClick={showDemoToast}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={showDemoToast}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Replace
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews & Testimonials */}
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
