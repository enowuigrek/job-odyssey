/**
 * Shared CV design tokens for the two TS-based renderers (react-pdf and docx).
 * Both need the same colors but in different string formats (react-pdf wants
 * a leading #, docx wants bare hex) — keep the values in one place so a color
 * never drifts between the PDF and DOCX output again.
 *
 * CVHtml.css (used for the in-app preview) keeps its own CSS custom properties
 * since a .css file can't import from here — the hex values there must match
 * these manually.
 */

export const TEAL_HEX = '2D7D7D';
export const TEAL_LIGHT_HEX = '4a9a9a';
export const BLACK_HEX = '1C1C1C';
export const GRAY_HEX = '606060';

export const TEAL = `#${TEAL_HEX}`;
export const TEAL_LIGHT = `#${TEAL_LIGHT_HEX}`;
export const BLACK = `#${BLACK_HEX}`;
export const GRAY = `#${GRAY_HEX}`;
