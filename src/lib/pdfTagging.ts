import { PDFDocument, PDFDict, PDFName, PDFArray, PDFString, PDFHexString, PDFStream, PDFRef, PDFPage } from 'pdf-lib';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const TRACK_BASE = `${SUPABASE_URL}/functions/v1/track`;

export interface LinkMapping {
  originalUrl: string;
  trackedUrl: string;
  label: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
    .toLowerCase()
    .trim();
}

function urlsMatch(a: string, b: string): boolean {
  return normalizeUrl(a) === normalizeUrl(b);
}

function isRealUrl(str: string): boolean {
  return /^(https?:\/\/|www\.)[a-zA-Z0-9]/.test(str) && str.length > 10 && !str.includes(' ');
}

// ── FlateDecode decompression (browser DecompressionStream API) ──────────────

async function decompressFlate(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream not available');
  }
  const ds = new DecompressionStream('deflate');
  // Slice to exact byte range — data.buffer may be a larger underlying buffer
  const plainBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const blob = new Blob([plainBuffer]);
  const decompressed = blob.stream().pipeThrough(ds);
  const reader = decompressed.getReader();

  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const total = chunks.reduce((a, c) => a + c.length, 0);
  const result = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { result.set(c, off); off += c.length; }
  return result;
}

/**
 * Reads the (possibly compressed) content of a PDFStream as latin1 text.
 */
async function readStreamText(stream: PDFStream): Promise<string> {
  const raw = stream.getContents();
  const filter = stream.dict.get(PDFName.of('Filter'));

  if (filter && filter.toString() === '/FlateDecode') {
    try {
      const bytes = await decompressFlate(raw);
      return new TextDecoder('latin1').decode(bytes);
    } catch { /* fall through */ }
  }

  return new TextDecoder('latin1').decode(raw);
}

/**
 * Collects all content streams for a page (handles single stream & arrays).
 */
function getPageStreams(page: PDFPage, ctx: ReturnType<PDFDocument['getPages']>[0]['doc']['context']): PDFStream[] {
  const raw = page.node.get(PDFName.of('Contents'));
  if (!raw) return [];
  const resolved = ctx.lookup(raw);
  if (resolved instanceof PDFStream) return [resolved];
  if (resolved instanceof PDFArray) {
    const out: PDFStream[] = [];
    for (let i = 0; i < resolved.size(); i++) {
      const s = ctx.lookup(resolved.get(i) as PDFRef);
      if (s instanceof PDFStream) out.push(s);
    }
    return out;
  }
  return [];
}

// ── PDF content-stream text-position parser ──────────────────────────────────

interface TextSegment {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  width: number;
}

/**
 * Decodes basic PDF string escape sequences.
 */
