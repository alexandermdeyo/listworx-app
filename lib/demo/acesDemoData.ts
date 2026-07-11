// Static, in-memory demo data for the /aces-demo sandbox.
// No Supabase, Stripe, or email calls are made anywhere in this file.
// Everything here is fake and safe to display, mutate locally, or reset.

// ---------------------------------------------------------------------------
// Types (mirror production shapes used by contractor-dashboard / requestor-
// dashboard / request components, kept independent so the demo can't drift
// production types out from under it).
// ---------------------------------------------------------------------------

export type DemoPartnerStatus = 'applied' | 'approved' | 'active' | 'paused' | 'rejected';

export type DemoTierId = 'basic' | 'preferred' | 'elite';

export interface DemoTier {
  id: DemoTierId;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  founderMonthlyPrice: number;
  badge: string | null;
  rotationPriority: 'standard' | 'priority' | 'top';
  territoryLock: boolean;
  description: string;
  features: string[];
  notIncluded: string[];
}

export interface DemoAddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'onetime' | 'monthly';
  includedIn: DemoTierId[];
}

export interface DemoContractorProfile {
  id: string;
  company_name: string;
  owner_name: string;
  email: string;
  phone: string;
  website?: string;
  bio: string;
  business_description?: string;
  license_number?: string;
  google_business_url?: string;
  trade: string;
  service_area_state: string;
  service_area_counties: string[];
  partner_status: DemoPartnerStatus;
  tier: DemoTierId | null;
  years_in_business: number;
  response_time: string;
  ironclad_accepted: boolean;
  founder_status: boolean;
  founding_partner_badge: boolean;
  profile_photo_url?: string;
  rating: number;
  review_count: number;
  created_at: string;
}

export type DemoRequesterType = 'Realtor' | 'Homeowner' | 'Property Manager';
export type DemoUrgency = 'FLEXIBLE' | 'WITHIN_MONTH' | 'WITHIN_WEEK' | 'IMMEDIATE';
export type DemoJobRequestStatus = 'PENDING' | 'ASSIGNED' | 'CLOSED' | 'NO_MATCH';

export interface DemoJobRequest {
  id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  requester_type: DemoRequesterType;
  property_address: string;
  property_city: string;
  property_state: string;
  property_county: string;
  job_description: string;
  urgency: DemoUrgency;
  status: DemoJobRequestStatus;
  categories: string[];
  budget_range: string;
  created_at: string;
}

export type DemoReferralStatus = 'PENDING' | 'CONTACTED' | 'HIRED' | 'CLOSED';

export interface DemoReferral {
  id: string;
  job_request_id: string;
  contractor_id: string;
  slot_position: number;
  tier_at_referral: DemoTierId;
  status: DemoReferralStatus;
  notes: string | null;
  created_at: string;
}

export interface DemoPerformanceData {
  totalReferrals: number;
  referralsThisMonth: number;
  referralsLast30Days: number;
  acceptedReferrals: number;
  declinedReferrals: number;
  completedJobs: number;
}

export interface DemoRequestorProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'REALTOR' | 'HOMEOWNER' | 'PROPERTY_MANAGER';
  brokerage?: string;
}

export interface DemoCategory {
  id: string;
  name: string;
}

export interface DemoState {
  id: string;
  code: string;
  name: string;
}

export interface DemoCounty {
  id: string;
  name: string;
  state_code: string;
}

export interface DemoRoleCard {
  id: 'contractor' | 'requestor' | 'aces_partner';
  title: string;
  description: string;
  href: string;
}

// ---------------------------------------------------------------------------
// Demo access gate (hardcoded, no Supabase table involved)
// ---------------------------------------------------------------------------

export const DEMO_ACCESS_CODE = 'ACES_LWX_2026';

export function isValidDemoAccessCode(input: string): boolean {
  return input.trim().toUpperCase() === DEMO_ACCESS_CODE;
}

// ---------------------------------------------------------------------------
// Tiers & add-ons (display-only subset, decoupled from lib/tiers-config.ts)
// ---------------------------------------------------------------------------

