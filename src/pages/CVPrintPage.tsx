import { useEffect } from 'react';
import { CVHtml } from '../templates/cv/CVHtml';
import { defaultCVData } from '../templates/cv/defaultCVData';
import type { CVData } from '../templates/cv/types';

const STORAGE_KEY = 'jo-cv-print-data';

export function CVPrintPage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const data: CVData = raw ? (JSON.parse(raw) as CVData) : defaultCVData;

  useEffect(() => {
    // Small delay so fonts and styles can load before print dialog opens
    const t = setTimeout(() => {
      window.print();
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return <CVHtml data={data} />;
}

/** Store tracked CV data and open the print page in a new tab */
export function openCVPrint(data: CVData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.open('/#/cv-print', '_blank');
}
