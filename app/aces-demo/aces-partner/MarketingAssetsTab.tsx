'use client';

import { FileText, Mail, Share2, QrCode, BookOpen, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEMO_ACES_MARKETING_ASSETS, type DemoAcesMarketingAsset } from '@/lib/demo/acesDemoData';

const ASSET_ICONS: Record<DemoAcesMarketingAsset['type'], React.ElementType> = {
  flyer: FileText,
  email: Mail,
  social: Share2,
  qr: QrCode,
  blurb: BookOpen,
};

function AssetPreview({ type }: { type: DemoAcesMarketingAsset['type'] }) {
  if (type === 'flyer') {
    return (
      <div className="aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 flex flex-col">
        <div className="flex-1" style={{ background: 'linear-gradient(135deg, #E8621A 0%, #1F2A44 100%)' }} />
        <div className="bg-white px-3 py-2 text-center">
          <p className="text-[10px] font-bold text-gray-900">ACES × ListWorx</p>
        </div>
      </div>
    );
  }

  if (type === 'qr') {
    return (
      <div className="aspect-[4/3] rounded-lg border border-gray-200 bg-white flex items-center justify-center">
        <div
          className="h-20 w-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #1F1F1F 0 4px, transparent 4px 8px), repeating-linear-gradient(90deg, #1F1F1F 0 4px, transparent 4px 8px)',
            backgroundBlendMode: 'multiply',
          }}
        />
      </div>
    );
  }

  const Icon = ASSET_ICONS[type];
  return (
    <div className="aspect-[4/3] rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
      <Icon className="h-8 w-8 text-gray-300" />
    </div>
  );
}

export default function MarketingAssetsTab() {
  const { toast } = useToast();

  function handleDownload(title: string) {
    toast({ title: 'Demo Mode', description: `${title} — no real file was downloaded.` });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Marketing Assets</h2>
        <p className="text-sm text-gray-500">Ready-to-use assets for promoting the ACES × ListWorx partnership to your students.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_ACES_MARKETING_ASSETS.map((asset) => {
          const Icon = ASSET_ICONS[asset.type];
          return (
            <div key={asset.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col">
              <AssetPreview type={asset.type} />
              <div className="flex items-start gap-2 mt-4 mb-1">
                <Icon className="h-4 w-4 text-lw-rust mt-0.5 flex-shrink-0" />
                <h3 className="text-sm font-bold text-gray-900">{asset.title}</h3>
              </div>
              <p className="text-xs text-gray-500 flex-1">{asset.description}</p>
              <button
                onClick={() => handleDownload(asset.title)}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-lw-rust px-4 py-2 text-sm font-semibold text-white hover:bg-lw-rust-hover transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
