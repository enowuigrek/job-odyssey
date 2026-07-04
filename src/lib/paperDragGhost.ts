import type { DragEvent as ReactDragEvent } from 'react';

/**
 * Papierowy "duszek" przeciągania dla kart kanbanu. Natywny obraz drag&drop
 * to statyczny zrzut robiony przy dragstart — nie da się go animować.
 * Chowamy go więc (przezroczysty setDragImage) i rysujemy własny klon karty.
 *
 * Fizyka: karta jest "trzymana" w punkcie złapania — przy ruchu kursora
 * przechyla się zgodnie z kierunkiem (dół wlecze się za górą), przy
 * zatrzymaniu wraca do lekkiego przechyłu, a po upuszczeniu prostuje się
 * i znika. Bez ciągłego bujania.
 */

// Musi istnieć i być załadowany zanim zacznie się pierwszy drag
const emptyImg = new Image();
emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAAIBRAA7';

const BASE_TILT_DEG = 2; // lekki stały przechył "trzymanej" kartki
const MAX_TILT_DEG = 10;

let ghost: HTMLElement | null = null;
let grabX = 0;
let grabY = 0;
let lastX = 0;
let rot = 0;
let targetRot = BASE_TILT_DEG;
let rafId = 0;

function tick() {
  if (!ghost) return;
  // Wygładzenie: aktualny kąt goni docelowy, docelowy wraca do bazowego
  rot += (targetRot - rot) * 0.18;
  targetRot += (BASE_TILT_DEG - targetRot) * 0.08;
  ghost.style.rotate = `${rot.toFixed(2)}deg`;
  rafId = requestAnimationFrame(tick);
}

function onDragOver(e: DragEvent) {
  if (!ghost) return;
  const dx = e.clientX - lastX;
  lastX = e.clientX;
  // Ruch w prawo → dół karty zostaje z tyłu po lewej (obrót w prawo) i odwrotnie
  targetRot = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, BASE_TILT_DEG + dx * 1.5));
  ghost.style.setProperty('translate', `${e.clientX - grabX}px ${e.clientY - grabY}px`);
}

export function startPaperGhost(e: ReactDragEvent, el: HTMLElement) {
  // Zabezpieczenie przed dublem, gdyby poprzedni drag nie posprzątał
  ghost?.remove();
  cancelAnimationFrame(rafId);

  e.dataTransfer.setDragImage(emptyImg, 0, 0);

  const rect = el.getBoundingClientRect();
  grabX = e.clientX - rect.left;
  grabY = e.clientY - rect.top;
  lastX = e.clientX;
  rot = 0;
  targetRot = BASE_TILT_DEG;

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = `${rect.width}px`;
  clone.style.setProperty('translate', `${rect.left}px ${rect.top}px`);
  // Kartka obraca się wokół punktu, w którym ją "trzymamy"
  clone.style.transformOrigin = `${grabX}px ${grabY}px`;
  clone.classList.add('paper-drag-ghost');
  document.body.appendChild(clone);
  ghost = clone;
  rafId = requestAnimationFrame(tick);

  // Capture — kolumny kanbanu robią stopPropagation na dragover,
  // więc zwykły listener na document by nie dostawał pozycji kursora
  document.addEventListener('dragover', onDragOver, true);
  // Sprzątanie na poziomie dokumentu: po upuszczeniu w kolumnę React
  // przerenderowuje kanban i źródłowy element potrafi zniknąć z DOM —
  // wtedy dragend na elemencie NIGDY nie przyjdzie i duszek wisiałby
  // w nieskończoność. Drop/dragend na document łapią każdy scenariusz.
  document.addEventListener('drop', endPaperGhost, true);
  document.addEventListener('dragend', endPaperGhost, true);
}

export function endPaperGhost() {
  document.removeEventListener('dragover', onDragOver, true);
  document.removeEventListener('drop', endPaperGhost, true);
  document.removeEventListener('dragend', endPaperGhost, true);
  cancelAnimationFrame(rafId);
  const g = ghost;
  ghost = null;
  if (!g) return;
  // Odkładana kartka prostuje się i znika
  g.style.transition = 'rotate 160ms ease-out, opacity 160ms ease-out';
  g.style.rotate = '0deg';
  g.style.opacity = '0';
  setTimeout(() => g.remove(), 200);
}
