'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  FileBadge,
  FileCheck,
  FileText,
  Upload,
  Eye,
  Download,
  Trash2,
  Loader as Loader2,
  CircleAlert as AlertCircle,
  CircleCheck as CheckCircle2,
  Clock,
  Lock,
  Globe,
} from 'lucide-react';
import type { ContractorProfile } from './types';

type AdditionalDocType = 'CERTIFICATION' | 'AWARD' | 'OTHER';
type AnyDocType = 'LICENSE' | 'INSURANCE' | AdditionalDocType;
type DocStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | null;

interface ContractorDocumentRow {
  id: string;
  contractor_id: string;
  document_type: AnyDocType;
  document_url: string;
  status: DocStatus;
  file_name: string | null;
  label: string | null;
  is_public: boolean | null;
  storage_path: string | null;
  created_at: string | null;
}

interface DocumentsTabProps {
  profile: ContractorProfile;
  onNavigateToProfile: () => void;
}

const ADDITIONAL_TYPE_OPTIONS: { value: AdditionalDocType; label: string }[] = [
  { value: 'CERTIFICATION', label: 'Certification' },
  { value: 'AWARD', label: 'Award' },
  { value: 'OTHER', label: 'Other' },
];

const ADDITIONAL_TYPE_LABELS: Record<AdditionalDocType, string> = {
  CERTIFICATION: 'Certification',
  AWARD: 'Award',
  OTHER: 'Other',
};

function getDisplayFileName(url: string | null | undefined, fallback: string) {
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').pop();
    return last ? decodeURIComponent(last) : fallback;
  } catch {
    const parts = url.split('/');
    return parts[parts.length - 1] || fallback;
  }
}

function StatusBadge({ status }: { status: DocStatus }) {
  switch (status) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 border-emerald-200 text-emerald-700">
          <CheckCircle2 className="h-3 w-3" /> Approved
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-red-50 border-red-200 text-red-700">
          Rejected
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-red-50 border-red-200 text-red-700">
          Expired
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-amber-50 border-amber-200 text-amber-700">
          <Clock className="h-3 w-3" /> Pending
        </span>
      );
  }
}

