import type { CVData } from './types';

export type SectionKey =
  | 'profile'
  | 'technologies'
  | 'projects'
  | 'experience'
  | 'education'
  | 'certificates'
  | 'custom'
  | 'interests'
  | 'rodo';

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'profile',
  'technologies',
  'projects',
  'experience',
  'education',
  'certificates',
  'custom',
  'interests',
  'rodo',
];

/**
 * Resolves the final render order for content sections (Nagłówek/Kontakt
 * always stay first and aren't part of this). Honors data.sectionOrder for
 * any keys that still exist, then appends anything missing (e.g. a CV
 * saved before sectionOrder existed) at its default spot.
 */
export function getSectionOrder(data: CVData): SectionKey[] {
  const stored = (data.sectionOrder ?? []) as SectionKey[];

  const seen = new Set<string>();
  const ordered: SectionKey[] = [];
  for (const key of stored) {
    if (DEFAULT_SECTION_ORDER.includes(key) && !seen.has(key)) {
      ordered.push(key);
      seen.add(key);
    }
  }
  for (const key of DEFAULT_SECTION_ORDER) {
    if (!seen.has(key)) {
      ordered.push(key);
      seen.add(key);
    }
  }
  return ordered;
}