export const DEMO_TIERS: DemoTier[] = [
  {
    id: 'basic',
    name: 'Basic Partner',
    monthlyPrice: 199,
    annualPrice: 1990,
    founderMonthlyPrice: 159,
    badge: null,
    rotationPriority: 'standard',
    territoryLock: false,
    description: 'Get into the network and start receiving referrals in your trade and county.',
    features: [
      'Referral rotation — standard priority',
      'Basic contractor profile',
      'IronClad Standards certification',
      'Network membership',
      'ListWorx Academy access — including ACES Licensing and Exam Prep',
    ],
    notIncluded: [
      'Profile Boost',
      'Social Media Content Pack',
      'Monthly Performance Report',
      'Google Business Optimization',
      'Territory lock',
    ],
  },
  {
    id: 'preferred',
    name: 'Preferred Partner',
    monthlyPrice: 349,
    annualPrice: 3490,
    founderMonthlyPrice: 279,
    badge: null,
    rotationPriority: 'priority',
    territoryLock: false,
    description: 'Priority positioning plus the tools that make your profile worth clicking.',
    features: [
      'Priority rotation — above all Basic members',
      'Enhanced contractor profile',
      'IronClad Standards certification',
      'Monthly Performance Report — included ($29 value)',
      'IronClad Digital Badge Kit on signup ($29 value)',
      '1 Profile Boost per quarter ($49 value)',
      'Access to all marketing add-ons',
      'Full ListWorx Academy access — ACES licensing resources and ACES Trained badge on your profile',
    ],
    notIncluded: [
      'Additional Profile Boosts beyond quarterly',
      'Social Media Content Pack',
      'Google Business Optimization',
      'Territory lock',
    ],
  },
  {
    id: 'elite',
    name: 'Elite Partner',
    monthlyPrice: 599,
    annualPrice: 5990,
    founderMonthlyPrice: 479,
    badge: 'Elite',
    rotationPriority: 'top',
    territoryLock: true,
    description: 'Own your territory. No other Elite contractor of your trade in your county.',
    features: [
      'Top of rotation — always above Preferred and Basic',
      'Territory lock — 2 Elite spots per trade per county',
      'Enhanced contractor profile',
      'IronClad Standards certification',
      'Monthly Performance Report — included ($29 value)',
      'IronClad Digital Badge Kit on signup ($29 value)',
      'Profile Boost every month — included ($49/mo value)',
      'Social Media Content Pack — 2 posts/month included',
      'Google Business Profile Optimization on signup ($149 value)',
      'Annual featured contractor spotlight on ListWorx social media',
      'Full ListWorx Academy access — ACES licensing resources, ACES Trained badge, and priority course placement',
    ],
    notIncluded: [],
  },
];

export const DEMO_ADDONS: DemoAddOn[] = [
  { id: 'ironclad_badge_kit', name: 'IronClad Digital Badge Kit', description: 'Badge graphics for your own marketing.', price: 29, type: 'onetime', includedIn: ['preferred', 'elite'] },
  { id: 'profile_boost', name: 'Profile Boost', description: 'Move to the top of rotation for a month.', price: 79, type: 'monthly', includedIn: ['elite'] },
  { id: 'social_content_pack', name: 'Social Media Content Pack', description: 'Branded, ready-to-post graphics.', price: 149, type: 'monthly', includedIn: ['elite'] },
];

// ---------------------------------------------------------------------------
// Geography & trade categories (small demo subset)
// ---------------------------------------------------------------------------

export const DEMO_STATES: DemoState[] = [
  { id: 'tn', code: 'TN', name: 'Tennessee' },
  { id: 'mn', code: 'MN', name: 'Minnesota' },
];

export const DEMO_COUNTIES: DemoCounty[] = [
  { id: 'davidson', name: 'Davidson', state_code: 'TN' },
  { id: 'williamson', name: 'Williamson', state_code: 'TN' },
  { id: 'rutherford', name: 'Rutherford', state_code: 'TN' },
  { id: 'wilson', name: 'Wilson', state_code: 'TN' },
  { id: 'hennepin', name: 'Hennepin', state_code: 'MN' },
  { id: 'ramsey', name: 'Ramsey', state_code: 'MN' },
];

export const DEMO_CATEGORIES: DemoCategory[] = [
  { id: 'general_contractor', name: 'General Contractor' },
  { id: 'roofing', name: 'Roofing' },
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', name: 'Electrical' },
  { id: 'hvac', name: 'HVAC' },
];

// ---------------------------------------------------------------------------
// Contractors (includes the ACES flagship persona used by the ACES-specific
// dashboard/landing page, plus a handful of others to populate rotation /
// matching displays)
// ---------------------------------------------------------------------------

export const ACES_PARTNER_ID = 'demo-contractor-aces';