export default function DocumentsTab({ profile, onNavigateToProfile }: DocumentsTabProps) {
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [allDocs, setAllDocs] = useState<ContractorDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [docType, setDocType] = useState<AdditionalDocType>('CERTIFICATION');
  const [label, setLabel] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    void fetchDocuments();
  }, [profile.id]);

  async function fetchDocuments() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('contractor_documents')
        .select('*')
        .eq('contractor_id', profile.id);

      if (fetchErr) throw fetchErr;
      setAllDocs((data ?? []) as ContractorDocumentRow[]);
    } catch (err: any) {
      setError('Could not load documents: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  const licenseComplianceDoc = allDocs.find((d) => d.document_type === 'LICENSE');
  const insuranceComplianceDoc = allDocs.find((d) => d.document_type === 'INSURANCE');

  const additionalDocs = allDocs
    .filter((d): d is ContractorDocumentRow & { document_type: AdditionalDocType } =>
      d.document_type === 'CERTIFICATION' || d.document_type === 'AWARD' || d.document_type === 'OTHER'
    )
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  async function getFreshSignedUrl(storagePath: string | null, fallbackUrl: string) {
    if (!storagePath) return fallbackUrl;
    const { data, error: signErr } = await supabase.storage
      .from('contractor-documents')
      .createSignedUrl(storagePath, 60 * 10);
    if (signErr || !data?.signedUrl) return fallbackUrl;
    return data.signedUrl;
  }

  async function handleView(doc: ContractorDocumentRow) {
    const key = doc.id + '-view';
    setActionLoadingKey(key);
    try {
      const url = await getFreshSignedUrl(doc.storage_path, doc.document_url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError('Could not open document: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoadingKey(null);
    }
  }

  async function handleDownload(doc: ContractorDocumentRow) {
    const key = doc.id + '-dl';
    setActionLoadingKey(key);
    try {
      const url = await getFreshSignedUrl(doc.storage_path, doc.document_url);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name || doc.label || 'document';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setError('Could not download document: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoadingKey(null);
    }
  }

  async function handleToggleVisibility(doc: ContractorDocumentRow) {
    const key = doc.id + '-visibility';
    setActionLoadingKey(key);
    setError(null);
    try {
      const { error: updateErr } = await supabase
        .from('contractor_documents')
        .update({ is_public: !doc.is_public, updated_at: new Date().toISOString() })
        .eq('id', doc.id);
      if (updateErr) throw updateErr;
      await fetchDocuments();
    } catch (err: any) {
      setError('Could not update visibility: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoadingKey(null);
    }
  }

  async function handleDelete(doc: ContractorDocumentRow) {
    const key = doc.id + '-delete';
    setActionLoadingKey(key);
    setError(null);
    try {
      if (doc.storage_path) {
        await supabase.storage.from('contractor-documents').remove([doc.storage_path]);
      }
      const { error: deleteErr } = await supabase
        .from('contractor_documents')
        .delete()
        .eq('id', doc.id);
      if (deleteErr) throw deleteErr;
      setDeleteConfirmId(null);
      await fetchDocuments();
    } catch (err: any) {
      setError('Could not delete document: ' + (err.message || 'Unknown error'));
    } finally {
      setActionLoadingKey(null);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!label.trim()) {
      setError('Please enter a label for this document before uploading.');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop() || 'bin';
      const storagePath = `${profile.user_id}/profile-documents/${Date.now()}-${docType.toLowerCase()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('contractor-documents')
        .upload(storagePath, file, { contentType: file.type });

      if (uploadErr) throw uploadErr;

      const { data: signedUrlData, error: signedUrlErr } = await supabase.storage
        .from('contractor-documents')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

      if (signedUrlErr || !signedUrlData?.signedUrl) {
        throw new Error('Could not generate document link after upload.');
      }

      const { error: insertErr } = await supabase.from('contractor_documents').insert({
        contractor_id: profile.id,
        document_type: docType,
        document_url: signedUrlData.signedUrl,
        file_name: file.name,
        label: label.trim(),
        is_public: isPublic,
        storage_path: storagePath,
        status: 'APPROVED',
      });

      if (insertErr) throw insertErr;

      setSuccessMessage('Document uploaded successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
      setLabel('');
      setIsPublic(false);
      setDocType('CERTIFICATION');
      await fetchDocuments();
    } catch (err: any) {
      setError('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertDescription className="text-emerald-700">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Application Documents (read-only) */}
      <section>
        <h2 className="text-xl font-bold text-gray-900">Application Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5 mb-5">
          Documents submitted with your original application. To replace these, use the Compliance section on My Profile.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {(
            [
              { key: 'license' as const, label: 'License', icon: FileBadge, url: profile.license_document_url, doc: licenseComplianceDoc },
              { key: 'insurance' as const, label: 'Insurance', icon: FileCheck, url: profile.insurance_document_url, doc: insuranceComplianceDoc },
            ]
          ).map(({ key, label: typeLabel, icon: Icon, url, doc }) => (
            <div key={key} className="bg-white text-gray-900 rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
              <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 flex-shrink-0">
                    <Icon className="h-5 w-5 text-lw-rust" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900">{typeLabel}</h3>
                  </div>
                  {url && doc?.status && <StatusBadge status={doc.status} />}
                </div>
              </div>

              <div className="px-5 py-4 flex-1">
                {url ? (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={getDisplayFileName(url, `${typeLabel} document`)}>
                        {getDisplayFileName(url, `${typeLabel} document`)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
                    <p className="text-gray-500 text-sm font-medium">Not uploaded yet</p>
                    <button
                      onClick={onNavigateToProfile}
                      className="mt-2 text-xs font-semibold text-lw-rust hover:underline"
                    >
                      Upload in My Profile
                    </button>
                  </div>
                )}
              </div>

              {url && (
                <div className="px-5 pb-5">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Additional Documents */}
      <section>
        <h2 className="text-xl font-bold text-gray-900">Additional Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5 mb-5">
          Upload certifications, awards, or other credentials you want on record.
        </p>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as AdditionalDocType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADDITIONAL_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Label</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. OSHA 10-Hour Certificate"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} id="doc-visibility" />
            <Label htmlFor="doc-visibility" className="flex items-center gap-1.5 cursor-pointer">
              {isPublic ? <Globe className="h-3.5 w-3.5 text-lw-rust" /> : <Lock className="h-3.5 w-3.5 text-gray-400" />}
              {isPublic ? 'Public — shows on your profile' : 'Private — only you and admin'}
            </Label>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="application/pdf,image/jpeg,image/png"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-lw-rust text-white hover:bg-lw-rust-hover"
          >
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
          <p className="mt-2 text-xs text-gray-400">PDF, JPG, or PNG — max 10MB.</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading documents...
          </div>
        ) : additionalDocs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center text-gray-400 text-sm">
            No additional documents uploaded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {additionalDocs.map((doc) => {
              const isViewLoading = actionLoadingKey === doc.id + '-view';
              const isDlLoading = actionLoadingKey === doc.id + '-dl';
              const isVisLoading = actionLoadingKey === doc.id + '-visibility';
              const isDeleteLoading = actionLoadingKey === doc.id + '-delete';

              return (
                <div key={doc.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700 flex-shrink-0">
                        {ADDITIONAL_TYPE_LABELS[doc.document_type as AdditionalDocType]}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 truncate">{doc.label || doc.file_name || 'Document'}</p>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleToggleVisibility(doc)}
                      disabled={isVisLoading}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-colors ${
                        doc.is_public
                          ? 'bg-orange-50 border-orange-200 text-lw-rust hover:bg-orange-100'
                          : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isVisLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : doc.is_public ? (
                        <Globe className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3" />
                      )}
                      {doc.is_public ? 'Public' : 'Private'}
                    </button>

                    <Button size="sm" variant="outline" onClick={() => handleView(doc)} disabled={isViewLoading} className="text-xs h-7">
                      {isViewLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
                      View
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => handleDownload(doc)} disabled={isDlLoading} className="text-xs h-7">
                      {isDlLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                      Download
                    </Button>

                    {deleteConfirmId === doc.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600 font-medium">Delete this document?</span>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(doc)} disabled={isDeleteLoading} className="text-xs h-7">
                          {isDeleteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)} disabled={isDeleteLoading} className="text-xs h-7">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirmId(doc.id)}
                        className="text-xs h-7 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
