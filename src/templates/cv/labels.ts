import type { CVData } from './types';

/**
 * Stałe etykiety CV (nagłówki sekcji bez własnego pola w edytorze, podpisy kontaktu)
 * w języku CV — wspólne dla PDF (CVTemplate), podglądu (CVHtml) i DOCX (CVDocx).
 * Tytuły sekcji z własnym polem (profileTitle, technologiesTitle…) mają pierwszeństwo,
 * tu są tylko ich wartości domyślne.
 */
const LABELS = {
  pl: {
    profile: 'OPIS',
    approach: 'PODEJŚCIE DO PRACY',
    technologies: 'TECHNOLOGIE I NARZĘDZIA',
    projects: 'WYBRANE PROJEKTY',
    experience: 'DOŚWIADCZENIE ZAWODOWE',
    education: 'WYKSZTAŁCENIE',
    certificates: 'Certyfikaty',
    interests: 'ZAINTERESOWANIA',
    phone: 'tel:',
    email: 'e-mail:',
  },
  en: {
    profile: 'PROFILE',
    approach: 'APPROACH',
    technologies: 'SKILLS AND TOOLS',
    projects: 'SELECTED PROJECTS',
    experience: 'PROFESSIONAL EXPERIENCE',
    education: 'EDUCATION',
    certificates: 'Certificates',
    interests: 'INTERESTS',
    phone: 'phone:',
    email: 'e-mail:',
  },
} as const;

export type CVLanguage = keyof typeof LABELS;

export function cvLanguage(data: Pick<CVData, 'language'>): CVLanguage {
  return data.language === 'en' ? 'en' : 'pl';
}

export function cvLabels(data: Pick<CVData, 'language'>) {
  return LABELS[cvLanguage(data)];
}
