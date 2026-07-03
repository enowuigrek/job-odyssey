import type { CVRole } from './types';

/**
 * "Position | Years" — falls back to title alone when years is empty, so
 * legacy CVs saved before the years field existed (with the range already
 * typed into title) keep rendering exactly as before.
 */
export function formatRoleLabel(role: CVRole): string {
  return role.years ? `${role.title} | ${role.years}` : role.title;
}
