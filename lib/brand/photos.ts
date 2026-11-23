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
    src: '/images/library/realtor-home-tour-couple-b.webp',
    alt: 'A realtor showing a homeowner couple through a home',
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
  quickReferrals: { src: '/images/library/handyman-tablet-consultation.webp', alt: '' },
  quickFlyer: { src: '/images/brand/crew-painters-1.webp', alt: '' },
  quickLearning: { src: '/images/brand/playbook-cover-scene.webp', alt: '' },
  quickMedia: { src: '/images/library/media-camera-jobsite.webp', alt: '' },
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
  // Approved asset folder (Listworx 2.0 asset photos), Nov 2026
  homeownerTour: { src: '/images/library/realtor-home-tour-couple-b.webp', alt: 'A realtor showing a homeowner couple through a home' },
  realtorContractor: { src: '/images/library/realtor-contractor-water-heater.webp', alt: 'A realtor and a contractor checking a water heater' },
  inspectorFindings: { src: '/images/library/inspector-explains-findings.webp', alt: 'A contractor walking a homeowner through his findings' },
  tabletConsult: { src: '/images/library/handyman-tablet-consultation.webp', alt: 'A contractor reviewing an estimate with a homeowner on a tablet' },
  kitchenConsult: { src: '/images/library/contractor-kitchen-consultation.webp', alt: 'A contractor going over plans with a homeowner at her kitchen island' },
  roofer: { src: '/images/library/roofer-shingles-a.webp', alt: 'A roofer installing shingles' },
  hvacTech: { src: '/images/library/hvac-outdoor-b.webp', alt: 'An HVAC technician servicing an outdoor unit' },
  electrician: { src: '/images/library/electrician-panel-a.webp', alt: 'An electrician working in a breaker panel' },
  womanElectrician: { src: '/images/library/woman-electrician.webp', alt: 'An electrician wiring a panel' },
  plumber: { src: '/images/library/plumber-under-sink.webp', alt: 'A plumber repairing under-sink plumbing' },
  womanPlumber: { src: '/images/library/woman-plumber.webp', alt: 'A plumber inspecting a sink drain' },
  painterInterior: { src: '/images/library/painter-interior-a.webp', alt: 'A painter rolling an interior wall' },
  tile: { src: '/images/library/tile-floor-a.webp', alt: 'A tile installer setting a bathroom floor' },
  landscaper: { src: '/images/library/landscaper-flower-bed-a.webp', alt: 'A landscaper planting a flower bed' },
  cleaner: { src: '/images/library/house-cleaner-counter.webp', alt: 'A house cleaner wiping a kitchen counter' },
  gutter: { src: '/images/library/gutter-cleaning-autumn.webp', alt: 'A contractor clearing autumn leaves from a gutter' },
  windowInstall: { src: '/images/library/window-install.webp', alt: 'A contractor installing a window' },
  carpenter: { src: '/images/library/carpenter-miter-saw-a.webp', alt: 'A carpenter measuring lumber at a miter saw' },
  hvacMentor: { src: '/images/library/hvac-mentor-team.webp', alt: 'An experienced HVAC tech training a younger tech' },
  plansNewBuild: { src: '/images/library/plans-new-build-a.webp', alt: 'Two builders reviewing plans on a new build' },
  plansDesk: { src: '/images/library/plans-calculator-desk.webp', alt: 'Plans, a calculator and a pencil on a desk' },
  mediaCamera: { src: '/images/library/media-camera-jobsite.webp', alt: 'A contractor photographing finished work on site' },
  droneLake: { src: '/images/library/drone-lake-home-shoot.webp', alt: 'A drone capturing a lake home for a listing' },
  mediaFilming: { src: '/images/library/real-estate-media-filming.webp', alt: 'A videographer filming a realtor in a listing' },
  homeExterior: { src: '/images/library/home-exterior-curb-appeal.webp', alt: 'A well-kept home with fresh landscaping' },
  kitchenLake: { src: '/images/library/luxury-kitchen-lake-view.webp', alt: 'A finished kitchen with a lake view' },
} as const;
