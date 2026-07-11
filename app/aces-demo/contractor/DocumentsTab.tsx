'use client';

import { FileBadge, FileCheck, FileText, Eye, Globe, Lock, CircleCheck as CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DEMO_LICENSE_DOC,
  DEMO_INSURANCE_DOC,
  DEMO_ADDITIONAL_DOCUMENTS,
  type DemoAdditionalDocType,
} from '@/lib/demo/acesDemoData';

const ADDITIONAL_TYPE_LABELS: Record<DemoAdditionalDocType, string> = {
  CERTIFICATION: 'Certification',
  AWARD: 'Award',
  OTHER: 'Other',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DocumentsTab() {
  const { toast } = useToast();

  function showDemoToast() {
    toast({ title: 'Demo Mode', description: 'This is a visual-only demo — no file was opened or changed.' });
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Application Documents (read-only) */}
      <section>
        <h2 className="text-xl font-bold text-gray-900">Application Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5 mb-5">
          Documents submitted with the original application.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {(
            [
              { key: 'license', label: 'License', icon: FileBadge, doc: DEMO_LICENSE_DOC },
              { key: 'insurance', label: 'Insurance', icon: FileCheck, doc: DEMO_INSURANCE_DOC },
            ] as const
          ).map(({ key, label: typeLabel, icon: Icon, doc }) => (
            <div key={key} className="bg-white text-gray-900 rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
              <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 flex-shrink-0">
                    <Icon className="h-5 w-5 text-lw-rust" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900">{typeLabel}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 border-emerald-200 text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Approved
                  </span>
                </div>
              </div>

              <div className="px-5 py-4 flex-1 space-y-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-gray-900 truncate" title={doc.fileName}>{doc.fileName}</p>
                </div>
                {doc.expirationDate && (
                  <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600">
                    Expires: <span className="font-semibold">{formatDate(doc.expirationDate)}</span>
                  </div>
                )}
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={showDemoToast}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Additional Documents */}
      <section>
        <h2 className="text-xl font-bold text-gray-900">Additional Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5 mb-5">
          Certifications, awards, and other credentials on record.
        </p>

        <div className="space-y-3">
          {DEMO_ADDITIONAL_DOCUMENTS.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700 flex-shrink-0">
                    {ADDITIONAL_TYPE_LABELS[doc.type]}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.label}</p>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border bg-orange-50 border-orange-200 text-lw-rust">
                  {doc.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {doc.isPublic ? 'Public' : 'Private'}
                </span>
                <button
                  onClick={showDemoToast}
                  className="text-xs font-semibold border border-gray-300 rounded-lg h-7 px-3 hover:bg-gray-50 transition-colors"
                >
                  View
                </button>
                <button
                  onClick={showDemoToast}
                  className="text-xs font-semibold border border-gray-300 rounded-lg h-7 px-3 hover:bg-gray-50 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={showDemoToast}
                  className="text-xs font-semibold border border-red-200 text-red-600 rounded-lg h-7 px-3 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
