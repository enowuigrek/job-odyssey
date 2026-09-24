/**
 * Nazwa pliku CV wysyłanego do firmy: "Imie_Nazwisko_CV_Firma.pdf".
 * - imię i nazwisko na początku: rekruter od razu wie, czyje to CV,
 * - firma na końcu: każdy plik jest inny (przeglądarka nie dokleja "(1)"),
 *   a użytkownik widzi, które CV jest do której aplikacji,
 * - bez polskich znaków i spacji: część systemów rekrutacyjnych psuje "Ł" itp.,
 * - bez słowa "tracked": nie zdradzamy rekruterowi, że linki są śledzone.
 */

const PL_CHARS: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
  Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z',
};

function toAscii(text: string): string {
  return text
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ch => PL_CHARS[ch])
    // pozostałe akcenty (é, ü…) — "ł" nie rozkłada się przez NFKD, stąd mapa wyżej
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');
}

// Forma prawna na końcu nazwy firmy (po transliteracji); musi ją poprzedzać spacja
// lub przecinek, żeby nie obciąć końcówki zwykłego słowa (np. "Mimosa").
const LEGAL_SUFFIX = new RegExp(
  '[\\s,]+(' + [
    'prosta spolka akcyjna',
    'spolka z ograniczona odpowiedzialnoscia',
    'spolka komandytowo-akcyjna',
    'spolka komandytowa',
    'spolka akcyjna',
    'spolka jawna',
    'sp\\.?\\s*z\\s*o\\.?\\s*o\\.?',
    'sp\\.?\\s*k\\.?',
    'sp\\.?\\s*j\\.?',
    's\\.?\\s*k\\.?\\s*a\\.?',
    'p\\.?\\s*s\\.?\\s*a\\.?',
    's\\.?\\s*a\\.?',
  ].join('|') + ')\\s*$',
  'i'
);

function stripLegalForm(company: string): string {
  let name = company.trim();
  // np. "Firma Sp. z o.o. Sp. k." — zdejmujemy kolejne formy od końca
  for (let prev = ''; prev !== name; ) {
    prev = name;
    name = name.replace(LEGAL_SUFFIX, '');
  }
  return name;
}

function toFilePart(text: string): string {
  return text.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/** "ŁUKASZ NOWAK" → "Lukasz_Nowak" (nazwisko w CV bywa wersalikami) */
function personPart(fullName: string): string {
  const titled = toAscii(fullName)
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
  return toFilePart(titled);
}

export function cvFileName(fullName: string | undefined, companyName: string | undefined): string {
  const person = personPart(fullName ?? '');
  const company = toFilePart(stripLegalForm(toAscii(companyName ?? '')));
  return [person, 'CV', company].filter(Boolean).join('_') + '.pdf';
}
