'use client';

import { useState } from 'react';
import { GraduationCap, Shield, DollarSign, HardHat, TrendingUp, Scale, PlayCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEMO_ACADEMY_CATEGORIES, DEMO_ACADEMY_PROGRESS_PERCENT } from '@/lib/demo/acesDemoData';

function ProgressBar({ value }: { value: number }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
      <div className="h-full rounded-full bg-lw-rust transition-all" style={{ width: `${bounded}%` }} />
    </div>
  );
}

function AcesLogo() {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="h-10 w-10 rounded-lg bg-white border border-lw-rust/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-black text-lw-rust">ACES</span>
      </div>
    );
  }

  return (
    <img
      src="/aces-logo.jpg"
      alt="American Contractors Exam Services"
      className="h-10 w-auto rounded-lg border border-lw-rust/30 bg-white p-1 flex-shrink-0"
      onError={() => setImageError(true)}
    />
  );
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  licensing_exam_prep: GraduationCap,
  insurance: Shield,
  accounting_bookkeeping: DollarSign,
  osha_safety: HardHat,
  marketing_growth: TrendingUp,
  legal_contracts: Scale,
};

export default function AcademyTab() {
  const { toast } = useToast();

  function showDemoToast() {
    toast({ title: 'Demo Mode', description: 'Course content is illustrative only in this demo.' });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-lw-rust" /> ListWorx Academy
          </h2>
          <span className="text-sm font-bold text-lw-rust">{DEMO_ACADEMY_PROGRESS_PERCENT}% complete</span>
        </div>
        <ProgressBar value={DEMO_ACADEMY_PROGRESS_PERCENT} />
        <p className="text-sm text-gray-500 mt-2">
          Free training built for contractors — licensing, insurance, bookkeeping, safety, marketing, and legal essentials.
        </p>
      </div>

      {DEMO_ACADEMY_CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category.id] || GraduationCap;

        if (category.featuredPartner) {
          const fp = category.featuredPartner;
          return (
            <div key={category.id} className="rounded-xl border-2 border-lw-rust bg-white shadow-sm overflow-hidden">
              <div className="bg-orange-50 px-5 py-4 border-b border-lw-rust/20 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <AcesLogo />
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-lw-rust" /> {category.name}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-wide text-lw-rust mt-0.5">{fp.label}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: '#E8621A' }}>
                  {fp.poweredByBadge}
                </span>
              </div>

              <div className="p-5 grid gap-4 sm:grid-cols-3">
                {fp.courses.map((course) => (
                  <div key={course.id} className="rounded-lg border border-gray-200 p-4 flex flex-col">
                    <PlayCircle className="h-5 w-5 text-lw-rust mb-2" />
                    <h4 className="text-sm font-bold text-gray-900 mb-1">{course.title}</h4>
                    <p className="text-xs text-gray-500 flex-1">{course.description}</p>
                    <button
                      onClick={showDemoToast}
                      className="mt-3 text-xs font-semibold text-lw-rust inline-flex items-center gap-1 hover:underline"
                    >
                      Start course <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <a
                  href="https://examprep.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full sm:w-auto text-center rounded-lg bg-lw-rust px-5 py-2.5 text-sm font-semibold text-white hover:bg-lw-rust-hover transition-colors"
                >
                  Learn More About ACES
                </a>
              </div>
            </div>
          );
        }

        return (
          <div key={category.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4 text-lw-rust" /> {category.name}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {category.courses.map((course) => (
                <div key={course.id} className="rounded-lg border border-gray-200 p-3.5 flex flex-col">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">{course.title}</h4>
                  <p className="text-xs text-gray-500 flex-1">{course.description}</p>
                  <button onClick={showDemoToast} className="mt-2 text-xs font-semibold text-lw-rust text-left hover:underline">
                    Start course →
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