function decodePdfStr(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

/**
 * Decodes a PDF hex string <...> to text.
 * Handles both single-byte hex and double-byte (CID/Unicode) hex.
 */
function decodeHexStr(hex: string): string {
  const inner = hex.slice(1, -1).replace(/\s/g, '');
  if (inner.length === 0) return '';

  // Try double-byte (UTF-16BE) first — common in CID fonts
  if (inner.length % 4 === 0) {
    let text = '';
    let isAsciiCompatible = true;
    for (let i = 0; i < inner.length; i += 4) {
      const code = parseInt(inner.substring(i, i + 4), 16);
      if (code > 0x7E || code < 0x20) isAsciiCompatible = false;
      text += String.fromCharCode(code);
    }
    // If all characters are printable ASCII range, likely correct interpretation
    if (isAsciiCompatible && text.length > 0) return text;
    // Otherwise still return it — might contain URL chars
    if (text.length > 0) return text;
  }

  // Single-byte hex
  let text = '';
  for (let i = 0; i < inner.length; i += 2) {
    text += String.fromCharCode(parseInt(inner.substring(i, i + 2), 16));
  }
  return text;
}

/**
 * Tokenizes a PDF content stream into an array of tokens.
 * Handles: numbers, (strings), [arrays], /names, operators.
 */
function tokenize(src: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    const ch = src[i];

    // skip whitespace
    if (ch <= ' ') { i++; continue; }

    // comment
    if (ch === '%') { while (i < len && src[i] !== '\n' && src[i] !== '\r') i++; continue; }

    // string literal (...)
    if (ch === '(') {
      let depth = 1;
      let s = '(';
      i++;
      while (i < len && depth > 0) {
        if (src[i] === '\\') { s += src[i] + (src[i + 1] ?? ''); i += 2; continue; }
        if (src[i] === '(') depth++;
        if (src[i] === ')') depth--;
        s += src[i]; i++;
      }
      tokens.push(s);
      continue;
    }

    // hex string <...>
    if (ch === '<' && src[i + 1] !== '<') {
      let s = '<';
      i++;
      while (i < len && src[i] !== '>') { s += src[i]; i++; }
      s += '>'; i++;
      tokens.push(s);
      continue;
    }

    // array [...]
    if (ch === '[') {
      let depth = 1;
      let s = '[';
      i++;
      while (i < len && depth > 0) {
        if (src[i] === '\\') { s += src[i] + (src[i + 1] ?? ''); i += 2; continue; }
        if (src[i] === '(') {
          // string inside array
          let sd = 1; s += '('; i++;
          while (i < len && sd > 0) {
            if (src[i] === '\\') { s += src[i] + (src[i + 1] ?? ''); i += 2; continue; }
            if (src[i] === '(') sd++;
            if (src[i] === ')') sd--;
            s += src[i]; i++;
          }
          continue;
        }
        if (src[i] === '[') depth++;
        if (src[i] === ']') depth--;
        s += src[i]; i++;
      }
      tokens.push(s);
      continue;
    }

    // regular token (number, operator, name)
    let tok = '';
    while (i < len && src[i] > ' ' && src[i] !== '(' && src[i] !== ')' && src[i] !== '[' && src[i] !== ']' && src[i] !== '<' && src[i] !== '>' && src[i] !== '%') {
      tok += src[i]; i++;
    }
    if (tok) tokens.push(tok);
  }

  return tokens;
}

/**
 * Parses a TJ array token e.g. [(hello) -120 (world)] into concatenated text.
 * Returns text and estimated width.
 */
function parseTJArray(arr: string, fontSize: number): { text: string; width: number } {
  const inner = arr.slice(1, -1); // strip [ ]
  let text = '';
  let i = 0;

  while (i < inner.length) {
    if (inner[i] === '(') {
      let depth = 1; let j = i + 1;
      while (j < inner.length && depth > 0) {
        if (inner[j] === '\\') { j += 2; continue; }
        if (inner[j] === '(') depth++;
        if (inner[j] === ')') depth--;
        j++;
      }
      text += decodePdfStr(inner.substring(i + 1, j - 1));
      i = j;
    } else if (inner[i] === '<') {
      // Hex string inside TJ array
      let j = i + 1;
      while (j < inner.length && inner[j] !== '>') j++;
      j++; // skip >
      text += decodeHexStr(inner.substring(i, j));
      i = j;
    } else if (inner[i] === '-' || inner[i] === '.' || (inner[i] >= '0' && inner[i] <= '9')) {
      let j = i;
      if (inner[j] === '-') j++;
      while (j < inner.length && (inner[j] === '.' || (inner[j] >= '0' && inner[j] <= '9'))) j++;
      const kern = parseFloat(inner.substring(i, j));
      if (kern < -150) text += ' '; // word gap
      i = j;
    } else {
      i++;
    }
  }

  return { text, width: text.length * fontSize * 0.52 };
}

/**
 * Parses a PDF content stream and returns text segments with positions.
 * Tracks: BT/ET, Tm, Td, TD, T*, TL, Tf, Tj, TJ, ', "
 */
