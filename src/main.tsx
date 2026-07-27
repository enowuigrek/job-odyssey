import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTooltips } from './lib/tooltip'

// Promise.withResolvers() dotarło do Safari dopiero w 17.4 (marzec 2024) —
// pdfjs-dist (import CV) używa go wewnętrznie i bez tego rzuca niemówiący nic
// "undefined is not a function" na starszych Safari. Polyfill tu, na starcie
// appki, żeby dowolny przyszły kod też był zabezpieczony, nie tylko import CV.
if (!('withResolvers' in Promise)) {
  // @ts-expect-error — dopisujemy metodę spoza aktualnego lib.dom typings
  Promise.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  };
}

// Właściwa przyczyna błędu importu CV w Safari: pdfjs-dist zwraca natywny
// ReadableStream i robi po nim `for await...of` (getTextContent → streamTextContent).
// Async-iterowanie po ReadableStream to osobna, jeszcze później dodana do
// Safari funkcja niż Promise.withResolvers — bez niej `[Symbol.asyncIterator]`
// jest undefined i próba wywołania go jako funkcji rzuca "undefined is not
// a function". Standardowy polyfill: iterator zbudowany ręcznie na getReader().
if (typeof ReadableStream !== 'undefined' && !(Symbol.asyncIterator in ReadableStream.prototype)) {
  // @ts-expect-error — dopisujemy Symbol.asyncIterator spoza aktualnego lib.dom typings
  ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  };
}

// Po każdym deployu hashe chunków się zmieniają. Jeśli ktoś ma otwartą starą
// zakładkę (stary index.html) i dopiero teraz pierwszy raz nawiguje na
// stronę doładowywaną leniwie (React.lazy), przeglądarka próbuje dociągnąć
// chunk pod adresem sprzed kolejnego deployu — ten plik już nie istnieje na
// serwerze (nadpisany), więc dynamiczny import pada z "Importing a module
// script failed" i appka zostaje pusta. Vite emituje na to zdarzenie
// 'vite:preloadError' — łapiemy je i odświeżamy, żeby ściągnąć świeży
// index.html z poprawnymi odnośnikami zamiast zostawiać czarny ekran.
// Guard przed pętlą przeładowań na wypadek innej przyczyny błędu.
window.addEventListener('vite:preloadError', () => {
  const key = 'jo-reloaded-after-preload-error';
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  window.location.reload();
});

initTooltips()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
