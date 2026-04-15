import { CVData, CVLink } from '../templates/cv/types';
import { defaultCVData } from '../templates/cv/defaultCVData';
import type { TrackingLink } from './db';

export const CV_PRINT_STORAGE_KEY = 'jo-cv-print-data';
export const CV_EDITOR_STORAGE_KEY = 'jo-cv-editor-data';

export function getCVEditorData(): CVData {
  const raw = localStorage.getItem(CV_EDITOR_STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw) as CVData; } catch { /* ignore */ }
  }
  return defaultCVData;
}

export function saveCVEditorData(data: CVData): void {
  localStorage.setItem(CV_EDITOR_STORAGE_KEY, JSON.stringify(data));
}

export function getCVDataById(cvId: string): CVData | null {
  const raw = localStorage.getItem(`jo-cv-data-${cvId}`);
  if (raw) {
    try { return JSON.parse(raw) as CVData; } catch { /* ignore */ }
  }
  return null;
}

export function saveCVDataById(cvId: string, data: CVData): void {
  localStorage.setItem(`jo-cv-data-${cvId}`, JSON.stringify(data));
}

export function deleteCVDataById(cvId: string): void {
  localStorage.removeItem(`jo-cv-data-${cvId}`);
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const TRACK_BASE = `${SUPABASE_URL}/functions/v1/track`;

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
  ];

  for (const tl of trackingLinks) {
    const trackedUrl = `${TRACK_BASE}?t=${tl.token}`;

    const byUrl = allCvLinks.find(
      l => l.url === tl.targetUrl || l.url === tl.targetUrl.replace(/\/$/, '')
    );
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
  };
}

/**
 * Inject tracked URLs and store in localStorage for CVGeneratorPage to pick up.
 * Returns the tracked CVData — caller should navigate to /cv-generator.
 */
export function prepareTrackedCV(
  trackingLinks: TrackingLink[],
  cvData: CVData = getCVEditorData(),
  cvId?: string
): CVData {
  if (cvId) {
    const stored = getCVDataById(cvId);
    if (stored) cvData = stored;
  }
  const urlMap = buildTrackedUrlMap(trackingLinks, cvData);
  const trackedData = injectTrackedUrls(cvData, urlMap);
  localStorage.setItem(CV_PRINT_STORAGE_KEY, JSON.stringify(trackedData));
  return trackedData;
}

/** Convenience alias kept for backwards compat */
export function generateCV(
  trackingLinks: TrackingLink[],
  cvData: CVData = defaultCVData
): void {
  prepareTrackedCV(trackingLinks, cvData);
}
