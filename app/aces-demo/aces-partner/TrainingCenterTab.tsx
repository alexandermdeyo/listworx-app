'use client';

import { GraduationCap, PlayCircle, Eye, MousePointerClick, ClipboardCheck, Percent } from 'lucide-react';
import { DEMO_ACADEMY_CATEGORIES, DEMO_ACES_TRAINING_STATS } from '@/lib/demo/acesDemoData';

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1.5">{value}</p>
        </div>
        <div className="p-2 rounded-lg bg-orange-50">
          <Icon className="h-4 w-4 text-lw-rust" />
        </div>
      </div>
    </div>
  );
}

export default function TrainingCenterTab() {
  const stats = DEMO_ACES_TRAINING_STATS;
  const licensingCategory = DEMO_ACADEMY_CATEGORIES.find((c) => c.id === 'licensing_exam_prep')!;
  const fp = licensingCategory.featuredPartner!;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
          <GraduationCap className="h-5 w-5 text-lw-rust" /> Training Center
        </h2>
        <p className="text-sm text-gray-600">
          Your courses are featured inside ListWorx Academy under Licensing and Exam Prep — visible to all active contractors.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Views This Month" value={stats.viewsThisMonth.toLocaleString()} icon={Eye} />
        <StatCard label="Click-Throughs" value={stats.clickThroughs.toLocaleString()} icon={MousePointerClick} />
        <StatCard label="Exam Registrations" value={stats.examRegistrations.toLocaleString()} icon={ClipboardCheck} />
        <StatCard label="View-to-Click Conversion" value={`${stats.conversionPercent}%`} icon={Percent} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          How this looks to contractors in ListWorx Academy
        </p>
        <div className="rounded-xl border-2 border-lw-rust bg-white shadow-sm overflow-hidden">
          <div className="bg-orange-50 px-5 py-4 border-b border-lw-rust/20 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white border border-lw-rust/30 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black text-lw-rust">{fp.name}</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-lw-rust" /> {licensingCategory.name}
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