function extractTextSegments(content: string): TextSegment[] {
  const tokens = tokenize(content);
  const segments: TextSegment[] = [];
  const stack: string[] = [];

  let fontSize = 12;
  let x = 0, y = 0;
  let lineStartX = 0;
  let leading = 0;

  for (const tok of tokens) {
    switch (tok) {
      case 'BT':
        x = 0; y = 0; lineStartX = 0;
        stack.length = 0;
        break;

      case 'ET':
        stack.length = 0;
        break;

      case 'Tf':
        if (stack.length >= 2) {
          const sz = Math.abs(parseFloat(stack[stack.length - 1]));
          if (sz > 0) fontSize = sz;
        }
        stack.length = 0;
        break;

      case 'Tm':
        if (stack.length >= 6) {
          const vals = stack.slice(-6).map(Number);
          x = vals[4]; y = vals[5]; lineStartX = x;
          const matSz = Math.abs(vals[3]);
          if (matSz > 0 && matSz !== 1) fontSize = matSz;
        }
        stack.length = 0;
        break;

      case 'Td':
        if (stack.length >= 2) {
          x += parseFloat(stack[stack.length - 2]);
          y += parseFloat(stack[stack.length - 1]);
          lineStartX = x;
        }
        stack.length = 0;
        break;

      case 'TD':
        if (stack.length >= 2) {
          const tx = parseFloat(stack[stack.length - 2]);
          const ty = parseFloat(stack[stack.length - 1]);
          x += tx; y += ty; lineStartX = x;
          leading = -ty;
        }
        stack.length = 0;
        break;

      case 'TL':
        if (stack.length >= 1) leading = parseFloat(stack[stack.length - 1]);
        stack.length = 0;
        break;

      case 'T*':
        x = lineStartX; y -= leading;
        stack.length = 0;
        break;

      case 'Tj': {
        const s = stack.length >= 1 ? stack[stack.length - 1] : '';
        let text = '';
        if (s.startsWith('(') && s.endsWith(')')) {
          text = decodePdfStr(s.slice(1, -1));
        } else if (s.startsWith('<') && s.endsWith('>')) {
          text = decodeHexStr(s);
        }
        if (text) {
          const w = text.length * fontSize * 0.52;
          segments.push({ text, x, y, fontSize, width: w });
          x += w;
        }
        stack.length = 0;
        break;
      }

      case 'TJ': {
        const a = stack.length >= 1 ? stack[stack.length - 1] : '';
        if (a.startsWith('[')) {
          const { text, width } = parseTJArray(a, fontSize);
          if (text) {
            segments.push({ text, x, y, fontSize, width });
            x += width;
          }
        }
        stack.length = 0;
        break;
      }

      case "'": {
        x = lineStartX; y -= leading;
        const s = stack.length >= 1 ? stack[stack.length - 1] : '';
        let text2 = '';
        if (s.startsWith('(') && s.endsWith(')')) {
          text2 = decodePdfStr(s.slice(1, -1));
        } else if (s.startsWith('<') && s.endsWith('>')) {
          text2 = decodeHexStr(s);
        }
        if (text2) {
          const w = text2.length * fontSize * 0.52;
          segments.push({ text: text2, x, y, fontSize, width: w });
          x += w;
        }
        stack.length = 0;
        break;
      }

      case '"': {
        x = lineStartX; y -= leading;
        const s = stack.length >= 1 ? stack[stack.length - 1] : '';
        let text3 = '';
        if (s.startsWith('(') && s.endsWith(')')) {
          text3 = decodePdfStr(s.slice(1, -1));
        } else if (s.startsWith('<') && s.endsWith('>')) {
          text3 = decodeHexStr(s);
        }
        if (text3) {
          const w = text3.length * fontSize * 0.52;
          segments.push({ text: text3, x, y, fontSize, width: w });
          x += w;
        }
        stack.length = 0;
        break;
      }

      default:
        // Operators that consume the stack without producing text
        if (/^[a-zA-Z*'"]/.test(tok) && !tok.startsWith('/')) {
          stack.length = 0;
        } else {
          // Operand (number, name, string, array) — push
          stack.push(tok);
        }
        break;
    }
  }

  return segments;
}

// ── URL position detection ───────────────────────────────────────────────────

interface UrlPosition {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Fast placeholder position finder — avoids full tokenization.
 * Searches raw decompressed stream text for placeholder markers and extracts
 * approximate positions from nearby PDF operators (Tm, Td, Tf).
 * This is orders of magnitude faster than tokenize+extractTextSegments.
 */
async function findPlaceholderPositionsFast(
  page: PDFPage,
  ctx: ReturnType<PDFDocument['getPages']>[0]['doc']['context'],
  urlsToFind: string[]
): Promise<UrlPosition[]> {
  const results: UrlPosition[] = [];
  const streams = getPageStreams(page, ctx);
  const MARKER = 'jo.placeholder';

  for (const stream of streams) {
    let rawText: string;
    try {
      rawText = await readStreamText(stream);
    } catch { continue; }

    // Quick check — skip streams without placeholder marker
    if (!rawText.includes(MARKER)) continue;

    for (const urlToFind of urlsToFind) {
      if (results.some(r => normalizeUrl(r.url) === normalizeUrl(urlToFind))) continue;

      // Search for the marker in raw stream
      const idx = rawText.indexOf(MARKER);
      if (idx === -1) continue;

      // Extract context before the match for position extraction (max 3000 chars)
      const contextBefore = rawText.substring(Math.max(0, idx - 3000), idx);

      let x = 72, y = 700, fontSize = 10;

      // Find last text matrix "a b c d tx ty Tm"
      const tmMatches = [...contextBefore.matchAll(/([-.\d]+)\s+([-.\d]+)\s+([-.\d]+)\s+([-.\d]+)\s+([-.\d]+)\s+([-.\d]+)\s+Tm/g)];
      if (tmMatches.length > 0) {
        const last = tmMatches[tmMatches.length - 1];
        x = parseFloat(last[5]);
        y = parseFloat(last[6]);
        const matSize = Math.abs(parseFloat(last[4]));
        if (matSize > 1) fontSize = matSize;
      }

      // Apply Td offsets after last Tm
      const lastTmEnd = tmMatches.length > 0
        ? (tmMatches[tmMatches.length - 1].index! + tmMatches[tmMatches.length - 1][0].length)
        : 0;
      const afterTm = contextBefore.substring(lastTmEnd);
      const tdMatches = [...afterTm.matchAll(/([-.\d]+)\s+([-.\d]+)\s+T[dD]/g)];
      for (const td of tdMatches) {
        x += parseFloat(td[1]);
        y += parseFloat(td[2]);
      }

      // Find font size from "/<name> <size> Tf"
      const tfMatches = [...contextBefore.matchAll(/\/\w+\s+([\d.]+)\s+Tf/g)];
      if (tfMatches.length > 0) {
        const sz = parseFloat(tfMatches[tfMatches.length - 1][1]);
        if (sz > 0) fontSize = sz;
      }

      const urlWidth = urlToFind.length * fontSize * 0.5;
      results.push({
        url: urlToFind,
        x: x - 2,
        y: y - 2,
        width: Math.max(urlWidth, 150) + 4,
        height: fontSize + 4,
      });
    }
  }

  return results;
}

/**
 * Adds invisible /Link overlay annotations at given positions.
 */
function addOverlayAnnotations(
  pdfDoc: PDFDocument,
  page: PDFPage,
  positions: UrlPosition[],
  mappings: LinkMapping[]
): number {
  let count = 0;

  for (const pos of positions) {
    const mapping = mappings.find(m => urlsMatch(m.originalUrl, pos.url));
    if (!mapping) continue;

    // Create /Link annotation dict
    const annotDict = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [pos.x, pos.y, pos.x + pos.width, pos.y + pos.height],
      Border: [0, 0, 0], // invisible border
      A: {
        Type: 'Action',
        S: 'URI',
        URI: PDFString.of(mapping.trackedUrl),
      },
    });

    // Add annotation to page
    const annotRef = pdfDoc.context.register(annotDict);
    const existingAnnots = page.node.lookup(PDFName.of('Annots'));

    if (existingAnnots instanceof PDFArray) {
      existingAnnots.push(annotRef);
    } else {
      page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([annotRef]));
    }

    count++;
  }

  return count;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Podmienia istniejące adnotacje linkowe /Link URI w PDF.
 * Jeśli brak adnotacji — szuka URL-i w tekście i dodaje nakładkę /Link.
 */