export const DEMO_CONTRACTORS: DemoContractorProfile[] = [
  {
    id: ACES_PARTNER_ID,
    company_name: 'Cumberland Valley Roofing',
    owner_name: 'Marcus Webb',
    email: 'marcus@cumberlandvalleyroofing.com',
    phone: '(615) 555-0142',
    website: 'cumberlandvalleyroofing.com',
    bio: 'Full-service roofing contractor serving Middle Tennessee for 15+ years.',
    business_description: 'We specialize in residential and commercial roofing, storm damage repair, and new construction roofing across the Nashville metro area.',
    license_number: 'TN-CON-48821',
    trade: 'Roofing',
    service_area_state: 'TN',
    service_area_counties: ['davidson', 'williamson', 'rutherford', 'wilson'],
    partner_status: 'active',
    tier: 'elite',
    years_in_business: 15,
    response_time: 'Usually responds within 1 hour',
    ironclad_accepted: true,
    founder_status: true,
    founding_partner_badge: true,
    rating: 4.9,
    review_count: 86,
    created_at: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'demo-contractor-blueridge',
    company_name: 'Blue Ridge Roofing',
    owner_name: 'Dana Ellis',
    email: 'dana@blueridgeroofing.example',
    phone: '(615) 555-0110',
    website: 'blueridgeroofing.example',
    bio: 'Residential and commercial roofing specialists.',
    trade: 'Roofing',
    service_area_state: 'TN',
    service_area_counties: ['davidson', 'rutherford'],
    partner_status: 'active',
    tier: 'basic',
    years_in_business: 8,
    response_time: 'Usually responds within 4 hours',
    ironclad_accepted: true,
    founder_status: false,
    founding_partner_badge: false,
    rating: 4.5,
    review_count: 31,
    created_at: '2025-03-02T00:00:00.000Z',
  },
  {
    id: 'demo-contractor-summit',
    company_name: 'Summit Plumbing Co',
    owner_name: 'Ray Torres',
    email: 'ray@summitplumbing.example',
    phone: '(615) 555-0133',
    website: 'summitplumbing.example',
    bio: 'Licensed master plumbers, residential and light commercial.',
    trade: 'Plumbing',
    service_area_state: 'TN',
    service_area_counties: ['williamson', 'davidson'],
    partner_status: 'active',
    tier: 'preferred',
    years_in_business: 11,
    response_time: 'Usually responds within 2 hours',
    ironclad_accepted: true,
    founder_status: false,
    founding_partner_badge: false,
    rating: 4.7,
    review_count: 54,
    created_at: '2025-02-10T00:00:00.000Z',
  },
  {
    id: 'demo-contractor-volunteer',
    company_name: 'Volunteer Electric',
    owner_name: 'Priya Nair',
    email: 'priya@volunteerelectric.example',
    phone: '(615) 555-0177',
    website: 'volunteerelectric.example',
    bio: 'Master electricians for new construction, remodels, and service calls.',
    trade: 'Electrical',
    service_area_state: 'TN',
    service_area_counties: ['davidson', 'williamson', 'rutherford'],
    partner_status: 'active',
    tier: 'elite',
    years_in_business: 9,
    response_time: 'Usually responds within 1 hour',
    ironclad_accepted: true,
    founder_status: false,
    founding_partner_badge: false,
    rating: 4.8,
    review_count: 63,
    created_at: '2025-01-28T00:00:00.000Z',
  },
  {
    id: 'demo-contractor-musiccity',
    company_name: 'Music City HVAC',
    owner_name: 'Leon Frazier',
    email: 'leon@musiccityhvac.example',
    phone: '(615) 555-0199',
    website: 'musiccityhvac.example',
    bio: 'Heating and cooling installation, repair, and maintenance.',
    trade: 'HVAC',
    service_area_state: 'TN',
    service_area_counties: ['davidson'],
    partner_status: 'paused',
    tier: 'basic',
    years_in_business: 6,
    response_time: 'Usually responds within 6 hours',
    ironclad_accepted: true,
    founder_status: false,
    founding_partner_badge: false,
    rating: 4.3,
    review_count: 19,
    created_at: '2025-04-18T00:00:00.000Z',
  },
  {
    id: 'demo-contractor-musiccity-plumbing',
    company_name: 'Music City Plumbing',
    owner_name: 'Carlos Mendez',
    email: 'carlos@musiccityplumbing.example',
    phone: '(615) 555-0188',
    website: 'musiccityplumbing.example',
    bio: 'Full-service plumbing for the greater Nashville area — repairs, repipes, and water heaters.',
    trade: 'Plumbing',
    service_area_state: 'TN',
    service_area_counties: ['wilson', 'davidson'],
    partner_status: 'active',
    tier: 'preferred',
    years_in_business: 10,
    response_time: 'Usually responds within 2 hours',
    ironclad_accepted: true,
    founder_status: false,
    founding_partner_badge: false,
    rating: 4.7,
    review_count: 47,
    created_at: '2025-03-20T00:00:00.000Z',
  },
  {
    id: 'demo-contractor-bluegrass-electrical',
    company_name: 'Bluegrass Electrical',
    owner_name: 'Sam Whitfield',
    email: 'sam@bluegrasselectrical.example',
    phone: '(615) 555-0166',
    website: 'bluegrasselectrical.example',
    bio: 'Residential electrical service, panel upgrades, and EV charger installs.',
    trade: 'Electrical',
    service_area_state: 'TN',
    service_area_counties: ['wilson'],
    partner_status: 'active',
    tier: 'basic',
    years_in_business: 5,
    response_time: 'Usually responds within 4 hours',
    ironclad_accepted: true,
    founder_status: false,
    founding_partner_badge: false,
    rating: 4.4,
    review_count: 22,
    created_at: '2025-05-05T00:00:00.000Z',
  },
];

export function getDemoContractorById(id: string): DemoContractorProfile | null {
  return DEMO_CONTRACTORS.find((c) => c.id === id) ?? null;
}

export const ACES_PARTNER: DemoContractorProfile = getDemoContractorById(ACES_PARTNER_ID)!;

// ---------------------------------------------------------------------------
// Requestor (realtor/homeowner) profile
// ---------------------------------------------------------------------------

export const DEMO_REQUESTOR_PROFILE: DemoRequestorProfile = {
  id: 'demo-requestor-jkane',
  full_name: 'Jessica Kane',
  email: 'jessica@kellerwilliams.example',
  phone: '(615) 555-0188',
  role: 'REALTOR',
  brokerage: 'Keller Williams Realty',
};

