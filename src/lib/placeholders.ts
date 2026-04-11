/**
 * Placeholder URL-e do wstawiania w CV.
 *
 * Użytkownik wstawia w PDF (Canva, Word, etc.) placeholder URL zamiast prawdziwego
 * linka. Przy generowaniu tracked PDF system podmienia placeholder na tracking URL.
 *
 * Format: https://jo.placeholder/{slug}
 * Slug jest generowany z etykiety linka (label).
 */

export const PLACEHOLDER_BASE = 'https://jo.placeholder';

/**
 * Generuje placeholder URL na podstawie etykiety linka.
 * Np. "LinkedIn" → "https://jo.placeholder/linkedin"
 *     "My Portfolio" → "https://jo.placeholder/my-portfolio"
 */
export function getPlaceholderUrl(label: string): string {
  const slug =
    label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // usuń diakrytyki
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'link';
  return `${PLACEHOLDER_BASE}/${slug}`;
}

/**
 * Sprawdza czy URL jest placeholderem Job Odyssey.
 */
export function isPlaceholderUrl(url: string): boolean {
  return url.replace(/\/+$/, '').startsWith(PLACEHOLDER_BASE);
}
