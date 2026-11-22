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
  homeHero: { src: '/images/redesign/contractor_roofers-team-hero.webp', alt: '' },
  pathHomeowners: {
    src: '/images/redesign/realtor_couple-consultation-laptop.webp',
    alt: 'A homeowner couple reviewing contractor options with their realtor',
  },
  pathContractors: { src: '/images/redesign/contractor_hvac-crop.webp', alt: 'An HVAC technician servicing an outdoor unit' },
  pathManualLibrary: null as PhotoSlot,
  featuredManualCover: null as PhotoSlot,
  dashboardHero: { src: '/images/redesign/contractor_painter-wall-crop.webp', alt: '' },
  quickReferrals: { src: '/images/redesign/results_house-exterior-dusk.webp', alt: '' },
  quickFlyer: { src: '/images/redesign/contractor_cleaning-crew.webp', alt: '' },
  quickLearning: { src: '/images/redesign/about_contractor-realtor-handshake.webp', alt: '' },
  quickMedia: { src: '/images/redesign/contractor_video-crew-content-shoot.webp', alt: '' },
} satisfies Record<string, PhotoSlot>;
