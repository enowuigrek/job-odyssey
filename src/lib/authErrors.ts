import type { AuthError } from '@supabase/supabase-js';

/** Supabase auth zwraca komunikaty po angielsku — appka jest po polsku, więc tłumaczymy znane kody. */
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Nieprawidłowy email lub hasło.',
  email_not_confirmed: 'Potwierdź adres email — sprawdź skrzynkę (także folder spam).',
  user_already_exists: 'Konto z tym adresem email już istnieje.',
  user_not_found: 'Nie znaleziono konta z tym adresem email.',
  weak_password: 'Hasło jest zbyt słabe — użyj co najmniej 6 znaków.',
  same_password: 'Nowe hasło musi różnić się od poprzedniego.',
  over_email_send_rate_limit: 'Zbyt wiele prób w krótkim czasie — spróbuj ponownie za chwilę.',
  over_request_rate_limit: 'Zbyt wiele prób w krótkim czasie — spróbuj ponownie za chwilę.',
  signup_disabled: 'Rejestracja jest obecnie wyłączona.',
  email_address_invalid: 'Podaj poprawny adres email.',
  session_expired: 'Sesja wygasła — zaloguj się ponownie.',
  session_not_found: 'Sesja wygasła — zaloguj się ponownie.',
};

export function translateAuthError(error: AuthError | null): string | null {
  if (!error) return null;
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  console.error('Nieprzetłumaczony błąd auth:', error.code, error.message);
  return 'Wystąpił błąd. Spróbuj ponownie.';
}
