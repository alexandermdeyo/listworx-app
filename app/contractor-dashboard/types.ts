export interface ContractorProfile {
  id: string;
  user_id: string;
  email: string;
  company_name: string;
  owner_name: string;
  phone: string;
  website?: string;
  bio?: string;
  tagline?: string;
  business_description?: string;
  business_website?: string;
  google_business_url?: string;
  profile_photo_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  show_phone_public?: boolean;
  show_email_public?: boolean;
  profile_slug?: string;
  years_in_business?: number;
  license_number?: string;
  license_expiration_date?: string;
  insurance_expiration_date?: string;
  insurance_verified?: boolean;
  license_verified?: boolean;
  ironclad_accepted?: boolean;
  ironclad_accepted_at?: string;
  partner_status: string;
  tier?: string;
  subscription_tier?: string | null;
  founder_tier?: string | null;
  stripe_customer_id?: string;
  logo_url?: string;
  founder_status?: boolean;
  founding_partner?: boolean;
  founding_partner_badge?: boolean;
  ironclad_certified?: boolean;
  agreed_to_standards?: boolean;
  agreed_to_communications?: boolean;
  agreed_to_privacy_policy?: boolean;
  license_document_url?: string;
  insurance_document_url?: string;
  google_review_url?: string;
  yelp_url?: string;
  bbb_url?: string;
  subscription_status?: string;
  subscription_current_period_end?: string;
  notification_email?: boolean;
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
  license_document_url: string;
  insurance_document_url: string;
  google_review_url: string;
  yelp_url: string;
  bbb_url: string;
  facebook_url: string;
  instagram_url: string;
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
    name: 'Network Member',
    monthlyPrice: 249,
    annualPrice: 2490,
    badge: 'Entry Level',
    features: [
      'IronClad Verified status',
      'Profile on the ListWorx platform',
      'Listed in referral rotation — standard priority',
      'Contractor dashboard access',
      'Verified reviews system',
      'Availability and service-area controls',
    ],
    notIncluded: [
      'Priority referral placement',
      'Enhanced profile visibility',
      'Promotional video package',
    ],
  },
  {
    id: 'preferred',
    name: 'Network Partner',
    monthlyPrice: 429,
    annualPrice: 4290,
    badge: 'Most Popular',
    popular: true,
    features: [
      'Everything in Network Member',
      'Priority placement — above all Network Members',
      'Enhanced profile with additional photos and expanded bio',
      'IronClad Digital Badge Kit included',
      'AI Marketing Toolkit — social posts, follow-up emails, job templates',
      'Monthly performance report',
      'Quarterly profile boost',
    ],
    notIncluded: [
      'Top-priority referral positioning',
      'Promotional video package',
    ],
  },
  {
    id: 'elite',
    name: 'Network Elite',
    monthlyPrice: 729,
    annualPrice: 7290,
    badge: 'Top Tier',
    features: [
      'Everything in Network Partner',
      'Top of rotation — always above Partner and Member',
      'Territory lock — maximum 2 Elite per trade per county',
      'Monthly profile boost',
      '2 social media posts per month featuring your work',
      'Annual featured contractor spotlight',
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

