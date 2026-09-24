import type { CVData } from '../templates/cv/types';
import type { JobApplication } from '../types';
import { normalizeCVData } from '../templates/cv/format';
import { normalizeUrlKey } from './trackUrl';

/**
 * Paczka aplikacji przygotowana poza appką (np. przez AI po przejrzeniu ofert) —
 * jeden plik JSON, z którego import tworzy aplikacje w statusie "Zapisana",
 * każdą z podpiętym, gotowym CV pod tę konkretną ofertę.
 *
 * Format celowo prosty i płaski, żeby dało się go wygenerować poza kodem appki:
 * {
 *   "version": 1,
 *   "items": [
 *     { "companyName": "...", "position": "...", "jobUrl": "...", "cv": { ...CVData } }
 *   ]
 * }
 */
export interface PackageItem {
  companyName: string;
  position: string;
  jobUrl?: string;
  location?: string;
  salaryOffered?: string;
  source?: string;
  notes?: string;
  /** Nazwa kafelka w Bazie CV; domyślnie "Firma — Stanowisko" */
  cvName?: string;
  cv?: CVData;
}

export type ParseResult =
  | { ok: true; items: PackageItem[] }
  | { ok: false; error: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Minimalna kontrola kształtu CV — tyle, żeby szablony PDF/podglądu się nie wysypały. */
function looksLikeCVData(v: unknown): v is CVData {
  if (!v || typeof v !== 'object') return false;
  const cv = v as Partial<CVData>;
  return (
    typeof cv.name === 'string' &&
    !!cv.contact && Array.isArray(cv.contact.links) &&
    Array.isArray(cv.experience) &&
    Array.isArray(cv.education) &&
    Array.isArray(cv.technologies) &&
    Array.isArray(cv.projects)
  );
}

export function parseApplicationPackage(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Plik nie jest poprawnym JSON-em.' };
  }
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { items?: unknown }).items)) {
    return { ok: false, error: 'Brak listy "items" w paczce — to nie wygląda na paczkę aplikacji.' };
  }

  const items: PackageItem[] = [];
  const rawItems = (raw as { items: unknown[] }).items;
  for (let i = 0; i < rawItems.length; i++) {
    const it = rawItems[i] as Record<string, unknown>;
    if (!it || !isNonEmptyString(it.companyName) || !isNonEmptyString(it.position)) {
      return { ok: false, error: `Pozycja ${i + 1}: brakuje nazwy firmy albo stanowiska.` };
    }
    if (it.cv !== undefined && !looksLikeCVData(it.cv)) {
      return { ok: false, error: `Pozycja ${i + 1} (${it.companyName}): CV ma niepoprawną strukturę.` };
    }
    items.push({
      companyName: it.companyName.trim(),
      position: it.position.trim(),
      jobUrl: isNonEmptyString(it.jobUrl) ? it.jobUrl.trim() : undefined,
      location: isNonEmptyString(it.location) ? it.location.trim() : undefined,
      salaryOffered: isNonEmptyString(it.salaryOffered) ? it.salaryOffered.trim() : undefined,
      source: isNonEmptyString(it.source) ? it.source.trim() : undefined,
      notes: isNonEmptyString(it.notes) ? it.notes : undefined,
      cvName: isNonEmptyString(it.cvName) ? it.cvName.trim() : undefined,
      cv: it.cv ? normalizeCVData(it.cv as CVData) : undefined,
    });
  }

  if (items.length === 0) return { ok: false, error: 'Paczka jest pusta.' };
  return { ok: true, items };
}

/**
 * Czy taka aplikacja już jest — po linku do oferty (niewrażliwie na protokół/www),
 * a gdy linku brak, po parze firma + stanowisko. Dzięki temu ponowny import tej
 * samej paczki nie tworzy duplikatów.
 */
export function isDuplicateApplication(item: PackageItem, existing: JobApplication[]): boolean {
  if (item.jobUrl) {
    const key = normalizeUrlKey(item.jobUrl);
    if (existing.some(a => a.jobUrl && normalizeUrlKey(a.jobUrl) === key)) return true;
  }
  const norm = (s: string) => s.trim().toLowerCase();
  return existing.some(
    a => norm(a.companyName) === norm(item.companyName) && norm(a.position) === norm(item.position)
  );
}
