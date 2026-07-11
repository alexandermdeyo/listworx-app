'use client';

import { useState } from 'react';
import {
  GraduationCap,
  Shield,
  DollarSign,
  HardHat,
  TrendingUp,
  Scale,
  ExternalLink,
} from 'lucide-react';

interface AcademyCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const COMING_SOON_CATEGORIES: AcademyCategory[] = [
  { id: 'insurance', name: 'Insurance Basics for Contractors', description: 'What every contractor needs to know about coverage minimums and claims.', icon: Shield },
  { id: 'accounting', name: 'Accounting and Bookkeeping', description: 'Track job costs, invoices, and expenses without the headache.', icon: DollarSign },
  { id: 'osha', name: 'OSHA and Jobsite Safety', description: 'Core jobsite safety training for contractors and crews.', icon: HardHat },
  { id: 'marketing', name: 'Marketing and Business Growth', description: 'Win more referrals and grow your business on ListWorx.', icon: TrendingUp },
  { id: 'legal', name: 'Legal and Contracts', description: 'Contract basics and lien rights every contractor should know.', icon: Scale },
];

function AcesLogo() {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="h-14 w-14 rounded-lg bg-white border border-lw-rust/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-black text-lw-rust">ACES</span>
      </div>
    );
  }

  return (
    <img
      src="/aces-logo.jpg"
      alt="American Contractors Exam Services"
      className="h-14 w-auto rounded-lg border border-lw-rust/30 bg-white p-1 flex-shrink-0"
      onError={() => setImageError(true)}
    />
  );
}

export default function AcademyTab() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">ListWorx Academy</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Free training built for contractors — licensing, insurance, bookkeeping, safety, marketing, and legal essentials.
        </p>
      </div>

      {/* Featured ACES card */}
      <div className="rounded-2xl border-2 border-lw-rust bg-white shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-5 py-4 border-b border-lw-rust/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <AcesLogo />
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-lw-rust" /> Licensing and Exam Prep
              </h2>
              <p className="text-xs font-bold uppercase tracking-wide text-lw-rust mt-0.5">Official Licensing Partner</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: '#E8621A' }}>
            Powered by ACES
          </span>
        </div>

        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Contractor License Prep</h3>
          <p className="text-sm text-gray-600 mb-4">Official exam prep partner for all 50 states.</p>

          <div className="grid gap-3 sm:grid-cols-3 mb-5">
            {['Contractor License Prep', 'Business Law Exam Prep', 'Exam Resources and Study Guides'].map((course) => (
              <div key={course} className="rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-semibold text-gray-900">{course}</p>
              </div>
            ))}
          </div>

          <a
            href="https://examprep.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-lw-rust px-5 py-2.5 text-sm font-semibold text-white hover:bg-lw-rust-hover transition-colors"
          >
            Visit ACES <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Coming soon categories */}
      <div className="grid gap-4 sm:grid-cols-2">
        {COMING_SOON_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.id} className="rounded-xl border border-gray-200 bg-gray-50 p-5 opacity-70">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
                  <Icon className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200 text-gray-500">Coming Soon</span>
              </div>
              <h3 className="text-sm font-bold text-gray-500">{category.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{category.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
