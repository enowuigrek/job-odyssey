import { CVData, CVLink } from '../templates/cv/types';
import { defaultCVData } from '../templates/cv/defaultCVData';
import { normalizeCVData } from '../templates/cv/format';
import { trackUrl, normalizeUrlKey } from './trackUrl';
import type { TrackingLink } from './db';
import type { CV } from '../types';

function cvEditorStorageKey(userId?: string) {
  return userId ? `jo-cv-editor-data-${userId}` : 'jo-cv-editor-data';
}

function cvPrintStorageKey(userId?: string) {
  return userId ? `jo-cv-print-data-${userId}` : 'jo-cv-print-data';
}

export function getCVEditorData(userId?: string): CVData {
  const raw = localStorage.getItem(cvEditorStorageKey(userId));
  if (raw) {
    try { return normalizeCVData(JSON.parse(raw) as CVData); } catch { /* ignore */ }
  }
  return defaultCVData;
}

export function saveCVEditorData(data: CVData, userId?: string): void {
  localStorage.setItem(cvEditorStorageKey(userId), JSON.stringify(data));
}

export function getCVPrintData(userId?: string): CVData | null {
  const raw = localStorage.getItem(cvPrintStorageKey(userId));
  if (raw) {
    try { return normalizeCVData(JSON.parse(raw) as CVData); } catch { /* ignore */ }
  }
  return null;
}

export function clearCVPrintData(userId?: string): void {
  localStorage.removeItem(cvPrintStorageKey(userId));
}

/**
 * Treść CV z generatora żyje w Supabase (kolumna `cvs.data`, patrz
 * `hydrateCVDataCache`), z lokalnym cache w localStorage dla szybkiego
 * synchronicznego odczytu — mnóstwo miejsc w kodzie woła getCVDataById
 * bez await. Cache jest zasilany z Supabase przy każdym logowaniu/odświeżeniu
 * (AppContext), więc "Otwórz w generatorze" i podgląd działają też na
 * urządzeniu, na którym dane CV nigdy nie były edytowane.
 */
export function getCVDataById(cvId: string): CVData | null {
  const raw = localStorage.getItem(`jo-cv-data-${cvId}`);
  if (raw) {
    try { return normalizeCVData(JSON.parse(raw) as CVData); } catch { /* ignore */ }
  }
  return null;
}

export function saveCVDataById(cvId: string, data: CVData): void {
  localStorage.setItem(`jo-cv-data-${cvId}`, JSON.stringify(data));
}

export function deleteCVDataById(cvId: string): void {
  localStorage.removeItem(`jo-cv-data-${cvId}`);
}

/**
 * Zasila lokalny cache treścią CV pobraną z Supabase — wołane raz po
 * załadowaniu stanu użytkownika (AppContext). Nie nadpisuje cache dla CV,
 * które w Supabase jeszcze nie mają `.data` (np. sam plik PDF bez treści
 * z generatora), żeby nie skasować danych utworzonych offline w tej sesji.
 */
export function hydrateCVDataCache(cvs: CV[]): void {
  for (const cv of cvs) {
    if (cv.data) {
      localStorage.setItem(`jo-cv-data-${cv.id}`, JSON.stringify(cv.data));
    }
  }
}

/**
 * Linki faktycznie użyte w CV (kontakt, projekty, firmy, certyfikaty) —
 * wspólne źródło dla generowania linków śledzących i modala "Śledzone linki".
 */
export function collectCvLinks(cv: CVData): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = [];
  cv.contact.links.forEach(l => out.push({ label: l.label, url: l.url }));
  if (cv.showProjects !== false) {
    cv.projects.forEach(p => p.links.forEach(l =>
      out.push({ label: p.name ? `${p.name} - ${l.label}` : l.label, url: l.url })
    ));
  }
  cv.experience.forEach(e => {
    if (e.companyLink?.url) out.push({ label: e.companyLink.label || e.company, url: e.companyLink.url });
  });
  if (cv.showCertificates !== false) {
    (cv.certificates ?? []).forEach(c => { if (c.url) out.push({ label: c.name, url: c.url }); });
  }
  return out.filter(l => l.url?.trim());
}

/**
 * Build a mapping from original CV link URL → tracked URL.
 * Matches by targetUrl first, falls back to label.
 */
function buildTrackedUrlMap(
  trackingLinks: TrackingLink[],
  cvData: CVData
): Map<string, string> {
  const map = new Map<string, string>();

  const allCvLinks: CVLink[] = [
    ...cvData.contact.links,
    ...cvData.projects.flatMap(p => p.links),
    ...cvData.experience.flatMap(e => (e.companyLink ? [e.companyLink] : [])),
    // Certyfikaty z plikiem/URL-em też są klikalnymi linkami w CV
    ...(cvData.certificates ?? []).flatMap(c => (c.url ? [{ label: c.name, url: c.url }] : [])),
  ];

  for (const tl of trackingLinks) {
    const trackedUrl = trackUrl(tl.token);

    // Porównanie niewrażliwe na protokół/www/ukośnik — targetUrl jest
    // normalizowany do https:// przy zapisie, a w CV bywa wpisany bez
    const byUrl = allCvLinks.find(l => normalizeUrlKey(l.url) === normalizeUrlKey(tl.targetUrl));
    if (byUrl) { map.set(byUrl.url, trackedUrl); continue; }

    const byLabel = allCvLinks.find(
      l => l.label.toLowerCase() === tl.label.toLowerCase()
    );
    if (byLabel) map.set(byLabel.url, trackedUrl);
  }

  return map;
}

function injectTrackedUrls(data: CVData, urlMap: Map<string, string>): CVData {
  const replaceLink = (link: CVLink): CVLink => {
    const tracked = urlMap.get(link.url);
    return tracked ? { ...link, trackedUrl: tracked } : link;
  };

  return {
    ...data,
    contact: {
      ...data.contact,
      links: data.contact.links.map(replaceLink),
    },
    projects: data.projects.map(p => ({
      ...p,
      links: p.links.map(replaceLink),
    })),
    experience: data.experience.map(e => ({
      ...e,
      companyLink: e.companyLink ? replaceLink(e.companyLink) : undefined,
    })),
    certificates: (data.certificates ?? []).map(c => {
      if (!c.url) return c;
      const tracked = urlMap.get(c.url);
      return tracked ? { ...c, trackedUrl: tracked } : c;
    }),
  };
}

/**
 * Inject tracked URLs and store in localStorage for CVGeneratorPage to pick up.
 * Returns the tracked CVData — caller should navigate to /cv-generator.
 */
export function prepareTrackedCV(
  trackingLinks: TrackingLink[],
  cvData: CVData = getCVEditorData(),
  cvId?: string,
  userId?: string
): CVData {
  if (cvId) {
    const stored = getCVDataById(cvId);
    if (stored) cvData = stored;
  }
  const urlMap = buildTrackedUrlMap(trackingLinks, cvData);
  const trackedData = injectTrackedUrls(cvData, urlMap);
  localStorage.setItem(cvPrintStorageKey(userId), JSON.stringify(trackedData));
  return trackedData;
}

/** Convenience alias kept for backwards compat */
export function generateCV(
  trackingLinks: TrackingLink[],
  cvData: CVData = defaultCVData
): void {
  prepareTrackedCV(trackingLinks, cvData);
}
