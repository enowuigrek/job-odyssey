import { pdf, DocumentProps } from '@react-pdf/renderer';
import React, { ReactElement } from 'react';
import { CVTemplate } from '../templates/cv/CVTemplate';
import { CVData, CVLink } from '../templates/cv/types';
import { defaultCVData } from '../templates/cv/defaultCVData';
import type { TrackingLink } from './db';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const TRACK_BASE = `${SUPABASE_URL}/functions/v1/track`;

/**
 * Build a mapping from original target URL → tracking URL.
 * Falls back to matching by label when URLs don't match exactly.
 */
function buildTrackedUrlMap(
  trackingLinks: TrackingLink[],
  cvData: CVData
): Map<string, string> {
  const map = new Map<string, string>();

  // Collect all CV links
  const allCvLinks: CVLink[] = [
    ...cvData.contact.links,
    ...cvData.projects.flatMap(p => p.links),
    ...cvData.experience.flatMap(e => [
      ...(e.companyLink ? [e.companyLink] : []),
    ]),
  ];

  for (const tl of trackingLinks) {
    const trackedUrl = `${TRACK_BASE}?t=${tl.token}`;

    // Match by targetUrl
    const byUrl = allCvLinks.find(
      l => l.url === tl.targetUrl || l.url === tl.targetUrl.replace(/\/$/, '')
    );
    if (byUrl) {
      map.set(byUrl.url, trackedUrl);
      continue;
    }

    // Fallback: match by label (case-insensitive)
    const byLabel = allCvLinks.find(
      l => l.label.toLowerCase() === tl.label.toLowerCase()
    );
    if (byLabel) {
      map.set(byLabel.url, trackedUrl);
    }
  }

  return map;
}

/**
 * Replace link URLs in CVData with tracked URLs where available.
 */
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
 * Generate a tracked CV PDF and trigger download.
 *
 * @param trackingLinks  Tracking links for the current application
 * @param fileName       Download filename (default: "CV Łukasz Nowak.pdf")
 * @param cvData         Optional custom CV data (defaults to hardcoded CV)
 */
export async function generateCV(
  trackingLinks: TrackingLink[],
  fileName = 'CV Łukasz Nowak.pdf',
  cvData: CVData = defaultCVData
): Promise<void> {
  const urlMap = buildTrackedUrlMap(trackingLinks, cvData);
  const trackedData = injectTrackedUrls(cvData, urlMap);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(CVTemplate, { data: trackedData }) as unknown as ReactElement<DocumentProps, any>;
  const blob = await pdf(element).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
