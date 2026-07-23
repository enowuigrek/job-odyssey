/** Limity wersji próbnej — jedno źródło, żeby CVEditorPage/ApplicationsPage/SettingsPage się nie rozjechały. */
export const TRIAL_CV_LIMIT = 2;
export const TRIAL_APPLICATION_LIMIT = 15;

export const TRIAL_LIMIT_MESSAGE_CV =
  `Limit wersji próbnej (${TRIAL_CV_LIMIT} CV) — wpisz kod dostępu w Ustawieniach, żeby dodawać więcej.`;
export const TRIAL_LIMIT_MESSAGE_APPLICATION =
  `Limit wersji próbnej (${TRIAL_APPLICATION_LIMIT} aplikacji) — wpisz kod dostępu w Ustawieniach, żeby dodawać więcej.`;

/** Limit importów CV przez AI — serwerowo wymuszany w parse-cv (klientowy check to tylko UX). */
export const TRIAL_AI_IMPORT_LIMIT = 1;
export const FULL_AI_IMPORT_MONTHLY_LIMIT = 10;

export const TRIAL_LIMIT_MESSAGE_AI_IMPORT =
  'Import CV z AI jest dostępny raz w wersji próbnej — wpisz kod dostępu w Ustawieniach, żeby importować więcej razy.';
export const FULL_LIMIT_MESSAGE_AI_IMPORT =
  `Osiągnięto miesięczny limit importów CV z AI (${FULL_AI_IMPORT_MONTHLY_LIMIT}) — spróbuj ponownie w przyszłym miesiącu.`;
