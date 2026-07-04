/**
 * Globalne tooltipy appki — zamiast natywnych `title` (wolnych i systemowych).
 * Użycie: `data-tip="treść"` na dowolnym elemencie. Jeden współdzielony
 * div na `position: fixed` (nie obcinają go kontenery z overflow-hidden),
 * delegacja zdarzeń na document (działa dla elementów montowanych dynamicznie).
 * Inicjalizacja raz, w main.tsx.
 */

const SHOW_DELAY_MS = 150;

let tipEl: HTMLDivElement | null = null;
let showTimer: number | undefined;

function ensureEl(): HTMLDivElement {
  if (tipEl) return tipEl;
  tipEl = document.createElement('div');
  tipEl.className = 'app-tooltip';
  document.body.appendChild(tipEl);
  return tipEl;
}

function show(target: HTMLElement) {
  const text = target.getAttribute('data-tip');
  if (!text || !target.isConnected) return;
  const tip = ensureEl();
  tip.textContent = text;

  const r = target.getBoundingClientRect();
  const tr = tip.getBoundingClientRect();
  let x = r.left + r.width / 2 - tr.width / 2;
  x = Math.max(8, Math.min(x, window.innerWidth - tr.width - 8));
  let y = r.top - tr.height - 8;
  if (y < 8) y = r.bottom + 8; // przy górnej krawędzi pokaż pod elementem

  tip.style.translate = `${x}px ${y}px`;
  tip.classList.add('visible');
}

function hide() {
  clearTimeout(showTimer);
  tipEl?.classList.remove('visible');
}

export function initTooltips() {
  document.addEventListener('mouseover', (e) => {
    const target = (e.target as HTMLElement).closest?.('[data-tip], [title]') as HTMLElement | null;
    if (!target) return;
    // Przejmij natywny title w locie: zdejmujemy atrybut zanim przeglądarka
    // zdąży pokazać systemowy dymek (jego opóźnienie to ~1s) — dzięki temu
    // nie trzeba konwertować title= na data-tip= w całym kodzie
    const nativeTitle = target.getAttribute('title');
    if (nativeTitle) {
      target.setAttribute('data-tip', nativeTitle);
      target.removeAttribute('title');
    }
    if (!target.getAttribute('data-tip')) return;
    clearTimeout(showTimer);
    showTimer = window.setTimeout(() => show(target), SHOW_DELAY_MS);
  });

  document.addEventListener('mouseout', (e) => {
    const target = (e.target as HTMLElement).closest?.('[data-tip]');
    if (!target) return;
    const to = e.relatedTarget as HTMLElement | null;
    if (to && target.contains(to)) return; // ruch wewnątrz elementu — nie chowaj
    hide();
  });

  // Klik zwykle zmienia stan/wid — tooltip nie powinien wisieć
  document.addEventListener('click', hide, true);
  document.addEventListener('scroll', hide, true);
}
