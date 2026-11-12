'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Upload,
  Download,
  RefreshCw,
  CircleCheck as CheckCircle2,
  Clock,
  Circle as XCircle,
  CircleAlert as AlertCircle,
  Shield,
  Eye,
  Loader as Loader2,
  FileBadge,
  FileCheck,
  CalendarDays,
} from 'lucide-react';
import { centralToday, daysUntil, warningTone } from '@/lib/compliance/rules';

const DOCUMENT_TYPES = {
  LICENSE: 'LICENSE',
  INSURANCE: 'INSURANCE',
} as const;

type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];
type DocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | null;

interface ContractorDocument {
  id: string;
  contractor_id: string;
  document_type: DocumentType;
  document_url: string;
  expiration_date: string | null;
  status: DocumentStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  file_name: string | null;
  storage_path?: string | null;
  replaces_document_id?: string | null;
}

interface ComplianceDocumentsProps {
  contractorId: string;
  userId: string;
  licenseExpirationDate?: string | null;
  insuranceExpirationDate?: string | null;
}

const DOC_TYPES: {
  type: DocumentType;
  label: string;
  description: string;
  icon: React.ElementType;
  expirationKey: 'licenseExpirationDate' | 'insuranceExpirationDate';
}[] = [
  {
    type: DOCUMENT_TYPES.LICENSE,
    label: 'Proof of License',
    description: 'Upload a copy of your current contractor license.',
    icon: FileBadge,
    expirationKey: 'licenseExpirationDate',
  },
  {
    type: DOCUMENT_TYPES.INSURANCE,
    label: 'Proof of Insurance',
    description: 'Upload your Certificate of Insurance (COI).',
    icon: FileCheck,
    expirationKey: 'insuranceExpirationDate',
  },
];

function statusConfig(status: DocumentStatus) {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'Verified',
        icon: CheckCircle2,
        classes: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'REJECTED':
      return {
        label: 'Needs Update',
        icon: XCircle,
        classes: 'text-red-700 bg-red-50 border-red-200',
        dot: 'bg-red-500',
      };
    case 'EXPIRED':
      return {
        label: 'Expired',
        icon: AlertCircle,
        classes: 'text-red-700 bg-red-50 border-red-200',
        dot: 'bg-red-500',
      };
    default:
      return {
        label: 'Pending Review',
        icon: Clock,
        classes: 'text-amber-700 bg-amber-50 border-amber-200',
        dot: 'bg-amber-500',
      };
  }
}

/** Days left on a document's own expiration date (Central time), or null. */
function daysLeftFor(dateStr: string | null | undefined): number | null {
  return dateStr ? daysUntil(dateStr, centralToday()) : null;
}

/** Formats a YYYY-MM-DD calendar date without time-zone shifts. */
function formatCalendarDate(dateStr: string) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDisplayFileName(doc: ContractorDocument, docType: DocumentType) {
  if (doc.file_name) return doc.file_name;

  if (!doc.document_url) {
    return docType === DOCUMENT_TYPES.LICENSE ? 'license document' : 'insurance document';
  }

  try {
    const url = new URL(doc.document_url);
    const lastPart = url.pathname.split('/').pop();
    return lastPart || (docType === DOCUMENT_TYPES.LICENSE ? 'license document' : 'insurance document');
  } catch {
    const parts = doc.document_url.split('/');
    return parts[parts.length - 1] || (docType === DOCUMENT_TYPES.LICENSE ? 'license document' : 'insurance document');
  }
}

