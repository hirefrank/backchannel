const LINKEDIN_URL_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;

export function isValidLinkedInUrl(url: string): boolean {
  return LINKEDIN_URL_REGEX.test(url.trim());
}

export function normalizeLinkedInUrl(url: string): string {
  let normalized = url.trim();
  if (!normalized.startsWith('http')) {
    normalized = 'https://' + normalized;
  }
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  return normalized;
}
