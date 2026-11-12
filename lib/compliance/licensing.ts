/**
 * License requirements by trade and place — the client-side mirror of
 * public.license_requirement_for() (supabase/proposed/20261111000100_document_compliance.sql),
 * used by the application form before a contractor record and any admin decision exist.
 *
 * Order (same as the database): the contractor's county decision, the county
 * rule, the contractor's statewide decision, the state rule. "case_by_case",
 * "awaiting_determination" and nothing recorded all mean an administrator
 * decides; none is treated as "license required".
 */

export type LicenseRequirementValue = 'required' | 'not_required' | 'case_by_case' | 'awaiting_determination';
export type LicenseResolution = 'required' | 'not_required' | 'needs_review';

export type LicenseRule = {
  category_id: string;
  state_code: string;
  county_id: string | null;
  requirement: LicenseRequirementValue;
  conditions?: string | null;
};

export type CountyRef = { id: string; state_code: string | null };

/** An administrator's decision for one contractor, trade and jurisdiction. */
export type LicenseDecision = {
  contractor_id: string;
  category_id: string;
  state_code: string;
  county_id: string | null;
  requirement: Exclude<LicenseRequirementValue, 'case_by_case'>;
};

function toResolution(value: LicenseRequirementValue | undefined): LicenseResolution {
  return value === 'required' || value === 'not_required' ? value : 'needs_review';
}

export function resolveLicenseRequirement(
  rules: LicenseRule[],
  categoryId: string,
  county: CountyRef,
  decisions: LicenseDecision[] = [],
  contractorId?: string
): LicenseResolution {
  const state = (county.state_code || '').toUpperCase();
  const rulesHere = rules.filter((r) => r.category_id === categoryId && r.state_code.toUpperCase() === state);
  const decisionsHere = contractorId
    ? decisions.filter((d) => d.contractor_id === contractorId && d.category_id === categoryId && d.state_code.toUpperCase() === state)
    : [];
  const pick =
    decisionsHere.find((d) => d.county_id === county.id) ||
    rulesHere.find((r) => r.county_id === county.id) ||
    decisionsHere.find((d) => d.county_id === null) ||
    rulesHere.find((r) => r.county_id === null);
  return toResolution(pick?.requirement);
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
