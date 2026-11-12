/**
 * License requirements by trade and place — the client-side mirror of
 * public.license_requirement_for() (supabase/proposed/20261111000100_document_compliance.sql),
 * used by the application form before a contractor record and any admin decision exist.
 *
 * Order: county rule, else state rule, else unknown. "case_by_case" and unknown
 * both mean an administrator decides; neither is treated as "license required".
 */

export type LicenseRequirementValue = 'required' | 'not_required' | 'case_by_case';
export type LicenseResolution = 'required' | 'not_required' | 'needs_review';

export type LicenseRule = {
  category_id: string;
  state_code: string;
  county_id: string | null;
  requirement: LicenseRequirementValue;
  conditions?: string | null;
};

export type CountyRef = { id: string; state_code: string | null };

export function resolveLicenseRequirement(rules: LicenseRule[], categoryId: string, county: CountyRef): LicenseResolution {
  const state = (county.state_code || '').toUpperCase();
  const forTrade = rules.filter((r) => r.category_id === categoryId && r.state_code.toUpperCase() === state);
  const rule = forTrade.find((r) => r.county_id === county.id) || forTrade.find((r) => r.county_id === null);
  if (!rule) return 'needs_review';
  return rule.requirement === 'case_by_case' ? 'needs_review' : rule.requirement;
}

export type LicensePair = { categoryId: string; countyId: string };

export type ApplicationLicenseCheck = {
  /** Trade + county pairs where a rule says a license is required. */
  required: LicensePair[];
  /** Pairs with no rule or a case-by-case rule — ListWorx reviews these. */
  review: LicensePair[];
  /** False only when a license is required and none was uploaded. */
  ok: boolean;
};

/**
 * Checks the applicant's trades in every selected county. When the rules could
 * not be loaded (null), nothing is blocked: an administrator reviews instead.
 */
export function checkApplicationLicense(
  rules: LicenseRule[] | null,
  categoryIds: string[],
  counties: CountyRef[],
  hasLicense: boolean
): ApplicationLicenseCheck {
  const required: LicensePair[] = [];
  const review: LicensePair[] = [];
  for (const categoryId of categoryIds) {
    for (const county of counties) {
      const r = rules ? resolveLicenseRequirement(rules, categoryId, county) : 'needs_review';
      if (r === 'required') required.push({ categoryId, countyId: county.id });
      else if (r === 'needs_review') review.push({ categoryId, countyId: county.id });
    }
  }
  return { required, review, ok: hasLicense || required.length === 0 };
}

/** Storage path inside the contractor-documents bucket, taken from a stored (signed or public) URL. */
export function documentPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = /\/object\/(?:sign|public|authenticated)\/contractor-documents\/([^?]+)/.exec(url);
  return m ? m[1] : null;
}
