// Google Analytics 4 helpers.
// The measurement ID is public (it ships in the page source on every GA site),
// so a fallback is safe. Override with NEXT_PUBLIC_GA_ID in Netlify if it ever changes.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-EXNSQYHZK2';

type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Fire a GA4 event. Safe to call anywhere — no-ops on the server,
 * when GA hasn't loaded, or if an ad blocker strips it.
 *
 * Key events to mark in GA (Admin → Events → mark as key event):
 *   generate_lead  — homeowner/realtor submitted a job request
 *   sign_up        — contractor submitted an application
 *   contact        — contact form sent
 *   newsletter_signup
 */
export function trackEvent(name: string, params: GtagParams = {}) {
  if (typeof window === 'undefined') return;
  try {
    window.gtag?.('event', name, params);
  } catch {
    // never let analytics break a form
  }
}
