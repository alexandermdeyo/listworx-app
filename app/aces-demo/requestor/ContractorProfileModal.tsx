'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  ShieldCheck,
  Crown,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
} from 'lucide-react';
import { DEMO_COUNTIES, type DemoContractorProfile, type DemoTierId } from '@/lib/demo/acesDemoData';

const TIER_LABELS: Record<DemoTierId, string> = {
  basic: 'Basic Partner',
  preferred: 'Preferred Partner',
  elite: 'Elite Partner',
};

export default function ContractorProfileModal({
  contractor,
  open,
  onOpenChange,
}: {
  contractor: DemoContractorProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!contractor) return null;

  const counties = DEMO_COUNTIES.filter((c) => contractor.service_area_counties.includes(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg text-gray-900 bg-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-7 w-7 text-gray-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">{contractor.company_name}</DialogTitle>
              <p className="text-sm text-gray-500">{contractor.owner_name} · Owner</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mt-1">
          {contractor.tier && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: '#E8621A' }}
            >
              {TIER_LABELS[contractor.tier]}
            </span>
          )}
          {contractor.ironclad_accepted && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-0 gap-1">
              <ShieldCheck className="h-3 w-3" /> IronClad Verified
            </Badge>
          )}
          {contractor.founding_partner_badge && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0 gap-1">
              <Crown className="h-3 w-3" /> Founding Partner
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < Math.round(contractor.rating) ? 'text-lw-rust fill-lw-rust' : 'text-gray-200'}`}
            />
          ))}
          <span className="text-sm font-semibold text-gray-900 ml-1">{contractor.rating.toFixed(1)}</span>
          <span className="text-sm text-gray-400">({contractor.review_count} reviews)</span>
        </div>

        <p className="text-sm text-gray-600 mt-3">{contractor.bio}</p>

        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            {counties.map((c) => c.name).join(', ')}
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            {contractor.years_in_business} years in business
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            {contractor.phone}
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 break-all">
            <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            {contractor.email}
          </div>
          {contractor.website && (
            <div className="flex items-center gap-1.5 text-gray-600 col-span-2 break-all">
              <Globe className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              {contractor.website}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 mt-4 text-xs text-gray-500">
          {contractor.response_time}. Trade: {contractor.trade}.
        </div>
      </DialogContent>
    </Dialog>
  );
}
