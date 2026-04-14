import { CVData, CVLink } from '../templates/cv/types';
import { defaultCVData } from '../templates/cv/defaultCVData';
import { openCVPrint } from '../pages/CVPrintPage';
import type { TrackingLink } from './db';

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
  const replaceLink = (link: CVLink): CVLink => ({
    ...link,
    url: urlMap.get(link.url) ?? link.url,
  });

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
 * Inject tracked URLs and open the CV print page in a new tab.
 * The tab auto-triggers window.print() after fonts load.
 */
export function generateCV(
  trackingLinks: TrackingLink[],
  cvData: CVData = defaultCVData
): void {
  const urlMap = buildTrackedUrlMap(trackingLinks, cvData);
  const trackedData = injectTrackedUrls(cvData, urlMap);
  openCVPrint(trackedData);
}