// Pre-fill values for the /aces-demo/requestor submission form.
export const DEMO_PREFILL_REQUEST = {
  clientName: DEMO_REQUESTOR_PROFILE.full_name,
  clientEmail: DEMO_REQUESTOR_PROFILE.email,
  clientPhone: DEMO_REQUESTOR_PROFILE.phone,
  companyName: DEMO_REQUESTOR_PROFILE.brokerage || '',
  propertyAddress: '212 Providence Trail',
  propertyCity: 'Mount Juliet',
  propertyState: 'TN',
  propertyCountyId: 'wilson',
  propertyZip: '37122',
  categoryId: 'roofing',
  urgency: 'WITHIN_WEEK' as DemoUrgency,
  description:
    'Pre-listing inspection turned up missing shingles and a soft spot near the chimney flashing. Need a full roof evaluation and repair estimate before we close next month.',
};

// ---------------------------------------------------------------------------
// Job requests
// ---------------------------------------------------------------------------

export const DEMO_JOB_REQUESTS: DemoJobRequest[] = [
  {
    id: 'demo-job-1',
    requester_name: 'Jessica Kane',
    requester_email: 'jessica@kellerwilliams.example',
    requester_phone: '(615) 555-0188',
    requester_type: 'Realtor',
    property_address: '412 Maple Grove Ln',
    property_city: 'Franklin',
    property_state: 'TN',
    property_county: 'Williamson',
    job_description: 'Pre-listing inspection flagged a roof repair needed before closing.',
    urgency: 'WITHIN_WEEK',
    status: 'ASSIGNED',
    categories: ['roofing'],
    budget_range: '$3,000 - $6,000',
    created_at: '2026-06-20T14:30:00.000Z',
  },
  {
    id: 'demo-job-2',
    requester_name: 'Jessica Kane',
    requester_email: 'jessica@kellerwilliams.example',
    requester_phone: '(615) 555-0188',
    requester_type: 'Realtor',
    property_address: '88 Riverbend Ct',
    property_city: 'Nashville',
    property_state: 'TN',
    property_county: 'Davidson',
    job_description: 'Kitchen remodel for a listing — need a general contractor for a full quote.',
    urgency: 'FLEXIBLE',
    status: 'ASSIGNED',
    categories: ['general_contractor'],
    budget_range: '$15,000 - $30,000',
    created_at: '2026-06-25T09:15:00.000Z',
  },
  {
    id: 'demo-job-3',
    requester_name: 'Tom Ricci',
    requester_email: 'tom.ricci@example.com',
    requester_phone: '(615) 555-0166',
    requester_type: 'Homeowner',
    property_address: '215 Autumn Oaks Dr',
    property_city: 'Murfreesboro',
    property_state: 'TN',
    property_county: 'Rutherford',
    job_description: 'Panel upgrade needed after home inspection turned up outdated wiring.',
    urgency: 'IMMEDIATE',
    status: 'ASSIGNED',
    categories: ['electrical'],
    budget_range: '$2,500 - $4,000',
    created_at: '2026-07-01T11:00:00.000Z',
  },
  {
    id: 'demo-job-4',
    requester_name: 'Angela Brooks',
    requester_email: 'angela.brooks@example.com',
    requester_phone: '(615) 555-0155',
    requester_type: 'Homeowner',
    property_address: '77 Sunset Ridge Rd',
    property_city: 'Nashville',
    property_state: 'TN',
    property_county: 'Davidson',
    job_description: 'AC unit is 15 years old and struggling — want a replacement quote.',
    urgency: 'WITHIN_MONTH',
    status: 'PENDING',
    categories: ['hvac'],
    budget_range: '$5,000 - $8,000',
    created_at: '2026-07-05T16:45:00.000Z',
  },
  {
    id: 'demo-job-5',
    requester_name: DEMO_PREFILL_REQUEST.clientName,
    requester_email: DEMO_PREFILL_REQUEST.clientEmail,
    requester_phone: DEMO_PREFILL_REQUEST.clientPhone,
    requester_type: 'Realtor',
    property_address: DEMO_PREFILL_REQUEST.propertyAddress,
    property_city: DEMO_PREFILL_REQUEST.propertyCity,
    property_state: DEMO_PREFILL_REQUEST.propertyState,
    property_county: 'Wilson',
    job_description: DEMO_PREFILL_REQUEST.description,
    urgency: DEMO_PREFILL_REQUEST.urgency,
    status: 'ASSIGNED',
    categories: [DEMO_PREFILL_REQUEST.categoryId],
    budget_range: '$3,500 - $7,000',
    created_at: '2026-07-08T10:00:00.000Z',
  },
];

