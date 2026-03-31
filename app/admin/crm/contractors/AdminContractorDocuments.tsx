'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Eye,
  Download,
  CalendarDays,
  Shield,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  FileBadge,
  FileCheck,
  CircleAlert,
} from 'lucide-react';

interface ContractorDocument {
  id: string;
  contractor_id: string;
  document_type: 'LICENSE' | 'INSURANCE' | 'CERTIFICATION' | 'OTHER';
  document_url: string;
  expiration_date: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  file_name: string | null;
}

interface AdminContractorDocumentsProps {
  contractorId: string;
}

function statusBadge(status: ContractorDocument['status']) {
  switch (status) {
    case 'APPROVED':
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 gap-1">
          <CircleAlert className="h-3 w-3" />
          Expired
        </Badge>
      );
    default:
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
  }
}

function isExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isExpiringSoon(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const exp = new Date(dateStr);
  const now = new Date();
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 60;
}

function getDisplayFileName(doc: ContractorDocument): string {
  if (doc.file_name) return doc.file_name;

  if (!doc.document_url) return 'document';

  try {
    const url = new URL(doc.document_url);
    const pathname = url.pathname;
    const lastPart = pathname.split('/').pop();
    return lastPart || 'document';
  } catch {
    const parts = doc.document_url.split('/');
    return parts[parts.length - 1] || 'document';
  }
}

export default function AdminContractorDocuments({
  contractorId,
}: AdminContractorDocumentsProps) {
  const supabase = createClient();

  const [documents, setDocuments] = useState<ContractorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [contractorId]);

  async function getAuthToken(): Promise<string | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  }

  async function fetchDocuments() {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(
        `/api/admin/contractor-documents?contractorId=${contractorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load documents');
      }

      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignedUrl(
    documentUrl: string,
    download: boolean,
    fileName: string
  ) {
    const key = documentUrl + (download ? '-dl' : '-view');
    setActionLoading(key);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/contractor-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'signed-url',
          documentUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate URL');

      if (download) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open document');
    } finally {
      setActionLoading(null);
    }
  }

  function startEditReview(doc: ContractorDocument) {
    setEditingReview(doc.id);
    setReviewStatus(doc.status || 'PENDING');
    setReviewNotes(doc.notes ?? '');
  }

  async function submitReview(documentId: string) {
    setActionLoading('review-' + documentId);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/admin/contractor-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update-review',
          documentId,
          reviewStatus,
          reviewNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update review');

      setSuccessMessage('Review updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
      setEditingReview(null);
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to update review');
    } finally {
      setActionLoading(null);
    }
  }

  const DOC_TYPE_LABELS: Record<
    string,
    { label: string; icon: React.ElementType }
  > = {
    LICENSE: { label: 'Proof of License', icon: FileBadge },
    INSURANCE: { label: 'Proof of Insurance', icon: FileCheck },
    CERTIFICATION: { label: 'Certification', icon: FileText },
    OTHER: { label: 'Other Document', icon: FileText },
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading documents...
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Compliance Documents ({documents.length})
        </h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchDocuments}
          disabled={loading}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      {successMessage && (
        <p className="text-xs text-emerald-600 mb-3">{successMessage}</p>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const { label, icon: Icon } = DOC_TYPE_LABELS[doc.document_type] ?? {
              label: doc.document_type,
              icon: FileText,
            };

            const expired = isExpired(doc.expiration_date);
            const expiringSoon = isExpiringSoon(doc.expiration_date);
            const isViewLoading = actionLoading === doc.document_url + '-view';
            const isDlLoading = actionLoading === doc.document_url + '-dl';
            const isReviewLoading = actionLoading === 'review-' + doc.id;
            const isEditing = editingReview === doc.id;

            return (
              <div
                key={doc.id}
                className="p-4 border rounded-lg bg-muted/30 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{label}</p>
                      <p
                        className="text-xs text-muted-foreground truncate"
                        title={getDisplayFileName(doc)}
                      >
                        {getDisplayFileName(doc)}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
                  {statusBadge(doc.status)}
                </div>

                {doc.expiration_date && (
                  <div
                    className={`flex items-center gap-1.5 text-xs rounded px-2.5 py-1.5 border ${
                      expired
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : expiringSoon
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      {expired ? 'Expired: ' : expiringSoon ? 'Expires soon: ' : 'Expires: '}
                      <span className="font-semibold">
                        {new Date(doc.expiration_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>
                )}

                {doc.notes && !isEditing && (
                  <p className="text-xs bg-muted px-3 py-2 rounded border">
                    <span className="font-semibold">Review note: </span>
                    {doc.notes}
                  </p>
                )}

                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <Select value={reviewStatus} onValueChange={setReviewStatus}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="EXPIRED">Expired</SelectItem>
                      </SelectContent>
                    </Select>

                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Review notes (optional)"
                      className="text-xs min-h-[60px] resize-none"
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => submitReview(doc.id)}
                        disabled={isReviewLoading}
                        className="h-7 text-xs"
                      >
                        {isReviewLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        Save Review
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingReview(null)}
                        disabled={isReviewLoading}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleSignedUrl(
                          doc.document_url,
                          false,
                          getDisplayFileName(doc)
                        )
                      }
                      disabled={isViewLoading || isDlLoading}
                      className="h-7 text-xs"
                    >
                      {isViewLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Eye className="h-3 w-3 mr-1" />
                      )}
                      View
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleSignedUrl(
                          doc.document_url,
                          true,
                          getDisplayFileName(doc)
                        )
                      }
                      disabled={isViewLoading || isDlLoading}
                      className="h-7 text-xs"
                    >
                      {isDlLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Download className="h-3 w-3 mr-1" />
                      )}
                      Download
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditReview(doc)}
                      className="h-7 text-xs"
                    >
                      Review
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}