export async function tagPdfLinks(
  pdfBytes: ArrayBuffer | Uint8Array,
  mappings: LinkMapping[]
): Promise<{ pdf: Uint8Array; replacedCount: number }> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const ctx = pdfDoc.context;
  let replacedCount = 0;

  // ── Krok 1: podmień istniejące adnotacje URI ────────────────────────────
  for (const page of pages) {
    const annots = page.node.lookup(PDFName.of('Annots'));
    if (!(annots instanceof PDFArray)) continue;

    for (let i = 0; i < annots.size(); i++) {
      const annotRef = annots.get(i);
      const annot = ctx.lookup(annotRef);
      if (!(annot instanceof PDFDict)) continue;

      const subtype = annot.get(PDFName.of('Subtype'));
      if (!subtype || subtype.toString() !== '/Link') continue;

      const action = annot.get(PDFName.of('A'));
      if (!action) continue;
      const actionDict = ctx.lookup(action);
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

  // ── Krok 2: jeśli brak adnotacji — szukaj URL w tekście strony ──────────
  if (replacedCount === 0) {
    const urlsToFind = mappings.map(m => m.originalUrl);
    console.log('[tagPdfLinks] Brak adnotacji — szukam URL w tekście:', urlsToFind);

    for (let pi = 0; pi < pages.length; pi++) {
      try {
        const positions = await findPlaceholderPositionsFast(pages[pi], ctx, urlsToFind);
        if (positions.length > 0) {
          console.log(`[tagPdfLinks] Strona ${pi + 1}: znaleziono`, positions);
          replacedCount += addOverlayAnnotations(pdfDoc, pages[pi], positions, mappings);
        }
      } catch (err) {
        console.warn(`[tagPdfLinks] Błąd na stronie ${pi + 1}:`, err);
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
  const ctx = pdfDoc.context;

  for (const page of pages) {
    const annots = page.node.lookup(PDFName.of('Annots'));
    if (!(annots instanceof PDFArray)) continue;

    for (let i = 0; i < annots.size(); i++) {
      const annotRef = annots.get(i);
      const annot = ctx.lookup(annotRef);
      if (!(annot instanceof PDFDict)) continue;

      const subtype = annot.get(PDFName.of('Subtype'));
      if (!subtype || subtype.toString() !== '/Link') continue;

      const action = annot.get(PDFName.of('A'));
      if (!action) continue;
      const actionDict = ctx.lookup(action);
      if (!(actionDict instanceof PDFDict)) continue;

      const actionType = actionDict.get(PDFName.of('S'));
      if (!actionType || actionType.toString() !== '/URI') continue;

      const uri = actionDict.get(PDFName.of('URI'));
      if (!uri) continue;

      let uriStr: string;
      if (uri instanceof PDFString) uriStr = uri.decodeText();
      else if (uri instanceof PDFHexString) uriStr = uri.decodeText();
      else continue;

      if (uriStr && isRealUrl(uriStr) && !links.includes(uriStr)) links.push(uriStr);
    }
  }

  return links;
}

/**
 * Skanuje content streams stron PDF szukając URL-i w tekście.
 * Dekompresuje FlateDecode streams używając DecompressionStream API.
 */
export async function extractTextUrls(pdfBytes: ArrayBuffer | Uint8Array): Promise<string[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const urlRegex = /(https?:\/\/|www\.)[^\s\)>"]+/gi;
  // Also match bare domain-style URLs common in CVs
  const bareUrlRegex = /(?:linkedin\.com|github\.com|[a-z0-9-]+\.[a-z]{2,})\S*/gi;
  const found: string[] = [];

  for (const page of pages) {
    const streams = getPageStreams(page, pdfDoc.context);

    for (const stream of streams) {
      let text: string;
      try {
        text = await readStreamText(stream);
      } catch { continue; }

      // Extract text segments and concatenate them
      const segments = extractTextSegments(text);
      const fullText = segments.map(s => s.text).join(' ');

      // Search in concatenated text
      for (const regex of [urlRegex, bareUrlRegex]) {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(fullText)) !== null) {
          const cleanUrl = match[0].replace(/[)\]>\"']+$/, '').trim();
          if (cleanUrl.toLowerCase().includes('supabase')) continue;
          if (cleanUrl.length < 8) continue;
          // For bare URLs, check they look real
          if (!cleanUrl.includes('://') && !cleanUrl.startsWith('www.')) {
            if (!/\.(com|dev|io|org|net|pl|eu)\b/.test(cleanUrl)) continue;
          }
          if (!found.some(f => normalizeUrl(f) === normalizeUrl(cleanUrl))) {
            found.push(cleanUrl);
          }
        }
      }
    }
  }

  return found;
}

export function buildTrackUrl(token: string): string {
  return `${TRACK_BASE}?t=${token}`;
}

// ── Placeholder-based replacement (nowa, niezawodna metoda) ─────────────────

export interface PlaceholderReplacement {
  placeholder: string;  // np. https://jo.placeholder/linkedin
  trackedUrl: string;   // np. https://supabase.../track?t=TOKEN
}

/**
 * Podmienia placeholder URL-e w PDF.
 *
 * Krok 1: szuka placeholderów w adnotacjach /Link /URI (gdy user zrobił hyperlink).
 * Krok 2 (fallback): szuka placeholderów w tekście PDF i dodaje klikalną adnotację
 *         nakładkę — działa gdy user wkleił placeholder jako zwykły tekst.
 */
export async function replacePlaceholderLinks(
  pdfBytes: ArrayBuffer | Uint8Array,
  replacements: PlaceholderReplacement[]
): Promise<{ pdf: Uint8Array; replacedCount: number }> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const ctx = pdfDoc.context;
  let replacedCount = 0;

  const normalize = (u: string) => u.replace(/\/+$/, '').toLowerCase();

  // ── Krok 1: podmień istniejące adnotacje URI ──────────────────────────────
  for (const page of pages) {
    const annots = page.node.lookup(PDFName.of('Annots'));
    if (!(annots instanceof PDFArray)) continue;

    for (let i = 0; i < annots.size(); i++) {
      const annotRef = annots.get(i);
      const annot = ctx.lookup(annotRef);
      if (!(annot instanceof PDFDict)) continue;

      const subtype = annot.get(PDFName.of('Subtype'));
      if (!subtype || subtype.toString() !== '/Link') continue;

      const action = annot.get(PDFName.of('A'));
      if (!action) continue;
      const actionDict = ctx.lookup(action);
      if (!(actionDict instanceof PDFDict)) continue;

      const actionType = actionDict.get(PDFName.of('S'));
      if (!actionType || actionType.toString() !== '/URI') continue;

      const uri = actionDict.get(PDFName.of('URI'));
      if (!uri) continue;

      let uriStr: string;
      if (uri instanceof PDFString) uriStr = uri.decodeText();
      else if (uri instanceof PDFHexString) uriStr = uri.decodeText();
      else continue;

      const match = replacements.find(r => normalize(r.placeholder) === normalize(uriStr));
      if (match) {
        actionDict.set(PDFName.of('URI'), PDFString.of(match.trackedUrl));
        replacedCount++;
      }
    }
  }

  // ── Krok 2 (fallback): szukaj placeholderów w tekście strony ──────────────
  if (replacedCount === 0) {
    const placeholderUrls = replacements.map(r => r.placeholder);
    console.log('[replacePlaceholderLinks] Brak adnotacji, szukam w tekście:', placeholderUrls);

    // Pre-build mappings once
    const mappings: LinkMapping[] = replacements.map(r => ({
      originalUrl: r.placeholder,
      trackedUrl: r.trackedUrl,
      label: '',
    }));

    for (let pi = 0; pi < pages.length; pi++) {
      try {
        const positions = await findPlaceholderPositionsFast(pages[pi], ctx, placeholderUrls);
        if (positions.length > 0) {
          console.log(`[replacePlaceholderLinks] Strona ${pi + 1}: znaleziono`, positions);
          replacedCount += addOverlayAnnotations(pdfDoc, pages[pi], positions, mappings);
        }
      } catch (err) {
        console.warn(`[replacePlaceholderLinks] Błąd na stronie ${pi + 1}:`, err);
      }
    }
  }

  return { pdf: await pdfDoc.save(), replacedCount };
}
