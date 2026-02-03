const NORMALIZATIONS: Record<string, string> = {
  // Shopify
  'shopify': 'Shopify',
  'shopify inc': 'Shopify',
  'shopify inc.': 'Shopify',
  'shopify inc.,': 'Shopify',
  // Google
  'google': 'Google',
  'google inc': 'Google',
  'google inc.': 'Google',
  'google inc.,': 'Google',
  'alphabet': 'Google',
  'alphabet inc': 'Google',
  // Meta
  'meta': 'Meta',
  'meta platforms': 'Meta',
  'meta platforms inc': 'Meta',
  'facebook': 'Meta',
  'facebook inc': 'Meta',
  'facebook inc.': 'Meta',
  // Amazon
  'amazon': 'Amazon',
  'amazon.com': 'Amazon',
  'amazon web services': 'Amazon',
  'amazon aws': 'Amazon',
  'amazon web services, inc': 'Amazon',
  // Microsoft
  'microsoft': 'Microsoft',
  'microsoft corporation': 'Microsoft',
  'microsoft corp': 'Microsoft',
  'microsoft corp.': 'Microsoft',
  'microsoft corporation,': 'Microsoft',
  // Apple
  'apple': 'Apple',
  'apple inc': 'Apple',
  'apple inc.': 'Apple',
  // Netflix
  'netflix': 'Netflix',
  'netflix inc': 'Netflix',
  'netflix inc.': 'Netflix',
  // Common suffixes to strip
  ' inc': '',
  ' inc.': '',
  ' llc': '',
  ' llc.': '',
  ' corp': '',
  ' corp.': '',
  ' corporation': '',
  ' ltd': '',
  ' ltd.': '',
  ' group': '',
  ' group.': '',
  ' technologies': '',
  ' technology': '',
  ' solutions': '',
  ' services': '',
};

const COMMON_SUFFIXES = [
  'inc', 'inc.', 'llc', 'llc.', 'corp', 'corp.', 'corporation',
  'ltd', 'ltd.', 'group', 'technologies', 'technology', 'solutions', 'services'
];

export function normalizeCompanyName(name: string): string {
  if (!name) return '';

  let normalized = name.toLowerCase().trim();

  // Check exact mappings first
  if (NORMALIZATIONS[normalized]) {
    return NORMALIZATIONS[normalized];
  }

  // Remove common suffixes
  for (const suffix of COMMON_SUFFIXES) {
    const regex = new RegExp(`\\s+${suffix}\\.?$`, 'i');
    normalized = normalized.replace(regex, '');
  }

  // Title case result
  return normalized.split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function fuzzyMatch(a: string, b: string): boolean {
  const normA = normalizeCompanyName(a);
  const normB = normalizeCompanyName(b);

  if (normA === normB) return true;
  if (normA.includes(normB) || normB.includes(normA)) return true;

  const distance = levenshteinDistance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  const similarity = 1 - distance / maxLen;

  return similarity >= 0.8;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}
