import type { ApplicationStatus, JobApplication } from '../types';

/**
 * CV "dopasowane do oferty" = CV przypięte do aplikacji przygotowanej przez AI
 * (origin 'ai': import paczki albo agent-api). To część tej jednej aplikacji, a nie
 * CV do ponownego użycia — Baza CV i listy wyboru trzymają je osobno, żeby przy
 * kilkunastu aplikacjach tygodniowo nie zasypały głównych CV użytkownika.
 * Nie wymaga osobnej kolumny w bazie: wystarczy powiązanie aplikacja → cvId.
 */
export function aiApplicationByCvId(applications: JobApplication[]): Map<string, JobApplication> {
  const map = new Map<string, JobApplication>();
  for (const app of applications) {
    if (app.origin === 'ai' && app.cvId) map.set(app.cvId, app);
  }
  return map;
}

/** Statusy, po których aplikacja jest zamknięta — jej dopasowane CV schodzi na dół listy */
const CLOSED_STATUSES: ApplicationStatus[] = [
  'rejected_no_interview',
  'rejected_after_interview',
  'offer_declined',
  'withdrawn',
  'success',
];

export function isClosedApplication(app: JobApplication): boolean {
  return CLOSED_STATUSES.includes(app.status);
}
