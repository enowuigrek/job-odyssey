import { PDFDocument, PDFDict, PDFName, PDFArray, PDFString, PDFHexString, PDFStream, PDFRef } from 'pdf-lib';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const TRACK_BASE = `${SUPABASE_URL}/functions/v1/track`;

export interface LinkMapping {
  originalUrl: string;
  trackedUrl: string;
  label: string;
}

/**
 * Normalizuje URL do porównań (usuwa protokół, trailing slash, www opcjonalne).
 */
function normalizeUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
    .toLowerCase()
    .trim();
}

/**
 * Sprawdza czy dwa URL-e są "tym samym linkiem".
 */
function urlsMatch(a: string, b: string): boolean {
  return normalizeUrl(a) === normalizeUrl(b);
}

/**
 * Sprawdza czy string to prawdziwy URL (nie PDF ref jak "171 0 R").
 */
function isRealUrl(str: string): boolean {
  return /^(https?:\/\/|www\.)[a-zA-Z0-9]/.test(str) && str.length > 10 && !str.includes(' ');
}

/**
 * Wczytuje PDF, podmienia istniejące adnotacje linkowe /Link URI.
 * Zwraca { pdf, replacedCount }.
 */
export async function tagPdfLinks(
  pdfBytes: ArrayBuffer | Uint8Array,
  mappings: LinkMapping[]
): Promise<{ pdf: Uint8Array; replacedCount: number }> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  let replacedCount = 0;

  // ── Krok 1: podmień istniejące adnotacje URI ──────────────────────────────
  for (const page of pages) {
    const annots = page.node.lookup(PDFName.of('Annots'));
    if (!(annots instanceof PDFArray)) continue;

    for (let i = 0; i < annots.size(); i++) {
      const annotRef = annots.get(i);
      const annot = annots.context.lookup(annotRef);
      if (!(annot instanceof PDFDict)) continue;

      const subtype = annot.get(PDFName.of('Subtype'));
      if (!subtype || subtype.toString() !== '/Link') continue;

      const action = annot.get(PDFName.of('A'));
      if (!action) continue;
      const actionDict = annots.context.lookup(action);
      if (!(actionDict instanceof PDFDict)) continue;

      const actionType = actionDict.get(PDFName.of('S'));
      if (!actionType || actionType.toString() !== '/URI') continue;

      const uri = actionDict.get(PDFName.of('URI'));
      if (!uri) continue;

      let uriStr: string;
      if (uri instanceof PDFString) uriStr = uri.decodeText();
      else if (uri instanceof PDFHexString) uriStr = uri.decodeText();
      else uriStr = uri.toString();

      const mapping = mappings.find(m => urlsMatch(m.originalUrl, uriStr));
      if (mapping) {
        actionDict.set(PDFName.of('URI'), PDFString.of(mapping.trackedUrl));
        replacedCount++;
      }
    }
  }

  return { pdf: await pdfDoc.save(), replacedCount };
}

/**
 * Skanuje PDF i zwraca listę znalezionych linków (adnotacje URI).
 */
export async function extractPdfLinks(pdfBytes: ArrayBuffer | Uint8Array): Promise<string[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const links: string[] = [];

  for (const page of pages) {
    const annots = page.node.lookup(PDFName.of('Annots'));
    if (!(annots instanceof PDFArray)) continue;

    for (let i = 0; i < annots.size(); i++) {
      const annotRef = annots.get(i);
      const annot = annots.context.lookup(annotRef);
      if (!(annot instanceof PDFDict)) continue;

      const subtype = annot.get(PDFName.of('Subtype'));
      if (!subtype || subtype.toString() !== '/Link') continue;

      const action = annot.get(PDFName.of('A'));
      if (!action) continue;
      const actionDict = annots.context.lookup(action);
      if (!(actionDict instanceof PDFDict)) continue;

      const actionType = actionDict.get(PDFName.of('S'));
      if (!actionType || actionType.toString() !== '/URI') continue;

      const uri = actionDict.get(PDFName.of('URI'));
      if (!uri) continue;

      let uriStr: string;
      if (uri instanceof PDFString) uriStr = uri.decodeText();
      else if (uri instanceof PDFHexString) uriStr = uri.decodeText();
      else continue; // Pomiń indirect references (np. "171 0 R") — to nie są URL-e

      if (uriStr && isRealUrl(uriStr) && !links.includes(uriStr)) links.push(uriStr);
    }
  }

  return links;
}

/**
 * Skanuje content streams stron PDF szukając URL-i w tekście.
 * Używa wyłącznie pdf-lib (bez pdfjs-dist).
 */
export async function extractTextUrls(pdfBytes: ArrayBuffer | Uint8Array): Promise<string[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const urlRegex = /(https?:\/\/|www\.)[^\s\)>"]+/gi;
  const found: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const contentsRaw = page.node.get(PDFName.of('Contents'));
    if (!contentsRaw) continue;

    // Resolve: może być PDFRef, PDFStream lub PDFArray
    const contents = page.doc.context.lookup(contentsRaw);

    const streams: PDFStream[] = [];
    if (contents instanceof PDFStream) {
      streams.push(contents);
    } else if (contents instanceof PDFArray) {
      for (let j = 0; j < contents.size(); j++) {
        const item = page.doc.context.lookup(contents.get(j) as PDFRef);
        if (item instanceof PDFStream) streams.push(item);
      }
    }

    for (const stream of streams) {
      let text = '';
      try {
        const bytes = stream.getContents();
        text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      } catch {
        continue;
      }

      const matches = text.match(urlRegex);
      if (!matches) continue;

      for (const match of matches) {
        // Oczyść URL z końcowych artefaktów PDF
        const cleanUrl = match.replace(/[)\]>\"']+$/, '').trim();
        // Pomiń linki supabase i śmieci
        if (cleanUrl.toLowerCase().includes('supabase')) continue;
        if (!isRealUrl(cleanUrl)) continue;
        if (!found.includes(cleanUrl)) {
          found.push(cleanUrl);
        }
      }
    }
  }

  return found;
}

export function buildTrackUrl(token: string): string {
  return `${TRACK_BASE}?t=${token}`;
}
