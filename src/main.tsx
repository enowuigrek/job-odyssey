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

initTooltips()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
