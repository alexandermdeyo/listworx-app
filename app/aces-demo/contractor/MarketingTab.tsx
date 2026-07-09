'use client';

import { useState } from 'react';
import { Image as ImageIcon, FileText, Wand2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEMO_MARKETING_TOOLS, type DemoTierId } from '@/lib/demo/acesDemoData';

function LockedOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 rounded-xl bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
      <Lock className="h-5 w-5 text-gray-400" />
      <p className="text-xs font-semibold text-gray-500">{label}</p>
    </div>
  );
}

export default function MarketingTab({ tier }: { tier: DemoTierId }) {
  const { toast } = useToast();
  const [postTemplate, setPostTemplate] = useState(DEMO_MARKETING_TOOLS.socialPostTemplates[0]);
  const [flyerTemplate, setFlyerTemplate] = useState(DEMO_MARKETING_TOOLS.flyerTemplates[0]);

  const socialUnlocked = tier === 'elite';
  const flyerUnlocked = tier === 'preferred' || tier === 'elite';

  function generate(kind: string) {
    toast({ title: 'Demo Mode', description: `${kind} generated — this is a visual mock, nothing was created or sent.` });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Marketing Tools</h2>
        <p className="text-sm text-gray-500">Visual-only previews of the ListWorx marketing suite.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Social post generator */}
        <div className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {!socialUnlocked && <LockedOverlay label="Included with Elite Partner" />}
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
            <ImageIcon className="h-4 w-4 text-lw-rust" /> Social Media Post Generator
          </h3>
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 aspect-video mb-3 flex items-center justify-center">
            <span className="text-xs text-gray-400">Preview: {postTemplate}</span>
          </div>
          <select
            value={postTemplate}
            onChange={(e) => setPostTemplate(e.target.value)}
            disabled={!socialUnlocked}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-3 disabled:opacity-50"
          >
            {DEMO_MARKETING_TOOLS.socialPostTemplates.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => generate('Social post')}
            disabled={!socialUnlocked}
            className="w-full rounded-lg bg-lw-rust px-4 py-2 text-sm font-semibold text-white hover:bg-lw-rust-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Post
          </button>
        </div>

        {/* Flyer generator */}
        <div className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          {!flyerUnlocked && <LockedOverlay label="Included with Preferred or Elite" />}
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-lw-rust" /> Flyer Generator
          </h3>
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 aspect-video mb-3 flex items-center justify-center">
            <span className="text-xs text-gray-400">Preview: {flyerTemplate}</span>
          </div>
          <select
            value={flyerTemplate}
            onChange={(e) => setFlyerTemplate(e.target.value)}
            disabled={!flyerUnlocked}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-3 disabled:opacity-50"
          >
            {DEMO_MARKETING_TOOLS.flyerTemplates.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => generate('Flyer')}
            disabled={!flyerUnlocked}
            className="w-full rounded-lg bg-lw-rust px-4 py-2 text-sm font-semibold text-white hover:bg-lw-rust-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Flyer
          </button>
        </div>
      </div>

      {/* Before/after showcase */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Wand2 className="h-4 w-4 text-lw-rust" /> Before / After Showcase Builder
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {DEMO_MARKETING_TOOLS.beforeAfterExamples.map((ex) => (
            <div key={ex.id} className="rounded-lg border border-gray-200 p-3">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="rounded bg-gray-100 aspect-square flex items-center justify-center text-xs text-gray-400">Before</div>
                <div className="rounded bg-gray-100 aspect-square flex items-center justify-center text-xs text-gray-400">After</div>
              </div>
              <p className="text-xs font-semibold text-gray-700">{ex.title}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => generate('Before/after showcase')}
          className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Add Project Photos
        </button>
      </div>
    </div>
  );
}
