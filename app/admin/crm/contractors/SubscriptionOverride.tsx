'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader as Loader2, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Download, Shield } from 'lucide-react';

interface SubscriptionOverrideProps {
  contractorId: string;
  contractorName: string;
  currentStatus: string;
  currentTier: string | null;
  adminUserId: string;
}

interface AuditEntry {
  id: string;
  action: string;
  changes: Record<string, any>;
  created_at: string;
  admin_name?: string;
  admin_email?: string;
}

interface Subscription {
  id: string;
  status: string;
  tier_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  tiers?: { name: string } | null;
}

const OVERRIDE_TYPES = [
  { value: 'free_subscription', label: 'Free Subscription' },
  { value: 'manual_activation', label: 'Manual Activation' },
  { value: 'testing_mode', label: 'Testing Mode' },
  { value: 'partner_comp', label: 'Partner / Comp' },
  { value: 'suspend', label: 'Suspend' },
  { value: 'reactivate', label: 'Reactivate' },
];

const TIER_OPTIONS = [
  { value: 'Basic Partner', label: 'Basic Partner' },
  { value: 'Preferred Partner', label: 'Preferred Partner' },
  { value: 'Elite Partner', label: 'Elite Partner' },
];

const DURATION_OPTIONS = [
  { value: '30', label: '30 Days' },
  { value: '60', label: '60 Days' },
  { value: '90', label: '90 Days' },
  { value: 'indefinite', label: 'Indefinite' },
  { value: 'custom', label: 'Custom Date' },
];

export default function SubscriptionOverride({
  contractorId,
  contractorName,
  currentStatus,
  currentTier,
  adminUserId,
}: SubscriptionOverrideProps) {
  if (!adminUserId) return null;

  const supabase = createClient();

  const [overrideType, setOverrideType] = useState('');
  const [tier, setTier] = useState(currentTier || '');
  const [duration, setDuration] = useState('indefinite');
  const [customDate, setCustomDate] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  useEffect(() => {
    loadData();
  }, [contractorId]);

  async function loadData() {
    setLoadingAudit(true);
    try {
      const [subRes, auditRes] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*, tiers(name)')
          .eq('contractor_id', contractorId)
          .maybeSingle(),
        supabase
          .from('audit_logs')
          .select('*')
          .eq('contractor_id', contractorId)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      setSubscription(subRes.data as Subscription | null);

      const logs = auditRes.data || [];
      // Enrich with admin names where possible
      const enriched = await Promise.all(
        logs.map(async (log: AuditEntry) => {
          if (log.changes?.admin_id) {
            const { data: u } = await supabase
              .from('users')
              .select('email')
              .eq('id', log.changes.admin_id)
              .maybeSingle();
            return { ...log, admin_email: u?.email };
          }
          return log;
        })
      );
      setAuditLogs(enriched);
    } catch (e) {
      console.error('Failed to load override data', e);
    } finally {
      setLoadingAudit(false);
    }
  }

  async function handleSubmit(actionType: 'activate' | 'override' | 'suspend') {
    if (!adminNote.trim()) {
      setResult({ ok: false, msg: 'Admin note is required.' });
      return;
    }
    if (actionType !== 'suspend' && !tier) {
      setResult({ ok: false, msg: 'Please select a tier.' });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/subscription-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId,
          actionType,
          overrideType: actionType === 'suspend' ? 'suspend' : overrideType,
          tier: actionType === 'suspend' ? null : tier,
          duration,
          customDate,
          adminNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Override failed');

      setResult({ ok: true, msg: data.message || 'Override applied successfully.' });
      setAdminNote('');
      await loadData();
    } catch (err: any) {
      setResult({ ok: false, msg: err.message || 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  }

  function exportCSV() {
    const rows = [
      ['Timestamp', 'Action', 'Type', 'Tier', 'Duration', 'Note', 'Admin'],
      ...auditLogs.map((log) => [
        new Date(log.created_at).toLocaleString(),
        log.action,
        log.changes?.override_type || '',
        log.changes?.tier || '',
        log.changes?.duration || '',
        log.changes?.note || '',
        log.admin_email || log.changes?.admin_id || '',
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${contractorId}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const subscriptionSource = subscription?.stripe_subscription_id ? 'Stripe' : subscription ? 'Manual' : 'None';

  return (
    <div className="mt-6 space-y-6">
      {/* Current subscription status */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-lw-rust" />
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Subscription Override</h4>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Status</p>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
              currentStatus === 'active' ? 'bg-emerald-100 text-emerald-700' :
              currentStatus === 'suspended' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {currentStatus}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Tier</p>
            <p className="font-medium text-gray-900">{currentTier || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Source</p>
            <p className="font-medium text-gray-900">{subscriptionSource}</p>
          </div>
        </div>

        {/* Override form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Override Type</label>
              <Select value={overrideType} onValueChange={setOverrideType}>
                <SelectTrigger className="border-gray-300 bg-white text-gray-900 text-sm">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {OVERRIDE_TYPES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Assign Tier</label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger className="border-gray-300 bg-white text-gray-900 text-sm">
                  <SelectValue placeholder="Select tier..." />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="border-gray-300 bg-white text-gray-900 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {duration === 'custom' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Custom End Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-lw-rust focus:outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
              Admin Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Required: reason for this override..."
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-lw-rust focus:outline-none focus:ring-2 focus:ring-lw-rust/10"
            />
          </div>

          {result && (
            <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
              result.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {result.ok ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              {result.msg}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={() => handleSubmit('activate')}
              disabled={submitting || !adminNote.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
              size="sm"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Activate Account
            </Button>
            <Button
              onClick={() => handleSubmit('override')}
              disabled={submitting || !adminNote.trim()}
              className="text-white text-sm"
              style={{ backgroundColor: '#E8621A' }}
              size="sm"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Apply Override
            </Button>
            <Button
              onClick={() => handleSubmit('suspend')}
              disabled={submitting || !adminNote.trim()}
              className="bg-red-600 hover:bg-red-700 text-white text-sm"
              size="sm"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Suspend
            </Button>
          </div>
        </div>
      </div>

      {/* Audit log */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Override History</h4>
          {auditLogs.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          )}
        </div>

        {loadingAudit ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading audit log...
          </div>
        ) : auditLogs.length === 0 ? (
          <p className="text-sm text-gray-400">No override history for this contractor.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        log.action === 'subscription_override' ? 'bg-orange-100 text-orange-700' :
                        log.action === 'stripe_activation' ? 'bg-blue-100 text-blue-700' :
                        log.action === 'suspend' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {log.action}
                      </span>
                      {log.changes?.override_type && (
                        <span className="text-xs text-gray-500">{log.changes.override_type}</span>
                      )}
                      {log.changes?.tier && (
                        <span className="text-xs text-lw-rust">{log.changes.tier}</span>
                      )}
                    </div>
                    {log.changes?.note && (
                      <p className="text-xs text-gray-600 mt-1 italic">"{log.changes.note}"</p>
                    )}
                    {log.admin_email && (
                      <p className="text-xs text-gray-400 mt-0.5">by {log.admin_email}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
