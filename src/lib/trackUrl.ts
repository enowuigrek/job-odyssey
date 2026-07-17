/**
 * Jedno źródło URL-i śledzących (poprzednio budowane w 3 miejscach).
 *
 * Domyślnie linki prowadzą przez funkcję Supabase — długi, "techniczny"
 * adres, który w podglądzie PDF potrafi wystraszyć rekrutera. Trzy poziomy
 * skracania, sprawdzane w kolejności:
 *   1. własna domena użytkownika, ustawiona w Ustawieniach (per-user,
 *      trzymana w Supabase `user_settings.tracking_domain`, cache'owana
 *      tu przez setUserTrackBase po zalogowaniu — trackUrl() jest funkcją
 *      synchroniczną wołaną z wielu miejsc bez await, stąd cache modułowy)
 *   2. VITE_TRACK_BASE_URL — globalna domena dla całej instancji appki
 *   3. fallback: bezpośredni adres funkcji Supabase
 * W każdym przypadku po stronie domeny musi istnieć przekierowanie
 * /r/* → funkcja Supabase (patrz notatki wdrożeniowe).
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const GLOBAL_BASE = (import.meta.env.VITE_TRACK_BASE_URL as string | undefined)?.replace(/\/+$/, '');

let userTrackBase: string | null = null;

/** Wołane po zalogowaniu (i po zapisaniu ustawień) — patrz AppContext/SettingsPage */
export function setUserTrackBase(domain: string | null | undefined) {
  userTrackBase = domain ? domain.trim().replace(/\/+$/, '') : null;
}

export function trackUrl(token: string): string {
  const base = userTrackBase || GLOBAL_BASE;
  if (base) return `${base}/${token}`;
  return `${SUPABASE_URL}/functions/v1/track?t=${token}`;
}

/**
 * Dopina https:// gdy URL wpisano bez protokołu (np. "www.linkedin.com/...").
 * Bez tego Location z funkcji track jest traktowane przez przeglądarkę jako
 * ścieżka względna i dokleja się do adresu funkcji.
 */
export function ensureHttps(url: string): string {
  const u = url.trim();
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/** Klucz porównywania URL-i niewrażliwy na protokół, www i końcowy ukośnik */
export function normalizeUrlKey(u: string): string {
  return u.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
}
