export interface ContractorProfile {
  id: string;
  user_id: string;
  email: string;
  company_name: string;
  owner_name: string;
  phone: string;
  website?: string;
  bio?: string;
  license_number?: string;
  license_expiration_date?: string;
  insurance_expiration_date?: string;
  insurance_verified?: boolean;
  license_verified?: boolean;
  ironclad_accepted?: boolean;
  ironclad_accepted_at?: string;
  partner_status: string;
  tier?: string;
  stripe_customer_id?: string;
  logo_url?: string;
  agreed_to_standards?: boolean;
  agreed_to_communications?: boolean;
  agreed_to_privacy_policy?: boolean;
  subscription_status?: string;
  subscription_current_period_end?: string;
  service_area_state?: string;
  service_area_counties?: string[];
  created_at: string;
  updated_at?: string;
}

export interface County {
  id: string;
  name: string;
  state_code: string;
}

export interface Trade {
  id: string;
  name: string;
}

export interface ApplicationFormState {
  first_name: string;
  last_name: string;
  company_name: string;
  owner_name: string;
  phone: string;
  years_in_business: string;
  primary_county: string;
  website: string;
  bio: string;
  license_number: string;
  license_expiration_date: string;
  insurance_expiration_date: string;
  selectedCounties: string[];
  selectedTrades: string[];
  selectedState: string;
  agreed_to_standards: boolean;
  agreed_to_communications: boolean;
  agreed_to_privacy_policy: boolean;
  volume_acknowledged: boolean;
}

export interface TierDisplay {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  badge: string;
  popular?: boolean;
  features: string[];
  notIncluded: string[];
}

export const TIERS: TierDisplay[] = [
  {
    id: 'basic',
    name: 'Basic Partner',
    monthlyPrice: 199,
    annualPrice: 1990,
    badge: 'Entry Level',
    features: [
      'Public profile in the contractor directory',
      'Eligible for referral matching in your service area',
      'Standard placement in referral rotation',
      'Credential tracking and compliance tools',
      'Email notifications for new referrals',
    ],
    notIncluded: [
      'Priority referral placement',
      'Enhanced profile visibility',
      'Promotional video package',
    ],
  },
  {
    id: 'preferred',
    name: 'Preferred Partner',
    monthlyPrice: 349,
    annualPrice: 3490,
    badge: 'Most Popular',
    popular: true,
    features: [
      'Everything in Basic',
      'Priority placement in referral matching',
      'Enhanced visibility with logo in your listing',
      'IronClad Certified Partner badge',
      'Referral analytics and reporting',
      'Dedicated account support',
    ],
    notIncluded: [
      'Top-priority referral positioning',
      'Promotional video package',
    ],
  },
  {
    id: 'elite',
    name: 'Elite Partner',
    monthlyPrice: 599,
    annualPrice: 5990,
    badge: 'Top Tier',
    features: [
      'Everything in Preferred',
      'Top-priority referral positioning',
      'Premium profile placement and IronClad Elite badge',
      'Advanced analytics dashboard',
      'Priority phone support',
      'Quarterly business review',
      'Annual: Professionally produced 60-second promo video',
    ],
    notIncluded: [],
  },
];

export const STATUS_LABELS: Record<string, string> = {
  applied: 'Application In Progress',
  approved: 'Approved – Subscription Required',
  active: 'Active Partner',
  paused: 'Subscription Paused',
  rejected: 'Not Approved',
};

