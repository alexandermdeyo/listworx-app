'use client';

/**
 * Admin: licensing rules by trade and place, and decisions for unclear cases.
 *
 * Rules are per trade + state, with optional county overrides. When no rule
 * applies, or the rule is "case by case", the contractor appears in the review
 * queue until an admin records a decision for that contractor and trade.
 * Matching uses the same resolution (public.license_requirement_for).
 * Writes go straight to Supabase; row-level security allows admins only.
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
import { resolveLicenseRequirement, type LicenseRule, type LicenseRequirementValue } from '@/lib/compliance/licensing';

type Rule = LicenseRule & { id: string; conditions: string | null; source_url: string | null; reviewed_at: string };
type Named = { id: string; name: string };
type County = { id: string; name: string; state_code: string };
type Decision = { contractor_id: string; category_id: string; requirement: 'required' | 'not_required'; note: string | null; decided_at: string };
type Contractor = { id: string; company_name: string };
type QueueItem = { contractor: Contractor; category: Named; counties: string[]; why: string };

const LABEL: Record<LicenseRequirementValue, string> = {
  required: 'License required',
  not_required: 'No license required',
  case_by_case: 'Case by case (admin decides per contractor)',
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
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});

  const [draft, setDraft] = useState({ category_id: '', state_code: 'TN', county_id: '', requirement: 'required' as LicenseRequirementValue, conditions: '', source_url: '' });
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setError('');
    const [r, cat, cty, dec, prof, cc, ck] = await Promise.all([
      supabase.from('license_requirements').select('id, category_id, state_code, county_id, requirement, conditions, source_url, reviewed_at').order('state_code'),
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('counties').select('id, name, state_code').order('name'),
      supabase.from('contractor_license_determinations').select('contractor_id, category_id, requirement, note, decided_at'),
      supabase.from('contractor_profiles').select('id, company_name').eq('archived', false),
      supabase.from('contractor_categories').select('contractor_id, category_id'),
      supabase.from('contractor_counties').select('contractor_id, county_id'),
    ]);
    const firstError = [r, cat, cty, dec, prof, cc, ck].find((x) => x.error)?.error;
    if (firstError) { setError(firstError.message); return; }
    const ruleRows = (r.data || []) as Rule[];
    const catRows = (cat.data || []) as Named[];
    const countyRows = (cty.data || []) as County[];
    const decisionRows = (dec.data || []) as Decision[];
    setRules(ruleRows); setCategories(catRows); setCounties(countyRows); setDecisions(decisionRows);

    // Review queue: contractor + trade pairs with no decision whose rule is missing or case by case in any county they serve.
    const countyById = new Map(countyRows.map((c) => [c.id, c]));
    const catById = new Map(catRows.map((c) => [c.id, c]));
    const decided = new Set(decisionRows.map((d) => `${d.contractor_id}:${d.category_id}`));
    const countiesOf = new Map<string, County[]>();
    for (const row of (ck.data || []) as any[]) {
      const c = countyById.get(row.county_id);
      if (c) countiesOf.set(row.contractor_id, [...(countiesOf.get(row.contractor_id) || []), c]);
    }
    const items: QueueItem[] = [];
    for (const contractor of (prof.data || []) as Contractor[]) {
      for (const row of ((cc.data || []) as any[]).filter((x) => x.contractor_id === contractor.id)) {
        if (decided.has(`${contractor.id}:${row.category_id}`)) continue;
        const unclear = (countiesOf.get(contractor.id) || []).filter((c) => resolveLicenseRequirement(ruleRows, row.category_id, c) === 'needs_review');
        if (!unclear.length) continue;
        const caseRule = ruleRows.find((x) => x.category_id === row.category_id && x.requirement === 'case_by_case' && unclear.some((c) => c.state_code === x.state_code));
        items.push({
          contractor,
          category: catById.get(row.category_id) || { id: row.category_id, name: 'Unknown trade' },
          counties: unclear.map((c) => `${c.name}, ${c.state_code}`),
          why: caseRule ? `Case by case${caseRule.conditions ? `: ${caseRule.conditions}` : ''}` : 'No rule for this trade and place yet',
        });
      }
    }
    setQueue(items);
    setCompanies(Object.fromEntries(((prof.data || []) as Contractor[]).map((c) => [c.id, c.company_name])));
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

  if (denied) return <div className="p-10 text-center text-sm">Admins only.</div>;
  if (!ready) return <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const select = 'w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm';

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
            Licensing differs by trade, state and county. A county rule overrides its state rule. Trades with no rule,
            or a case-by-case rule, wait in the review queue below; a trade is never treated as license-required unless set here.
          </p>
        </div>
        {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Needs a decision ({queue.length})</h2>
          {queue.length === 0 && <p className="text-sm text-gray-500">Nothing waiting.</p>}
          {queue.map((q) => {
            const key = `${q.contractor.id}:${q.category.id}`;
            const decide = async (requirement: 'required' | 'not_required') => {
              const decider = await adminId();
              await run(() => supabase.from('contractor_license_determinations').upsert({
                contractor_id: q.contractor.id,
                category_id: q.category.id,
                requirement,
                note: notes[key]?.trim() || null,
                decided_by: decider,
                decided_at: new Date().toISOString(),
              }));
            };
            return (
              <div key={key} className="rounded-md border border-gray-200 p-3 text-sm space-y-2">
                <div><strong>{q.contractor.company_name}</strong> — {q.category.name} — {q.counties.join('; ')}</div>
                <div className="text-gray-500">{q.why}</div>
                <Input placeholder="Note (what you checked)" value={notes[key] || ''} onChange={(e) => setNotes({ ...notes, [key]: e.target.value })} />
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy} onClick={() => decide('required')}>License required</Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => decide('not_required')}>No license required</Button>
                </div>
              </div>
            );
          })}
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold">Add or update a rule</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select className={select} value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}>
              <option value="">Trade…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className={select} value={draft.state_code} onChange={(e) => setDraft({ ...draft, state_code: e.target.value, county_id: '' })}>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className={select} value={draft.county_id} onChange={(e) => setDraft({ ...draft, county_id: e.target.value })}>
              <option value="">Whole state</option>
              {counties.filter((c) => c.state_code === draft.state_code).map((c) => <option key={c.id} value={c.id}>{c.name} County (override)</option>)}
            </select>
            <select className={select} value={draft.requirement} onChange={(e) => setDraft({ ...draft, requirement: e.target.value as LicenseRequirementValue })}>
              {(Object.keys(LABEL) as LicenseRequirementValue[]).map((k) => <option key={k} value={k}>{LABEL[k]}</option>)}
            </select>
            <Input placeholder="Conditions (e.g. projects of $25,000 or more)" value={draft.conditions} onChange={(e) => setDraft({ ...draft, conditions: e.target.value })} />
            <Input placeholder="Source link (licensing board page)" value={draft.source_url} onChange={(e) => setDraft({ ...draft, source_url: e.target.value })} />
          </div>
          <Button disabled={busy} onClick={saveRule}>Save rule</Button>
        </Card>

        <Card className="p-5 space-y-2">
          <h2 className="font-semibold">Rules ({rules.length})</h2>
          {rules.length === 0 && <p className="text-sm text-gray-500">No rules yet. Every trade is reviewed case by case until you add rules.</p>}
          {rules.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 text-sm">
              <div>
                <strong>{name(r.category_id, categories)}</strong> — {r.county_id ? `${name(r.county_id, counties)} County, ` : ''}{r.state_code}: {LABEL[r.requirement]}
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
          {decisions.map((d) => (
            <div key={`${d.contractor_id}:${d.category_id}`} className="flex items-start justify-between gap-3 border-b border-gray-100 py-2 text-sm">
              <div>
                {companies[d.contractor_id] || 'Archived contractor'} — {name(d.category_id, categories)}: {d.requirement === 'required' ? 'License required' : 'No license required'}
                {d.note && <div className="text-gray-500">{d.note}</div>}
                <div className="text-xs text-gray-400">Decided {new Date(d.decided_at).toLocaleDateString()}</div>
              </div>
              <Button size="sm" variant="ghost" disabled={busy} aria-label="Undo decision"
                onClick={() => run(() => supabase.from('contractor_license_determinations').delete().eq('contractor_id', d.contractor_id).eq('category_id', d.category_id))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </Card>
      </main>
    </div>
  );
}
