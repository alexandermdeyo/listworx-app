/**
 * Brand redesign photo slots: one place to swap imagery.
 *
 * Each slot currently points at an existing approved photo as a stand-in.
 * When the approved ChatGPT photo set arrives, drop the files into
 * public/images/brand/ (names in that folder's README) and change the paths
 * here. No component needs editing. `null` means the slot shows a branded
 * navy panel until a photo is approved.
 */
export type PhotoSlot = { src: string; alt: string } | null;

export const BRAND_PHOTOS = {
  homeHero: { src: '/images/brand/home-hero-blueprints.webp', alt: '' },
  homeHeroMobile: { src: '/images/brand/home-hero-blueprints-mobile.webp', alt: '' },
  pathHomeowners: {
    src: '/images/redesign/realtor_couple-consultation-laptop.webp',
    alt: 'A homeowner couple reviewing contractor options with their realtor',
  },
  pathContractors: { src: '/images/brand/contractor-van.webp', alt: 'A ListWorx network contractor standing beside his work van' },
  pathManualLibrary: {
    src: '/images/brand/playbook-cover-scene.webp',
    alt: 'The ListWorx Contractor Business Playbook (coming soon)',
  } as PhotoSlot,
  featuredManualCover: {
    src: '/images/brand/playbook-cover-book.webp',
    alt: 'Cover of the ListWorx Contractor Business Playbook (coming soon)',
  } as PhotoSlot,
  featuredManualScene: { src: '/images/brand/crew-painters-1.webp', alt: '' },
  contractorBridge: { src: '/images/brand/crew-painters-2.webp', alt: 'A smiling painting crew outside a finished home' },
  dashboardHero: { src: '/images/brand/contractor-van.webp', alt: '' },
  quickReferrals: { src: '/images/redesign/results_house-exterior-dusk.webp', alt: '' },
  quickFlyer: { src: '/images/brand/crew-painters-1.webp', alt: '' },
  quickLearning: { src: '/images/brand/playbook-cover-scene.webp', alt: '' },
  quickMedia: { src: '/images/redesign/contractor_video-crew-content-shoot.webp', alt: '' },
} satisfies Record<string, PhotoSlot>;

/**
 * Approved photo library by subject, for pages across the site.
 * Only approved images (ChatGPT asset set + the earlier approved redesign set).
 * Files with "FLAGGED-logo" in the name are never used (fake company logos).
 */
export const LIB = {
  blueprints: { src: '/images/brand/home-hero-blueprints.webp', alt: 'A contractor and a crew lead reviewing blueprints on a framed jobsite' },
  contractorVan: { src: '/images/brand/contractor-van.webp', alt: 'A contractor standing beside a ListWorx work van' },
  paintCrew1: { src: '/images/brand/crew-painters-1.webp', alt: 'A painting crew smiling outside a finished home' },
  paintCrew2: { src: '/images/brand/crew-painters-2.webp', alt: 'A three-person painting crew in front of a house they painted' },
  playbookScene: { src: '/images/brand/playbook-cover-scene.webp', alt: 'The ListWorx Contractor Business Playbook on a kitchen table' },
  playbookBook: { src: '/images/brand/playbook-cover-book.webp', alt: 'Cover of the ListWorx Contractor Business Playbook' },
  handshake: { src: '/images/redesign/about_contractor-realtor-handshake.webp', alt: 'A realtor and a contractor shaking hands at a front door' },
  cleaningCrew: { src: '/images/redesign/contractor_cleaning-crew.webp', alt: 'A home cleaning professional at work in a living room' },
  hvac: { src: '/images/redesign/contractor_hvac-crop.webp', alt: 'An HVAC technician servicing an outdoor unit' },
  painterWall: { src: '/images/redesign/contractor_painter-wall-crop.webp', alt: 'A painter rolling a fresh coat on an interior wall' },
  roofers: { src: '/images/redesign/contractor_roofers-team-hero.webp', alt: 'A roofing crew working on a house' },
  videoCrew: { src: '/images/redesign/contractor_video-crew-content-shoot.webp', alt: 'A video crew filming a contractor for marketing content' },
  jobRequestKitchen: { src: '/images/redesign/jobrequest_laptop-screenshot-woman-kitchen.webp', alt: 'A homeowner submitting a ListWorx request on a laptop in her kitchen' },
  jobRequestDog: { src: '/images/redesign/jobrequest_laptop-screenshot-woman-dog.webp', alt: 'A homeowner requesting a contractor on her laptop at home' },
  jobRequestPhone: { src: '/images/redesign/jobrequest_phone-screenshot-man-dog.webp', alt: 'A homeowner requesting a contractor on his phone' },
  realtorCouple: { src: '/images/redesign/realtor_couple-consultation-laptop.webp', alt: 'A realtor reviewing contractor options with a homeowner couple' },
  drone: { src: '/images/redesign/realtor_drone-operator-listing-shoot.webp', alt: 'A drone operator capturing aerial listing photos' },
  photographer: { src: '/images/redesign/realtor_photographer-listing-shoot.webp', alt: 'A photographer shooting a home for a real estate listing' },
  houseDusk: { src: '/images/redesign/results_house-exterior-dusk.webp', alt: 'A home exterior photographed at dusk' },
  kitchenDark: { src: '/images/redesign/results_kitchen-dark-island-sunset.webp', alt: 'A finished kitchen with a dark island at sunset' },
  kitchenWhite: { src: '/images/redesign/results_kitchen-white-cabinets.webp', alt: 'A finished kitchen with white cabinets' },
  livingRoom: { src: '/images/redesign/results_living-room-fireplace-lake.webp', alt: 'A finished living room with a fireplace and lake view' },
} as const;
