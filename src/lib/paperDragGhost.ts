import type { DragEvent as ReactDragEvent } from 'react';

/**
 * Papierowy "duszek" przeciągania dla kart kanbanu. Natywny obraz drag&drop
 * to statyczny zrzut robiony przy dragstart — nie da się go animować.
 * Chowamy go więc (przezroczysty setDragImage) i rysujemy własny klon karty,
 * który podąża za kursorem przekrzywiony i delikatnie buja się wokół punktu
 * złapania (animacja `.paper-drag-ghost` w index.css), a przy upuszczeniu
 * prostuje się i znika.
 */

// Musi istnieć i być załadowany zanim zacznie się pierwszy drag
const emptyImg = new Image();
emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAAIBRAA7';

let ghost: HTMLElement | null = null;
let grabX = 0;
let grabY = 0;

function onDragOver(e: DragEvent) {
  if (!ghost) return;
  ghost.style.setProperty('translate', `${e.clientX - grabX}px ${e.clientY - grabY}px`);
}

export function startPaperGhost(e: ReactDragEvent, el: HTMLElement) {
  e.dataTransfer.setDragImage(emptyImg, 0, 0);

  const rect = el.getBoundingClientRect();
  grabX = e.clientX - rect.left;
  grabY = e.clientY - rect.top;

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width = `${rect.width}px`;
  clone.style.setProperty('translate', `${rect.left}px ${rect.top}px`);
  // Kartka buja się wokół punktu, w którym ją "trzymamy"
  clone.style.transformOrigin = `${grabX}px ${grabY}px`;
  clone.classList.add('paper-drag-ghost');
  document.body.appendChild(clone);
  ghost = clone;

  // Capture — kolumny kanbanu robią stopPropagation na dragover,
  // więc zwykły listener na document by nie dostawał pozycji kursora
  document.addEventListener('dragover', onDragOver, true);
}

export function endPaperGhost() {
  document.removeEventListener('dragover', onDragOver, true);
  const g = ghost;
  ghost = null;
  if (!g) return;
  // Odkładana kartka prostuje się i znika
  g.classList.add('paper-drag-ghost-drop');
  setTimeout(() => g.remove(), 200);
}
