import type { CVData, CVRole } from './types';

/**
 * "Position | Years" — falls back to title alone when years is empty, so
 * legacy CVs saved before the years field existed (with the range already
 * typed into title) keep rendering exactly as before.
 */
export function formatRoleLabel(role: CVRole): string {
  return role.years ? `${role.title} | ${role.years}` : role.title;
}

/** Tech category label with exactly one trailing ":" — strips any that was already typed in. */
export function formatTechCategory(category: string): string {
  return `${category.replace(/:\s*$/, '')}:`;
}

/** Interests joined for display — array in, "•"-separated string out. */
export function formatInterests(interests: string[]): string {
  return interests.filter(Boolean).join(' • ');
}

/**
 * Interests used to be a single "Kawa • Muzyka • Sport" string; normalizes
 * legacy localStorage data (still a plain string) into the current
 * string[] shape without needing a migration step.
 */
export function normalizeInterests(interests: unknown): string[] {
  if (Array.isArray(interests)) return interests;
  if (typeof interests === 'string' && interests.trim()) {
    return interests.split('•').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/** Applies all legacy-data normalizations to a freshly-loaded CVData. */
export function normalizeCVData(data: CVData): CVData {
  return { ...data, interests: normalizeInterests(data.interests) };
}
