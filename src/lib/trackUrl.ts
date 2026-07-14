/**
 * Jedno źródło URL-i śledzących (poprzednio budowane w 3 miejscach).
 *
 * Domyślnie linki prowadzą przez funkcję Supabase — długi, "techniczny"
 * adres, który w podglądzie PDF potrafi wystraszyć rekrutera. Ustawienie
 * VITE_TRACK_BASE_URL (np. https://lukasznowak.dev/r) skraca je do
 * przyjaznej postaci `https://domena/r/<token>`; po stronie tej domeny
 * musi istnieć przekierowanie /r/* → funkcja Supabase (patrz README/notatki).
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const CUSTOM_BASE = (import.meta.env.VITE_TRACK_BASE_URL as string | undefined)?.replace(/\/+$/, '');

export function trackUrl(token: string): string {
  if (CUSTOM_BASE) return `${CUSTOM_BASE}/${token}`;
  return `${SUPABASE_URL}/functions/v1/track?t=${token}`;
}
