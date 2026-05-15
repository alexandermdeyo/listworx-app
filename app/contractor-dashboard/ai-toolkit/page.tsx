'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader as Loader2, Copy, Check, Zap, ChevronDown, ChevronUp } from 'lucide-react';

// TODO: Gate by purchase of ai_toolkit / ai_marketing_toolkit add-on once that flow exists.

interface Tool {
  id: string;
  name: string;
  description: string;
}

const TOOLS: Tool[] = [
  { id: 'social_caption', name: 'Social Media Caption Generator', description: 'Generate 3 ready-to-post captions for Facebook or Instagram.' },
  { id: 'estimate_followup', name: 'Estimate Follow-Up Email', description: 'Send a warm, professional follow-up after giving a customer an estimate.' },
  { id: 'job_completion_thankyou', name: 'Job Completion Thank You', description: 'Thank your customer and include a natural review request.' },
  { id: 'review_request', name: 'Review Request Text', description: 'A short, friendly text that gets customers to leave a Google review.' },
  { id: 'hiring_post', name: 'Hiring Post Generator', description: 'Write a job posting that attracts real tradespeople.' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function AIToolkitPage() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [loading, setLoading] = useState(true);
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // per-tool state
  const [inputs, setInputs] = useState<Record<string, Record<string, string>>>({});
  const [results, setResults] = useState<Record<string, string | string[]>>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login?redirect=/contractor-dashboard/ai-toolkit'); return; }
      const { data: prof } = await supabase.from('contractor_profiles').select('*').eq('user_id', session.user.id).maybeSingle();
      setProfile(prof || {});
      // prefill inputs from profile
      const prefill: Record<string, string> = {
        business_name: prof?.company_name || '',
        your_name: prof?.owner_name || '',
        google_link: prof?.google_business_url || '',
        city: (prof?.service_area_counties?.[0]) || '',
      };
      const init: Record<string, Record<string, string>> = {};
      TOOLS.forEach(t => { init[t.id] = { ...prefill }; });
      setInputs(init);
      setLoading(false);
    };
    init();
  }, []);

  const setField = (tool: string, key: string, val: string) => {
    setInputs(prev => ({ ...prev, [tool]: { ...(prev[tool] || {}), [key]: val } }));
  };

  const generate = async (tool: string) => {
    setGenerating(tool);
    setErrors(prev => ({ ...prev, [tool]: '' }));
    try {
      const res = await fetch('/api/ai-toolkit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, inputs: inputs[tool] || {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResults(prev => ({ ...prev, [tool]: data.result }));
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [tool]: err.message }));
    } finally {
      setGenerating(null);
    }
  };

  const regenerateCaption = async (tool: string, index: number) => {
    setGenerating(`${tool}-${index}`);
    try {
      const res = await fetch('/api/ai-toolkit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, inputs: inputs[tool] || {} }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const newCaptions = Array.isArray(data.result) ? data.result : [data.result];
      setResults(prev => {
        const existing = (prev[tool] as string[]) || [];
        const updated = [...existing];
        updated[index] = newCaptions[0] || updated[index];
        return { ...prev, [tool]: updated };
      });
    } catch {
      // silently fail on regenerate
    } finally {
      setGenerating(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#E8621A]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="h-6 w-6 text-[#E8621A]" />
            <h1 className="text-2xl font-bold text-white">AI Marketing Toolkit</h1>
          </div>
          <p className="text-zinc-400">Generate professional marketing content for your business in seconds. Built specifically for contractors.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map(tool => {
            const isOpen = openTool === tool.id;
            const result = results[tool.id];
            const err = errors[tool.id];
            const inp = inputs[tool.id] || {};

            return (
              <div key={tool.id} className={`rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden ${isOpen ? 'sm:col-span-2' : ''}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{tool.name}</h3>
                      <p className="text-sm text-zinc-400 mt-1">{tool.description}</p>
                    </div>
                    <button
                      onClick={() => setOpenTool(isOpen ? null : tool.id)}
                      className="shrink-0 flex items-center gap-1 text-sm text-[#E8621A] hover:text-orange-400 transition-colors"
                    >
                      {isOpen ? <><ChevronUp className="h-4 w-4" /> Close</> : <><ChevronDown className="h-4 w-4" /> Open Tool</>}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-5 space-y-4">
                      {/* Social Caption */}
                      {tool.id === 'social_caption' && <>
                        <Field label="Trade" value={inp.trade || ''} onChange={v => setField(tool.id, 'trade', v)} />
                        <Field label="Job Type" value={inp.job_type || ''} onChange={v => setField(tool.id, 'job_type', v)} />
                        <Field label="City" value={inp.city || ''} onChange={v => setField(tool.id, 'city', v)} />
                        <div className="space-y-1">
                          <Label className="text-zinc-300 text-sm">Tone</Label>
                          <select value={inp.tone || 'Professional'} onChange={e => setField(tool.id, 'tone', e.target.value)}
                            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#E8621A]">
                            <option>Professional</option><option>Casual</option><option>Conversational</option>
                          </select>
                        </div>
                        <TextareaField label="Photo Description (optional)" value={inp.photo_description || ''} onChange={v => setField(tool.id, 'photo_description', v)} />
                        <GenerateButton tool={tool.id} generating={generating} onClick={() => generate(tool.id)} label="Generate 3 Captions" />
                        {err && <p className="text-sm text-red-400">{err}</p>}
                        {Array.isArray(result) && result.map((caption, i) => (
                          <div key={i} className="rounded-lg bg-zinc-800 p-4 space-y-2">
                            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{caption}</p>
                            <div className="flex gap-4">
                              <CopyButton text={caption} />
                              <button
                                onClick={() => regenerateCaption(tool.id, i)}
                                disabled={generating === `${tool.id}-${i}`}
                                className="text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                              >
                                {generating === `${tool.id}-${i}` ? 'Regenerating…' : 'Regenerate'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </>}

                      {/* Estimate Follow-Up */}
                      {tool.id === 'estimate_followup' && <>
                        <Field label="Customer Name" value={inp.customer_name || ''} onChange={v => setField(tool.id, 'customer_name', v)} />
                        <Field label="Job Type" value={inp.job_type || ''} onChange={v => setField(tool.id, 'job_type', v)} />
                        <Field label="Estimate Amount (e.g. $2,400)" value={inp.estimate_amount || ''} onChange={v => setField(tool.id, 'estimate_amount', v)} />
                        <Field label="Your Name" value={inp.your_name || ''} onChange={v => setField(tool.id, 'your_name', v)} />
                        <Field label="Business Name" value={inp.business_name || ''} onChange={v => setField(tool.id, 'business_name', v)} />
                        <GenerateButton tool={tool.id} generating={generating} onClick={() => generate(tool.id)} label="Generate Email" />
                        {err && <p className="text-sm text-red-400">{err}</p>}
                        <EditableResult tool={tool.id} value={result as string} onChange={v => setResults(p => ({ ...p, [tool.id]: v }))} />
                      </>}

                      {/* Job Completion Thank You */}
                      {tool.id === 'job_completion_thankyou' && <>
                        <Field label="Customer Name" value={inp.customer_name || ''} onChange={v => setField(tool.id, 'customer_name', v)} />
                        <Field label="Job Type" value={inp.job_type || ''} onChange={v => setField(tool.id, 'job_type', v)} />
                        <Field label="Your Name" value={inp.your_name || ''} onChange={v => setField(tool.id, 'your_name', v)} />
                        <div className="space-y-1">
                          <Label className="text-zinc-300 text-sm">Preferred Contact</Label>
                          <div className="flex gap-4">
                            {['text', 'email'].map(opt => (
                              <label key={opt} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                                <input type="radio" value={opt} checked={(inp.contact_preference || 'text') === opt}
                                  onChange={() => setField(tool.id, 'contact_preference', opt)} className="accent-[#E8621A]" />
                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                              </label>
                            ))}
                          </div>
                        </div>
                        <GenerateButton tool={tool.id} generating={generating} onClick={() => generate(tool.id)} label="Generate Message" />
                        {err && <p className="text-sm text-red-400">{err}</p>}
                        <EditableResult tool={tool.id} value={result as string} onChange={v => setResults(p => ({ ...p, [tool.id]: v }))} />
                        {result && <p className="text-xs text-zinc-500">This message includes a natural review request. Send it after every completed job.</p>}
                      </>}

                      {/* Review Request */}
                      {tool.id === 'review_request' && <>
                        <Field label="Customer Name" value={inp.customer_name || ''} onChange={v => setField(tool.id, 'customer_name', v)} />
                        <Field label="Your Name" value={inp.your_name || ''} onChange={v => setField(tool.id, 'your_name', v)} />
                        <Field label="Google Business Profile Link" value={inp.google_link || ''} onChange={v => setField(tool.id, 'google_link', v)} />
                        <GenerateButton tool={tool.id} generating={generating} onClick={() => generate(tool.id)} label="Generate Review Request" />
                        {err && <p className="text-sm text-red-400">{err}</p>}
                        {typeof result === 'string' && result && (
                          <div className="rounded-lg bg-zinc-800 p-4 space-y-2">
                            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{result}</p>
                            <div className="flex items-center justify-between">
                              <CopyButton text={result} />
                              <span className="text-xs text-zinc-500">{result.length} characters</span>
                            </div>
                          </div>
                        )}
                      </>}

                      {/* Hiring Post */}
                      {tool.id === 'hiring_post' && <>
                        <Field label="Trade" value={inp.trade || ''} onChange={v => setField(tool.id, 'trade', v)} />
                        <Field label="City" value={inp.city || ''} onChange={v => setField(tool.id, 'city', v)} />
                        <Field label="Pay Range (e.g. $22–$28/hour)" value={inp.pay_range || ''} onChange={v => setField(tool.id, 'pay_range', v)} />
                        <TextareaField label="Requirements" value={inp.requirements || ''} onChange={v => setField(tool.id, 'requirements', v)} />
                        <Field label="Business Name" value={inp.business_name || ''} onChange={v => setField(tool.id, 'business_name', v)} />
                        <GenerateButton tool={tool.id} generating={generating} onClick={() => generate(tool.id)} label="Generate Hiring Post" />
                        {err && <p className="text-sm text-red-400">{err}</p>}
                        <EditableResult tool={tool.id} value={result as string} onChange={v => setResults(p => ({ ...p, [tool.id]: v }))} />
                        {result && <p className="text-xs text-zinc-500">Ready to paste into Facebook Jobs, Indeed, or Craigslist.</p>}
                      </>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-zinc-300 text-sm">{label}</Label>
      <Input value={value} onChange={e => onChange(e.target.value)}
        className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-[#E8621A]" />
    </div>
  );
}

function TextareaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-zinc-300 text-sm">{label}</Label>
      <Textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-[#E8621A]" />
    </div>
  );
}

function GenerateButton({ tool, generating, onClick, label }: { tool: string; generating: string | null; onClick: () => void; label: string }) {
  const isLoading = generating === tool;
  return (
    <Button onClick={onClick} disabled={!!generating} className="bg-[#E8621A] hover:bg-[#d45516] text-white w-full">
      {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</> : label}
    </Button>
  );
}

function EditableResult({ tool, value, onChange }: { tool: string; value: string; onChange: (v: string) => void }) {
  if (!value) return null;
  return (
    <div className="space-y-2">
      <Textarea value={value} onChange={e => onChange(e.target.value)} rows={6}
        className="bg-zinc-800 border-zinc-700 text-white text-sm" />
      <CopyButton text={value} />
    </div>
  );
}