export default function ComplianceDocuments({
  contractorId,
  userId,
  licenseExpirationDate,
  insuranceExpirationDate,
}: ComplianceDocumentsProps) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const licenseInputRef = useRef<HTMLInputElement>(null);
  const insuranceInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<ContractorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Expiration date for the next upload, entered by the contractor per document type.
  const [newExpiration, setNewExpiration] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDocuments();
  }, [contractorId]);

  async function fetchDocuments() {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be signed in to view documents. Please refresh the page.');
        return;
      }

      const { data, error: fetchErr } = await supabase
        .from('contractor_documents')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      setDocuments((data ?? []) as ContractorDocument[]);
    } catch (err: any) {
      setError('Could not load documents: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    docType: DocumentType
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.');
      e.target.value = '';
      return;
    }

    const expDate = newExpiration[docType] || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expDate)) {
      setError('Enter the expiration date shown on the document before uploading.');
      e.target.value = '';
      return;
    }

    setUploadingType(docType);
    setError(null);

    try {
      const ext = file.name.split('.').pop() || 'bin';
      const storagePath = `${userId}/${docType}-${Date.now()}.${ext}`;

      // New file path every time and no overwrite: a reviewed file can never be replaced in place.
      const { error: uploadErr } = await supabase.storage
        .from('contractor-documents')
        .upload(storagePath, file, { contentType: file.type });

      if (uploadErr) throw uploadErr;

      const { data: signedUrlData, error: signedUrlErr } = await supabase.storage
        .from('contractor-documents')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

      if (signedUrlErr || !signedUrlData?.signedUrl) {
        throw new Error('Could not generate document link after upload.');
      }

      // Every upload is a new record; earlier ones stay as history. The database
      // stores it as PENDING until a ListWorx administrator reviews it.
      const previous = documents.find((d) => d.document_type === docType);
      const { error: insertErr } = await supabase
        .from('contractor_documents')
        .insert({
          contractor_id: contractorId,
          document_type: docType,
          document_url: signedUrlData.signedUrl,
          storage_path: storagePath,
          expiration_date: expDate,
          file_name: file.name,
          replaces_document_id: previous?.id ?? null,
        });

      if (insertErr) throw insertErr;
      setNewExpiration((prev) => ({ ...prev, [docType]: '' }));

      setSuccessMessage(
        `${docType === DOCUMENT_TYPES.LICENSE ? 'License' : 'Insurance'} document uploaded. ListWorx will review it before it counts toward your compliance.`
      );
      setTimeout(() => setSuccessMessage(null), 4000);

      await fetchDocuments();
    } catch (err: any) {
      setError('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingType(null);
      e.target.value = '';
    }
  }

  async function handleOpenDocument(doc: ContractorDocument, download: boolean) {
    const key = doc.id + (download ? '-dl' : '-view');
    setActionLoadingId(key);

    try {
      let url = doc.document_url;
      if (doc.storage_path) {
        // Stored links expire after 7 days; make a fresh one from the file path.
        const { data } = await supabase.storage.from('contractor-documents').createSignedUrl(doc.storage_path, 60 * 10);
        if (data?.signedUrl) url = data.signedUrl;
      }
      if (!url) throw new Error('No document URL found.');

      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = getDisplayFileName(doc, doc.document_type);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setError('Could not open document: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-lw-text">Compliance & Documents</h2>
          <p className="text-lw-text/50 text-sm mt-0.5">
            Upload and manage your license and insurance documents
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchDocuments}
          disabled={loading}
          className="text-lw-text/40 hover:text-lw-text hover:bg-lw-surface"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-4 bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertDescription className="text-emerald-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {DOC_TYPES.map(({ type, label, description, icon: Icon }) => {
          // Newest upload first; older uploads are kept as history.
          const history = documents.filter((d) => d.document_type === type);
          const doc = history[0];
          const expDate = doc?.expiration_date ?? null;
          const daysLeft = daysLeftFor(expDate);
          const tone = warningTone(daysLeft);
          const expired = tone === 'expired';
          const expiringSoon = tone === 'notice' || tone === 'warning' || tone === 'urgent';
          const status = doc ? statusConfig(expired && doc.status === 'APPROVED' ? 'EXPIRED' : doc.status) : null;
          const isUploading = uploadingType === type;
          const isViewLoading = actionLoadingId === doc?.id + '-view';
          const isDlLoading = actionLoadingId === doc?.id + '-dl';

          return (
            <div
              key={type}
              className="bg-white text-gray-900 rounded-2xl border border-lw-border-light overflow-hidden flex flex-col shadow-sm"
            >
              <div className="px-5 pt-5 pb-4 border-b border-lw-border-light">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-lw-surface border border-lw-border-light flex-shrink-0">
                    <Icon className="h-5 w-5 text-lw-rust" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lw-text text-sm">{label}</h3>
                    <p className="text-lw-text/40 text-xs mt-0.5">{description}</p>
                  </div>
                  {doc && status && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${status.classes}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-5 py-4 flex-1 space-y-3">
                {doc ? (
                  <>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-lw-text/30 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p
                          className="text-lw-text text-sm font-medium truncate"
                          title={getDisplayFileName(doc, type)}
                        >
                          {getDisplayFileName(doc, type)}
                        </p>
                        <p className="text-lw-text/40 text-xs mt-0.5">
                          Uploaded{' '}
                          {doc.created_at
                            ? new Date(doc.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'recently'}
                        </p>
                      </div>
                    </div>

                    {expDate && (
                      <div
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${
                          expired
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : expiringSoon
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-gray-100 border-gray-300 text-gray-700'
                        }`}
                      >
                        <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>
                          {expired
                            ? 'Expired: '
                            : expiringSoon
                            ? 'Expires soon: '
                            : 'Expires: '}
                          <span className="font-semibold">{formatCalendarDate(expDate)}</span>
                          {daysLeft !== null && daysLeft >= 0 && daysLeft <= 60 && (
                            <span> ({daysLeft === 0 ? 'today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`})</span>
                          )}
                        </span>
                      </div>
                    )}

                    {history.length > 1 && (
                      <p className="text-lw-text/40 text-xs">
                        {history.length - 1} earlier upload{history.length - 1 === 1 ? '' : 's'} kept on file.
                      </p>
                    )}

                    {doc.notes && doc.status === 'REJECTED' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                        <span className="font-semibold">Note: </span>
                        {doc.notes}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-lw-border-light bg-lw-surface px-4 py-5 text-center flex-col">
                    <Shield className="h-7 w-7 text-lw-text/20" />
                    <div>
                      <p className="text-lw-text/50 text-sm font-medium">No document uploaded</p>
                      <p className="text-lw-text/30 text-xs mt-0.5">
                        PDF, JPG, or PNG — max 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 pb-2">
                <label className="block text-xs font-medium text-lw-text/60 mb-1" htmlFor={`exp-${type}`}>
                  Expiration date on the {doc ? 'new' : ''} document
                </label>
                <input
                  id={`exp-${type}`}
                  type="date"
                  value={newExpiration[type] || ''}
                  onChange={(ev) => setNewExpiration((prev) => ({ ...prev, [type]: ev.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                />
              </div>

              <div className="px-5 pb-5 flex items-center gap-2 flex-wrap">
                {doc && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDocument(doc, false)}
                      disabled={isViewLoading || isDlLoading}
                      className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-xs flex-1"
                    >
                      {isViewLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDocument(doc, true)}
                      disabled={isViewLoading || isDlLoading}
                      className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-xs flex-1"
                    >
                      {isDlLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Download
                    </Button>
                  </>
                )}

                <input
                  ref={type === DOCUMENT_TYPES.LICENSE ? licenseInputRef : insuranceInputRef}
                  type="file"
                  className="hidden"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => handleUpload(e, type)}
                  disabled={isUploading}
                />
                <Button
                  size="sm"
                  onClick={() =>
                    (type === DOCUMENT_TYPES.LICENSE ? licenseInputRef : insuranceInputRef).current?.click()
                  }
                  disabled={isUploading || !newExpiration[type]}
                  className={`text-xs ${
                    doc
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 flex-1'
                      : 'bg-orange-600 text-white hover:bg-orange-700 w-full'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {doc ? 'Upload Renewal' : 'Upload Document'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-lw-text/30 text-center">
        Documents are stored securely and only visible to you and the ListWorx review team. ListWorx reviews
        each insurance certificate and license you submit; we do not contact your insurer.
        Accepted formats: PDF, JPG, PNG — max 10MB.
      </p>
    </section>
  );
}