/**
 * Domain Normalization Utilities
 *
 * These functions handle website domain input normalization for contractor applications.
 */

/**
 * Normalizes a website URL to just the domain name
 *
 * Examples:
 * - "alexdeyoproductions.com" -> "alexdeyoproductions.com"
 * - "https://alexdeyoproductions.com" -> "alexdeyoproductions.com"
 * - "http://www.alexdeyoproductions.com" -> "alexdeyoproductions.com"
 * - "www.example.com" -> "example.com"
 * - "  example.com  " -> "example.com"
 *
 * @param input - The raw website input from the user
 * @returns The normalized domain name
 */
export function normalizeDomain(input: string): string {
  if (!input) return '';

  let domain = input.trim();

  // Remove protocol (http://, https://)
  domain = domain.replace(/^https?:\/\//i, '');

  // Remove leading www.
  domain = domain.replace(/^www\./i, '');

  // Remove trailing slashes and paths
  domain = domain.split('/')[0];

  // Remove trailing whitespace
  domain = domain.trim();

  return domain;
}

/**
 * Validates that a string looks like a valid domain
 *
 * Requirements:
 * - Must contain at least one dot
 * - No spaces allowed
 * - Must have at least one character before and after the dot
 * - Basic format check (not comprehensive DNS validation)
 *
 * @param domain - The normalized domain to validate
 * @returns true if the domain appears valid
 */
export function isValidDomain(domain: string): boolean {
  if (!domain) return false;

  // No spaces allowed
  if (/\s/.test(domain)) return false;

  // Must contain at least one dot
  if (!domain.includes('.')) return false;

  // Basic format: at least one char, dot, at least two chars for TLD
  const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/;
  if (!domainPattern.test(domain)) return false;

  // Ensure there's content before and after the dot
  const parts = domain.split('.');
  if (parts.some(part => part.length === 0)) return false;

  return true;
}

/**
 * Converts a normalized domain to a full HTTPS URL for display
 *
 * @param domain - The normalized domain (e.g., "example.com")
 * @returns Full HTTPS URL (e.g., "https://example.com")
 */
export function domainToUrl(domain: string): string {
  if (!domain) return '';
  return `https://${domain}`;
}

/**
 * Get user-friendly error message for invalid domain
 *
 * @param domain - The domain that failed validation
 * @returns Error message string
 */
export function getDomainErrorMessage(domain: string): string {
  if (!domain) {
    return 'Please enter a website domain';
  }

  if (/\s/.test(domain)) {
    return 'Domain cannot contain spaces';
  }

  if (!domain.includes('.')) {
    return 'Please enter a valid domain (e.g., example.com)';
  }

  return 'Please enter a valid domain name (e.g., example.com)';
}
