'use client';

/**
 * Admin: licensing rules by trade and place, and decisions for unclear cases.
 *
 * Rules are per trade + state, with optional county overrides. When no rule
 * applies, or the rule is "case by case", the contractor/trade/state appears in
 * the review queue. The admin records a decision for that contractor, trade and
 * jurisdiction (whole state or one county): license required, not required, or
 * awaiting determination, with a note, a source link and optionally one of the
 * contractor's uploaded documents as support.
 * Precedence matches public.license_requirement_for(): county decision > county
 * rule > statewide decision > state rule. Writes go straight to Supabase;
 * row-level security allows admins only.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader as Loader2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navigation from '@/components/Navigation';
import { createClient } from '@/lib/supabase-browser';
import { checkAdminAuth } from '@/lib/admin-auth';
import {
  resolveLicenseRequirement,
  type LicenseDecision,
  type LicenseRule,
  type LicenseRequirementValue,
} from '@/lib/compliance/licensing';

type Rule = LicenseRule & { id: string; conditions: string | null; source_url: string | null; reviewed_at: string };
type Named = { id: string; name: string };
type County = { id: string; name: string; state_code: string };
type DecisionValue = Exclude<LicenseRequirementValue, 'case_by_case'>;
type Decision = LicenseDecision & {
  id: string;
  note: string | null;
  source_url: string | null;
  supporting_document_id: string | null;
  decided_at: string;
};
type Contractor = { id: string; company_name: string };
type Doc = { id: string; contractor_id: string; document_type: string; file_name: string | null; status: string };
type QueueItem = {
  key: string;
  contractor: Contractor;
  category: Named;
  state: string;
  counties: County[];
  why: string;
  awaiting: Decision | null;
};
type DecisionDraft = { requirement: DecisionValue; county_id: string; note: string; source_url: string; document_id: string };

const RULE_LABEL: Record<LicenseRequirementValue, string> = {
  required: 'License required',
  not_required: 'No license required',
  case_by_case: 'Case by case (decide per contractor)',
  awaiting_determination: 'Awaiting determination (researching)',
};
const DECISION_LABEL: Record<DecisionValue, string> = {
  required: 'License required',
  not_required: 'No license required',
  awaiting_determination: 'Awaiting determination',
};

export default function LicenseRulesPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [rules, setRules] = useState<Rule[]>([]);
  const [categories, setCategories] = useState<Named[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});

  const [draft, setDraft] = useState({ category_id: '', state_code: 'TN', county_id: '', requirement: 'required' as LicenseRequirementValue, conditions: '', source_url: '' });
  const [decisionDrafts, setDecisionDrafts] = useState<Record<string, DecisionDraft>>({});

  const load = useCallback(async () => {
    setError('');
    const [r, cat, cty, dec, prof, cc, ck, dd] = await Promise.all([
      supabase.from('license_requirements').select('id, category_id, state_code, county_id, requirement, conditions, source_url, reviewed_at').order('state_code'),
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('counties').select('id, name, state_code').order('name'),
      supabase.from('contractor_license_determinations').select('id, contractor_id, category_id, state_code, county_id, requirement, note, source_url, supporting_document_id, decided_at'),
      supabase.from('contractor_profiles').select('id, company_name').eq('archived', false),
      supabase.from('contractor_categories').select('contractor_id, category_id'),
      supabase.from('contractor_counties').select('contractor_id, county_id'),
      supabase.from('contractor_documents').select('id, contractor_id, document_type, file_name, status').order('created_at', { ascending: false }),
    ]);
    const firstError = [r, cat, cty, dec, prof, cc, ck, dd].find((x) => x.error)?.error;
    if (firstError) { setError(firstError.message); return; }
    const ruleRows = (r.data || []) as Rule[];
    const catRows = (cat.data || []) as Named[];
    const countyRows = (cty.data || []) as County[];
    const decisionRows = (dec.data || []) as Decision[];
    const contractors = (prof.data || []) as Contractor[];
    setRules(ruleRows); setCategories(catRows); setCounties(countyRows); setDecisions(decisionRows);
    setDocs((dd.data || []) as Doc[]);
    setCompanies(Object.fromEntries(contractors.map((c) => [c.id, c.company_name])));

    // Queue: contractor + trade + state where some county they serve still resolves to "needs review".
    const countyById = new Map(countyRows.map((c) => [c.id, c]));
    const catById = new Map(catRows.map((c) => [c.id, c]));
    const countiesOf = new Map<string, County[]>();
    for (const row of (ck.data || []) as any[]) {
      const c = countyById.get(row.county_id);
      if (c) countiesOf.set(row.contractor_id, [...(countiesOf.get(row.contractor_id) || []), c]);
    }
    const items: QueueItem[] = [];
    for (const contractor of contractors) {
      for (const row of ((cc.data || []) as any[]).filter((x) => x.contractor_id === contractor.id)) {
        const unclear = (countiesOf.get(contractor.id) || []).filter(
          (c) => resolveLicenseRequirement(ruleRows, row.category_id, c, decisionRows, contractor.id) === 'needs_review'
        );
        const byState = new Map<string, County[]>();
        for (const c of unclear) byState.set(c.state_code, [...(byState.get(c.state_code) || []), c]);
        byState.forEach((stateCounties, state) => {
          const awaiting =
            decisionRows.find((d) => d.contractor_id === contractor.id && d.category_id === row.category_id && d.state_code === state && d.requirement === 'awaiting_determination') || null;
          const caseRule = ruleRows.find((x) => x.category_id === row.category_id && x.state_code === state && x.requirement === 'case_by_case');
          items.push({
            key: `${contractor.id}:${row.category_id}:${state}`,
            contractor,
            category: catById.get(row.category_id) || { id: row.category_id, name: 'Unknown trade' },
            state,
            counties: stateCounties,
            awaiting,
            why: awaiting
              ? `Awaiting determination${awaiting.note ? `: ${awaiting.note}` : ''}`
              : caseRule
                ? `Case by case${caseRule.conditions ? `: ${caseRule.conditions}` : ''}`
                : 'No rule for this trade and state yet',
          });
        });
      }
    }
    setQueue(items);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const result = await checkAdminAuth();
      if (!result.ok) {
        if (result.reason === 'not_admin') setDenied(true);
        else router.push('/login?redirect=/admin/crm/license-rules');
        return;
      }
      setReady(true);
      await load();
    })();
  }, [load, router]);

  const states = useMemo(() => Array.from(new Set(counties.map((c) => c.state_code).filter(Boolean))).sort(), [counties]);
  const name = (id: string | null, list: Named[]) => list.find((x) => x.id === id)?.name || '';

  async function run(op: () => PromiseLike<{ error: { message: string } | null }>) {
    setBusy(true); setError('');
    const { error: opError } = await op();
    if (opError) setError(opError.message);
    await load();
    setBusy(false);
  }

  async function adminId() {
    return (await supabase.auth.getUser()).data.user?.id ?? null;
  }

  async function saveRule() {
    if (!draft.category_id || !draft.state_code) { setError('Choose a trade and a state.'); return; }
    const reviewer = await adminId();
    const existing = rules.find((r) => r.category_id === draft.category_id && r.state_code === draft.state_code && (r.county_id || '') === draft.county_id);
    const row = {
      category_id: draft.category_id,
      state_code: draft.state_code,
      county_id: draft.county_id || null,
      requirement: draft.requirement,
      conditions: draft.conditions.trim() || null,
      source_url: draft.source_url.trim() || null,
      reviewed_by: reviewer,
      reviewed_at: new Date().toISOString(),
    };
    await run(() => existing
      ? supabase.from('license_requirements').update(row).eq('id', existing.id)
      : supabase.from('license_requirements').insert(row));
  }

  function draftFor(q: QueueItem): DecisionDraft {
    return decisionDrafts[q.key] || {
      requirement: 'not_required',
      county_id: '',
      note: q.awaiting?.note || '',
      source_url: q.awaiting?.source_url || '',
      document_id: q.awaiting?.supporting_document_id || '',
    };
  }

  async function saveDecision(q: QueueItem) {
    const d = draftFor(q);
    if (d.requirement !== 'awaiting_determination' && !d.note.trim()) {
      setError('Add a note saying what you checked before recording a decision.');
      return;
    }
    const decider = await adminId();
    const existing = decisions.find(
      (x) => x.contractor_id === q.contractor.id && x.category_id === q.category.id && x.state_code === q.state && (x.county_id || '') === d.county_id
    );
    const row = {
      contractor_id: q.contractor.id,
      category_id: q.category.id,
      state_code: q.state,
      county_id: d.county_id || null,
      requirement: d.requirement,
      note: d.note.trim() || null,
      source_url: d.source_url.trim() || null,
      supporting_document_id: d.document_id || null,
      decided_by: decider,
      decided_at: new Date().toISOString(),
    };
    await run(() => existing
      ? supabase.from('contractor_license_determinations').update(row).eq('id', existing.id)
      : supabase.from('contractor_license_determinations').insert(row));
    setDecisionDrafts((prev) => { const next = { ...prev }; delete next[q.key]; return next; });
  }

  if (denied) return <div className="p-10 text-center text-sm">Admins only.</div>;
  if (!ready) return <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const select = 'w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm';
  const docLabel = (doc: Doc) => `${doc.document_type.toLowerCase()} — ${doc.file_name || doc.id.slice(0, 8)} (${doc.status.toLowerCase()})`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Link href="/admin/crm" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
          <ChevronLeft className="h-4 w-4" /> Admin CRM
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">License rules</h1>
          <p className="mt-1 text-sm text-gray-600">
            Licensing differs by trade, state and county. Precedence: a decision for one contractor in a county, then the
            county rule, then a statewide decision for the contractor, then the state rule. Anything unresolved waits below and,
            once enforcement is on, holds new referrals only for that trade in that place.
          </p>
        </div>
        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Needs a decision ({queue.length})</h2>
          {queue.length === 0 && <p className="text-sm text-gray-500">Nothing waiting.</p>}
          {queue.map((q) => {
            const d = draftFor(q);
            const setD = (patch: Partial<DecisionDraft>) => setDecisionDrafts((prev) => ({ ...prev, [q.key]: { ...d, ...patch } }));
            const contractorDocs = docs.filter((x) => x.contractor_id === q.contractor.id);
            return (
              <div key={q.key} data-testid="license-queue-item" className="rounded-md border border-gray-200 p-3 text-sm space-y-2">
                <div>
                  <strong>{q.contractor.company_name}</strong> — {q.category.name} — {q.counties.map((c) => `${c.name} County`).join(', ')}, {q.state}
                </div>
                <div className="text-gray-500">{q.why}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs text-gray-600">Determination</span>
                    <select aria-label="Determination" className={select} value={d.requirement} onChange={(e) => setD({ requirement: e.target.value as DecisionValue })}>
                      {(Object.keys(DECISION_LABEL) as DecisionValue[]).map((k) => <option key={k} value={k}>{DECISION_LABEL[k]}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs text-gray-600">Applies to</span>
                    <select aria-label="Applies to" className={select} value={d.county_id} onChange={(e) => setD({ county_id: e.target.value })}>
                      <option value="">All of {q.state}</option>
                      {q.counties.map((c) => <option key={c.id} value={c.id}>{c.name} County only</option>)}
                    </select>
                  </label>
                  <Input aria-label="Note" placeholder="Note: what you checked (required unless awaiting)" value={d.note} onChange={(e) => setD({ note: e.target.value })} />
                  <Input aria-label="Source link" placeholder="Source link (licensing board page)" value={d.source_url} onChange={(e) => setD({ source_url: e.target.value })} />
                  <label className="space-y-1 sm:col-span-2">
                    <span className="text-xs text-gray-600">Supporting document (optional)</span>
                    <select aria-label="Supporting document" className={select} value={d.document_id} onChange={(e) => setD({ document_id: e.target.value })}>
                      <option value="">None</option>
                      {contractorDocs.map((doc) => <option key={doc.id} value={doc.id}>{docLabel(doc)}</option>)}
                    </select>
                  </label>
                </div>
                <Button size="sm" disabled={busy} onClick={() => saveDecision(q)}>Record decision</Button>
              </div>
            );
          })}
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Add or update a rule</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select aria-label="Trade" className={select} value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}>
              <option value="">Trade…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select aria-label="State" className={select} value={draft.state_code} onChange={(e) => setDraft({ ...draft, state_code: e.target.value, county_id: '' })}>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select aria-label="County" className={select} value={draft.county_id} onChange={(e) => setDraft({ ...draft, county_id: e.target.value })}>
              <option value="">Whole state</option>
              {counties.filter((c) => c.state_code === draft.state_code).map((c) => <option key={c.id} value={c.id}>{c.name} County (override)</option>)}
            </select>
            <select aria-label="Requirement" className={select} value={draft.requirement} onChange={(e) => setDraft({ ...draft, requirement: e.target.value as LicenseRequirementValue })}>
              {(Object.keys(RULE_LABEL) as LicenseRequirementValue[]).map((k) => <option key={k} value={k}>{RULE_LABEL[k]}</option>)}
            </select>
            <Input aria-label="Conditions" placeholder="Conditions (e.g. projects of $25,000 or more)" value={draft.conditions} onChange={(e) => setDraft({ ...draft, conditions: e.target.value })} />
            <Input aria-label="Rule source link" placeholder="Source link (licensing board page)" value={draft.source_url} onChange={(e) => setDraft({ ...draft, source_url: e.target.value })} />
          </div>
          <Button disabled={busy} onClick={saveRule}>Save rule</Button>
        </Card>

        <Card className="p-5 space-y-2">
          <h2 className="font-semibold">Rules ({rules.length})</h2>
          {rules.length === 0 && <p className="text-sm text-gray-500">No rules yet. Every trade is reviewed until you add rules.</p>}
          {rules.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 text-sm">
              <div>
                <strong>{name(r.category_id, categories)}</strong> — {r.county_id ? `${name(r.county_id, counties)} County, ` : ''}{r.state_code}: {RULE_LABEL[r.requirement]}
                {r.conditions && <div className="text-gray-500">{r.conditions}</div>}
                {r.source_url && <a className="text-xs text-blue-700 underline" href={r.source_url} target="_blank" rel="noreferrer">Source</a>}
              </div>
              <Button size="sm" variant="ghost" disabled={busy} aria-label="Delete rule"
                onClick={() => run(() => supabase.from('license_requirements').delete().eq('id', r.id))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </Card>

        <Card className="p-5 space-y-2">
          <h2 className="font-semibold">Decisions for individual contractors ({decisions.length})</h2>
          {decisions.map((d) => {
            const doc = docs.find((x) => x.id === d.supporting_document_id);
            return (
              <div key={d.id} className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 text-sm">
                <div>
                  {companies[d.contractor_id] || 'Archived contractor'} — {name(d.category_id, categories)} —{' '}
                  {d.county_id ? `${name(d.county_id, counties)} County, ` : 'all of '}{d.state_code}: {DECISION_LABEL[d.requirement]}
                  {d.note && <div className="text-gray-500">{d.note}</div>}
                  {d.source_url && <a className="text-xs text-blue-700 underline" href={d.source_url} target="_blank" rel="noreferrer">Source</a>}
                  {doc && <div className="text-xs text-gray-500">Supporting document: {docLabel(doc)}</div>}
                  <div className="text-xs text-gray-400">Recorded {new Date(d.decided_at).toLocaleDateString()}</div>
                </div>
                <Button size="sm" variant="ghost" disabled={busy} aria-label="Remove decision"
                  onClick={() => run(() => supabase.from('contractor_license_determinations').delete().eq('id', d.id))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </Card>
      </main>
    </div>
  );
}
