import { useState, useCallback } from 'react';

export interface CvLinkMapping {
  originalUrl: string;  // URL z CV
  label: string;        // etykieta (LinkedIn, GitHub, etc.)
  type: 'linkedin' | 'github' | 'project' | 'other';
}

function storageKey(cvId: string) {
  return `cv-link-mappings-${cvId}`;
}

export function useCVLinkMappings(cvId: string | undefined) {
  const [mappings, setMappings] = useState<CvLinkMapping[]>(() => {
    if (!cvId) return [];
    try {
      const raw = localStorage.getItem(storageKey(cvId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const saveMappings = useCallback((updated: CvLinkMapping[]) => {
    if (!cvId) return;
    localStorage.setItem(storageKey(cvId), JSON.stringify(updated));
    setMappings(updated);
  }, [cvId]);

  const clearMappings = useCallback(() => {
    if (!cvId) return;
    localStorage.removeItem(storageKey(cvId));
    setMappings([]);
  }, [cvId]);

  return { mappings, saveMappings, clearMappings };
}

/**
 * Pobiera mapowania bezpośrednio z localStorage (poza hookiem, np. w handleGeneratePdf).
 */
export function getCVLinkMappings(cvId: string): CvLinkMapping[] {
  try {
    const raw = localStorage.getItem(storageKey(cvId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