export function getDemoJobRequestById(id: string): DemoJobRequest | null {
  return DEMO_JOB_REQUESTS.find((r) => r.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Referrals (links job requests <-> contractors)
// ---------------------------------------------------------------------------

export const DEMO_REFERRALS: DemoReferral[] = [
  { id: 'demo-ref-1', job_request_id: 'demo-job-1', contractor_id: 'demo-contractor-blueridge', slot_position: 1, tier_at_referral: 'basic', status: 'HIRED', notes: 'Scheduled walkthrough for Thursday.', created_at: '2026-06-20T14:35:00.000Z' },
  { id: 'demo-ref-2', job_request_id: 'demo-job-2', contractor_id: ACES_PARTNER_ID, slot_position: 1, tier_at_referral: 'elite', status: 'CONTACTED', notes: 'Sent estimate, awaiting response.', created_at: '2026-06-25T09:20:00.000Z' },
  { id: 'demo-ref-3', job_request_id: 'demo-job-2', contractor_id: 'demo-contractor-summit', slot_position: 2, tier_at_referral: 'preferred', status: 'PENDING', notes: null, created_at: '2026-06-25T09:20:00.000Z' },
  { id: 'demo-ref-4', job_request_id: 'demo-job-3', contractor_id: 'demo-contractor-volunteer', slot_position: 1, tier_at_referral: 'elite', status: 'HIRED', notes: 'Panel upgrade completed same week.', created_at: '2026-07-01T11:05:00.000Z' },
  { id: 'demo-ref-5', job_request_id: 'demo-job-1', contractor_id: ACES_PARTNER_ID, slot_position: 2, tier_at_referral: 'elite', status: 'CLOSED', notes: 'Requester went with another bid.', created_at: '2026-06-20T14:35:00.000Z' },
  { id: 'demo-ref-6', job_request_id: 'demo-job-5', contractor_id: ACES_PARTNER_ID, slot_position: 1, tier_at_referral: 'elite', status: 'CONTACTED', notes: 'Scheduling a roof inspection this week.', created_at: '2026-07-08T10:05:00.000Z' },
  { id: 'demo-ref-7', job_request_id: 'demo-job-5', contractor_id: 'demo-contractor-musiccity-plumbing', slot_position: 2, tier_at_referral: 'preferred', status: 'PENDING', notes: null, created_at: '2026-07-08T10:05:00.000Z' },
  { id: 'demo-ref-8', job_request_id: 'demo-job-5', contractor_id: 'demo-contractor-bluegrass-electrical', slot_position: 3, tier_at_referral: 'basic', status: 'PENDING', notes: null, created_at: '2026-07-08T10:05:00.000Z' },
];

export function getDemoReferralsForContractor(contractorId: string): DemoReferral[] {
  return DEMO_REFERRALS.filter((r) => r.contractor_id === contractorId);
}

export function getDemoReferralsForJobRequest(jobRequestId: string): DemoReferral[] {
  return DEMO_REFERRALS.filter((r) => r.job_request_id === jobRequestId);
}

// ---------------------------------------------------------------------------
// Performance stats (for the ACES partner persona)
// ---------------------------------------------------------------------------

export const DEMO_PERFORMANCE_DATA: DemoPerformanceData = {
  totalReferrals: 42,
  referralsThisMonth: 6,
  referralsLast30Days: 9,
  acceptedReferrals: 31,
  declinedReferrals: 4,
  completedJobs: 27,
};

// ---------------------------------------------------------------------------
// Fake matching (purely local; does NOT call lib/contractor-matching.ts)
// Mirrors the tier-weighted scoring shape for demo purposes only.
// ---------------------------------------------------------------------------

const DEMO_TIER_WEIGHTS: Record<DemoTierId, number> = {
  elite: 300,
  preferred: 200,
  basic: 100,
};

// Note: unlike the real contractor-matching.ts, this demo version ranks by
// county + active status + tier weight only (no category-level filtering).
// categoryIds is accepted for interface parity with the real request flow but
// isn't used to exclude candidates — the point being demonstrated here is
// tier-based rotation priority (Elite > Preferred > Basic), not the county/
// category join. This keeps the ranking deterministic for the demo script.
export function runDemoMatching(params: { countyId: string; categoryIds: string[] }): DemoContractorProfile[] {
  const { countyId } = params;

  const eligible = DEMO_CONTRACTORS.filter((c) => {
    if (c.partner_status !== 'active') return false;
    return c.service_area_counties.includes(countyId);
  });

  return eligible
    .map((c) => ({ contractor: c, score: c.tier ? DEMO_TIER_WEIGHTS[c.tier] : 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((entry) => entry.contractor);
}

// ---------------------------------------------------------------------------
// Demo home page role cards
// ---------------------------------------------------------------------------

export const DEMO_ROLE_CARDS: DemoRoleCard[] = [
  {
    id: 'contractor',
    title: 'Contractor Dashboard',
    description: 'See the referral rotation, subscription tiers, and performance stats a contractor partner sees.',
    href: '/aces-demo/contractor',
  },
  {
    id: 'requestor',
    title: 'Realtor / Homeowner Flow',
    description: 'Submit a sample job request and see it matched to contractors instantly.',
    href: '/aces-demo/requestor',
  },
  {
    id: 'aces_partner',
    title: 'ACES Partner Dashboard',
    description: 'A branded walkthrough of the dashboard built specifically for ACES as a partner.',
    href: '/aces-demo/aces-partner',
  },
];

// ---------------------------------------------------------------------------
// Contractor dashboard: profile completion & badges
// ---------------------------------------------------------------------------

export const DEMO_PROFILE_COMPLETION_PERCENT = 82;

export interface DemoBadge {
  id: string;
  label: string;
  description: string;
  icon: 'shield' | 'award' | 'briefcase' | 'graduation' | 'hardhat' | 'star' | 'crown';
  featured?: boolean;
  unlockedForTiers?: DemoTierId[];
}

export const DEMO_BADGES: DemoBadge[] = [
  {
    id: 'ironclad_verified',
    label: 'IronClad Verified',
    description: 'Meets every IronClad Standard for licensing, insurance, and background checks.',
    icon: 'shield',
  },
  {
    id: 'licensed',
    label: 'Licensed',
    description: 'Active state contractor license on file with ListWorx.',
    icon: 'award',
  },
  {
    id: 'insured',
    label: 'Insured',
    description: 'Current general liability insurance certificate on file.',
    icon: 'briefcase',
  },
  {
    id: 'aces_trained',
    label: 'ACES Trained',
    description: 'Verified through American Contractors Exam Services — the national standard for contractor licensing and exam prep.',
    icon: 'graduation',
    featured: true,
  },
  {
    id: 'osha_ready',
    label: 'OSHA Ready',
    description: 'Completed OSHA jobsite safety training modules.',
    icon: 'hardhat',
  },
  {
    id: 'elite_contractor',
    label: 'Elite Contractor',
    description: 'Elite Partner tier — top of rotation with a locked territory.',
    icon: 'star',
    unlockedForTiers: ['elite'],
  },
  {
    id: 'founding_partner',
    label: 'Founding Partner',
    description: "One of ListWorx's original founding partners, with a rate locked for life.",
    icon: 'crown',
  },
];

// ---------------------------------------------------------------------------
// ListWorx Academy
// ---------------------------------------------------------------------------

export const DEMO_ACADEMY_PROGRESS_PERCENT = 45;

export interface DemoCourse {
  id: string;
  title: string;
  description: string;
}

export interface DemoAcademyFeaturedPartner {
  name: string;
  label: string;
  poweredByBadge: string;
  courses: DemoCourse[];
}

export interface DemoAcademyCategory {
  id: string;
  name: string;
  courses: DemoCourse[];
  featuredPartner?: DemoAcademyFeaturedPartner;
}

export const DEMO_ACADEMY_CATEGORIES: DemoAcademyCategory[] = [
  {
    id: 'licensing_exam_prep',
    name: 'Licensing and Exam Prep',
    courses: [],
    featuredPartner: {
      name: 'ACES',
      label: 'Official Licensing Partner',
      poweredByBadge: 'Powered by ACES',
      courses: [
        { id: 'aces-license-prep', title: 'Contractor License Prep', description: 'Step-by-step preparation for your state contractor licensing exam.' },
        { id: 'aces-business-law', title: 'Business Law', description: 'The legal fundamentals every licensed contractor needs to know.' },
        { id: 'aces-exam-resources', title: 'Exam Prep Resources', description: 'Practice tests, flashcards, and study guides for licensing exams.' },
      ],
    },
  },
  {
    id: 'insurance',
    name: 'Insurance',
    courses: [
      { id: 'ins-liability-basics', title: 'General Liability Basics', description: 'What every contractor needs to know about coverage minimums.' },
      { id: 'ins-workers-comp', title: "Workers' Comp 101", description: "Understanding workers' comp requirements by state." },
    ],
  },
  {
    id: 'accounting_bookkeeping',
    name: 'Accounting and Bookkeeping',
    courses: [
      { id: 'acct-bookkeeping', title: 'Bookkeeping for Contractors', description: 'Track job costs, invoices, and expenses without the headache.' },
      { id: 'acct-tax-prep', title: 'Tax Prep Essentials', description: 'Quarterly estimates and deductions for small contracting businesses.' },
    ],
  },
  {
    id: 'osha_safety',
    name: 'OSHA and Safety',
    courses: [
      { id: 'osha-10-hour', title: 'OSHA 10-Hour Overview', description: 'Core jobsite safety training for contractors and crews.' },
      { id: 'osha-fall-protection', title: 'Fall Protection Basics', description: 'Safety fundamentals for roofing and elevated work.' },
    ],
  },
  {
    id: 'marketing_growth',
    name: 'Marketing and Growth',
    courses: [
      { id: 'mkt-referrals', title: 'Winning More Referrals', description: 'How to convert ListWorx referrals into signed jobs.' },
      { id: 'mkt-social', title: 'Social Media for Contractors', description: 'Building a following without hiring an agency.' },
    ],
  },
  {
    id: 'legal_contracts',
    name: 'Legal and Contracts',
    courses: [
      { id: 'legal-contract-basics', title: 'Contract Basics', description: 'What every homeowner contract should include.' },
      { id: 'legal-lien-rights', title: 'Lien Rights 101', description: 'Protecting your right to payment on every job.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Profile testimonials & marketing tools (visual-only mock content)
// ---------------------------------------------------------------------------

export interface DemoTestimonial {
  id: string;
  authorName: string;
  authorRole: string;
  quote: string;
  rating: number;
}

export const DEMO_TESTIMONIALS: DemoTestimonial[] = [
  {
    id: 'testimonial-1',
    authorName: 'Jessica Kane',
    authorRole: 'Realtor, Keller Williams Realty',
    quote: 'Cumberland Valley Roofing was fast, professional, and my clients loved working with them.',
    rating: 5,
  },
  {
    id: 'testimonial-2',
    authorName: 'Tom Ricci',
    authorRole: 'Homeowner',
    quote: 'Great communication from the first call to the final walkthrough.',
    rating: 5,
  },
  {
    id: 'testimonial-3',
    authorName: 'Angela Brooks',
    authorRole: 'Homeowner',
    quote: 'Showed up on time and left the site cleaner than they found it.',
    rating: 4,
  },
];

export interface DemoBeforeAfterExample {
  id: string;
  title: string;
}

export const DEMO_MARKETING_TOOLS = {
  socialPostTemplates: [
    'Before & After Spotlight',
    'Customer Review Highlight',
    'Seasonal Promotion',
    'Behind the Scenes',
  ],
  flyerTemplates: [
    'Roof Replacement Special',
    'Free Inspection Offer',
    'Storm Damage Checklist',
  ],
  beforeAfterExamples: [
    { id: 'ba-1', title: 'Franklin Roof Replacement' },
    { id: 'ba-2', title: 'Nashville Shingle Repair' },
  ] as DemoBeforeAfterExample[],
};

// ---------------------------------------------------------------------------
// ACES Partner Dashboard
//
// All figures below are derived, not independently picked, so the math holds
// up under a live gut-check:
//   - 61 active subscribers = 58 Basic ($199) + 2 Preferred ($349) + 1 Elite
//     ($599) = $12,839/mo gross revenue x 10% commission = $1,283.90 -> $1,284,
//     matching the Overview KPI exactly.
//   - 61 / 148 total referred = 41.2% -> 41% conversion, matching the KPI.
//   - The 6-month commission table sums to $6,597, which is intentionally
//     less than the $8,730 lifetime total -- the partnership predates the
//     visible 6-month window, so lifetime > recent-window sum (never the
//     reverse, which would be the inconsistency worth catching).
//   - Training Center: 124 click-throughs / 844 views = 14.7% conversion.
// ---------------------------------------------------------------------------

export const DEMO_ACES_OVERVIEW_STATS = {
  totalReferredContractors: 148,
  activeSubscribers: 61,
  pendingApplications: 24,
  estMonthlyCommission: 1284,
  lifetimeCommission: 8730,
  conversionRatePercent: 41,
};

export const DEMO_ACES_REFERRAL_LINK = 'listworx.co/partners/aces';
export const DEMO_ACES_PROMO_CODE = 'ACES10';

export interface DemoAcesMonthlyReferrals {
  month: string;
  count: number;
}

// Recent 6-month trend of new referrals. Deliberately sums to less than the
// 148 lifetime total referred -- this is a "last 6 months" trend chart, not
// the full history, so it should never sum to more than the lifetime figure.
export const DEMO_ACES_MONTHLY_REFERRALS: DemoAcesMonthlyReferrals[] = [
  { month: 'Feb', count: 16 },
  { month: 'Mar', count: 19 },
  { month: 'Apr', count: 22 },
  { month: 'May', count: 21 },
  { month: 'Jun', count: 26 },
  { month: 'Jul', count: 24 },
];

export type AcesReferralStatus = 'Active' | 'Pending' | 'Applied';

export interface DemoAcesReferredContractor {
  id: string;
  companyName: string;
  ownerName: string;
  plan: DemoTierId | null;
  status: AcesReferralStatus;
  signupDate: string;
  monthlySubscription: number;
}

export const ACES_COMMISSION_RATE = 0.1;

export function getAcesEstCommission(row: DemoAcesReferredContractor): number {
  return Math.round(row.monthlySubscription * ACES_COMMISSION_RATE * 100) / 100;
}

export const DEMO_ACES_REFERRED_CONTRACTORS: DemoAcesReferredContractor[] = [
  { id: 'aces-ref-1', companyName: 'Cumberland Valley Roofing', ownerName: 'Marcus Webb', plan: 'elite', status: 'Active', signupDate: '2025-01-15', monthlySubscription: 599 },
  { id: 'aces-ref-2', companyName: 'Franklin Fence & Deck Co', ownerName: 'Wesley Trent', plan: 'preferred', status: 'Active', signupDate: '2025-11-02', monthlySubscription: 349 },
  { id: 'aces-ref-3', companyName: 'Music City Concrete Works', ownerName: 'Dwight Palmer', plan: 'basic', status: 'Active', signupDate: '2025-12-10', monthlySubscription: 199 },
  { id: 'aces-ref-4', companyName: 'Harpeth Valley Landscaping', ownerName: 'Renee Sanborn', plan: 'basic', status: 'Active', signupDate: '2026-01-22', monthlySubscription: 199 },
  { id: 'aces-ref-5', companyName: 'Stones River Painting Co', ownerName: 'Alicia Ford', plan: 'preferred', status: 'Active', signupDate: '2026-02-14', monthlySubscription: 349 },
  { id: 'aces-ref-6', companyName: 'Southern Comfort HVAC', ownerName: 'Miguel Torres', plan: 'basic', status: 'Active', signupDate: '2026-03-05', monthlySubscription: 199 },
  { id: 'aces-ref-7', companyName: 'Nashville Ridge Builders', ownerName: 'Tyler Combs', plan: 'elite', status: 'Active', signupDate: '2026-03-28', monthlySubscription: 599 },
  { id: 'aces-ref-8', companyName: 'East Nashville Electric Works', ownerName: 'Jasmine Kotter', plan: 'basic', status: 'Active', signupDate: '2026-04-18', monthlySubscription: 199 },
  { id: 'aces-ref-9', companyName: 'Pinnacle Roofing Solutions', ownerName: 'Dana Whitmore', plan: null, status: 'Pending', signupDate: '2026-06-20', monthlySubscription: 0 },
  { id: 'aces-ref-10', companyName: 'Bell Buckle Custom Homes', ownerName: 'Owen Marsh', plan: null, status: 'Applied', signupDate: '2026-07-01', monthlySubscription: 0 },
];

export type AcesCommissionStatus = 'Paid' | 'Pending';

export interface DemoAcesMonthlyCommission {
  month: string;
  activeSubscribers: number;
  grossRevenue: number;
  commissionRate: number;
  estimatedPayout: number;
  status: AcesCommissionStatus;
}

export const DEMO_ACES_MONTHLY_COMMISSIONS: DemoAcesMonthlyCommission[] = [
  { month: 'Feb 2026', activeSubscribers: 42, grossRevenue: 8820, commissionRate: 0.1, estimatedPayout: 882, status: 'Paid' },
  { month: 'Mar 2026', activeSubscribers: 47, grossRevenue: 9870, commissionRate: 0.1, estimatedPayout: 987, status: 'Paid' },
  { month: 'Apr 2026', activeSubscribers: 51, grossRevenue: 10710, commissionRate: 0.1, estimatedPayout: 1071, status: 'Paid' },
  { month: 'May 2026', activeSubscribers: 55, grossRevenue: 11550, commissionRate: 0.1, estimatedPayout: 1155, status: 'Paid' },
  { month: 'Jun 2026', activeSubscribers: 58, grossRevenue: 12180, commissionRate: 0.1, estimatedPayout: 1218, status: 'Paid' },
  { month: 'Jul 2026', activeSubscribers: 61, grossRevenue: 12839, commissionRate: 0.1, estimatedPayout: 1284, status: 'Pending' },
];

export const DEMO_ACES_LIFETIME_STATS = {
  totalLifetimeEarnings: 8730,
  nextPayoutDate: 'August 1, 2026',
  paymentMethod: 'ACH on file',
};

export const DEMO_ACES_TRAINING_STATS = {
  viewsThisMonth: 844,
  clickThroughs: 124,
  examRegistrations: 31,
  conversionPercent: 14.7,
};

export interface DemoAcesMarketingAsset {
  id: string;
  title: string;
  description: string;
  type: 'flyer' | 'email' | 'social' | 'qr' | 'blurb';
}

export const DEMO_ACES_MARKETING_ASSETS: DemoAcesMarketingAsset[] = [
  { id: 'asset-flyer', title: 'ACES x ListWorx Co-Branded Flyer', description: 'Print-ready flyer for classrooms and career fairs.', type: 'flyer' },
  { id: 'asset-email', title: 'Student Email Copy', description: 'Ready-to-send email introducing ListWorx to your students.', type: 'email' },
  { id: 'asset-social', title: 'Social Post Copy', description: 'Caption and post copy for ACES social channels.', type: 'social' },
  { id: 'asset-qr', title: 'Referral Link QR Code', description: 'Scannable QR code linking to your referral page.', type: 'qr' },
  { id: 'asset-blurb', title: 'ACES Website Onboarding Blurb', description: 'Short partnership blurb for the ACES website.', type: 'blurb' },
];

// ---------------------------------------------------------------------------
// Contractor demo: Documents tab mock data
// ---------------------------------------------------------------------------

export type DemoComplianceStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'EXPIRED';

export interface DemoComplianceDoc {
  fileName: string;
  status: DemoComplianceStatus;
  expirationDate: string | null;
}

export const DEMO_LICENSE_DOC: DemoComplianceDoc = {
  fileName: 'TN_Contractor_License_2026.pdf',
  status: 'APPROVED',
  expirationDate: '2027-03-15',
};

export const DEMO_INSURANCE_DOC: DemoComplianceDoc = {
  fileName: 'COI_CumberlandValleyRoofing_2026.pdf',
  status: 'APPROVED',
  expirationDate: '2026-11-01',
};

export type DemoAdditionalDocType = 'CERTIFICATION' | 'AWARD' | 'OTHER';

export interface DemoAdditionalDocument {
  id: string;
  type: DemoAdditionalDocType;
  label: string;
  fileName: string;
  isPublic: boolean;
  uploadedAt: string;
}

export const DEMO_ADDITIONAL_DOCUMENTS: DemoAdditionalDocument[] = [
  { id: 'demo-doc-1', type: 'CERTIFICATION', label: 'OSHA 10-Hour Certification', fileName: 'OSHA_10_Cert.pdf', isPublic: true, uploadedAt: '2026-02-10' },
  { id: 'demo-doc-2', type: 'AWARD', label: 'BBB Torch Award for Ethics', fileName: 'BBB_Torch_Award.pdf', isPublic: true, uploadedAt: '2026-04-22' },
  { id: 'demo-doc-3', type: 'OTHER', label: 'State License Renewal Confirmation', fileName: 'License_Renewal_2026.pdf', isPublic: true, uploadedAt: '2026-06-01' },
];
