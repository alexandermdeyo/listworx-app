import {
  Home,
  Wind,
  Droplet,
  Zap,
  Trees,
  PaintRoller,
  HardHat,
  Layers,
  ChefHat,
  Bath,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export interface ServiceCategory {
  label: string;
  /** exact `categories.name` value in Supabase, used for /request prefill matching */
  value: string;
  icon: LucideIcon;
}

// Labels match common homeowner-facing terms; values are the exact category
// names seeded in supabase/migrations/20260315041522_seed_categories_trades.sql
// so ?category= round-trips cleanly into /request's matching logic.
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { label: 'Roofing', value: 'Roofing', icon: Home },
  { label: 'HVAC', value: 'HVAC', icon: Wind },
  { label: 'Plumbing', value: 'Plumbing', icon: Droplet },
  { label: 'Electrical', value: 'Electrical', icon: Zap },
  { label: 'Landscaping', value: 'Landscaping', icon: Trees },
  { label: 'Painting', value: 'Painting - Interior', icon: PaintRoller },
  { label: 'General Contracting', value: 'General Contractor', icon: HardHat },
  { label: 'Flooring', value: 'Flooring', icon: Layers },
  { label: 'Kitchen Remodeling', value: 'Remodeling - Kitchen', icon: ChefHat },
  { label: 'Bathroom Remodeling', value: 'Remodeling - Bathroom', icon: Bath },
  { label: 'Handyman', value: 'Handyman Services', icon: Wrench },
];
