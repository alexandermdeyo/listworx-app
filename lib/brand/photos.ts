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
  pathManualLibrary: null as PhotoSlot,
  featuredManualCover: null as PhotoSlot,
  featuredManualScene: { src: '/images/brand/crew-painters-1.webp', alt: '' },
  contractorBridge: { src: '/images/brand/crew-painters-2.webp', alt: 'A smiling painting crew outside a finished home' },
  dashboardHero: { src: '/images/brand/contractor-van.webp', alt: '' },
  quickReferrals: { src: '/images/redesign/results_house-exterior-dusk.webp', alt: '' },
  quickFlyer: { src: '/images/redesign/contractor_cleaning-crew.webp', alt: '' },
  quickLearning: { src: '/images/redesign/about_contractor-realtor-handshake.webp', alt: '' },
  quickMedia: { src: '/images/redesign/contractor_video-crew-content-shoot.webp', alt: '' },
} satisfies Record<string, PhotoSlot>;
