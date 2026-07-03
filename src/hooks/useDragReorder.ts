import { useState, useRef, useId } from 'react';

/** Pola formularzy i linki — z nich nie zaczynamy przeciągania, żeby dało się normalnie klikać i zaznaczać tekst. */
const INTERACTIVE_SELECTOR = 'input, textarea, select, a, [contenteditable="true"]';
const LONG_PRESS_MS = 280;
const MOVE_TOLERANCE = 8;

/**
 * Przeciąganie do zmiany kolejności listy — mysz (natywny HTML5 DnD)
 * i dotyk (długie przytrzymanie podnosi kartę, przesunięcie palca wybiera cel;
 * natywny DnD nie działa na dotyk, stąd własna obsługa touch eventów).
 * Spread `getItemProps(index)` na kontener karty — złapać można w dowolnym
 * miejscu poza polami formularzy. `onReorder` dostaje indeks źródłowy i
 * docelowy — konsument decyduje, jak zastosować przeniesienie (splice tablicy
 * albo np. przeliczenie sort_order zapisywane do backendu).
 */
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const listId = useId();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Refy-lustra dla natywnych listenerów dotyku (state z closure byłby nieświeży)
  const stateRef = useRef({ dragged: null as number | null, over: null as number | null });
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const touchActiveRef = useRef(false);

  const setDragged = (i: number | null) => { stateRef.current.dragged = i; setDraggedIndex(i); };
  const setOver = (i: number | null) => { stateRef.current.over = i; setOverIndex(i); };

  const startTouch = (index: number, e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return;
    if (touchActiveRef.current) return;
    touchActiveRef.current = true;

    const start = e.touches[0];
    const startX = start.clientX;
    const startY = start.clientY;
    let lifted = false;

    const timer = setTimeout(() => {
      lifted = true;
      setDragged(index);
      navigator.vibrate?.(30);
    }, LONG_PRESS_MS);

    const indexAt = (x: number, y: number): number | null => {
      const el = document
        .elementFromPoint(x, y)
        ?.closest<HTMLElement>(`[data-drag-list="${listId}"]`);
      if (!el) return null;
      const idx = Number(el.dataset.dragIndex);
      return Number.isNaN(idx) ? null : idx;
    };

    const onMove = (ev: TouchEvent) => {
      const t = ev.touches[0];
      if (!lifted) {
        // Ruch przed aktywacją = scroll, nie przeciąganie
        if (Math.abs(t.clientX - startX) > MOVE_TOLERANCE || Math.abs(t.clientY - startY) > MOVE_TOLERANCE) {
          cleanup();
        }
        return;
      }
      ev.preventDefault(); // karta podniesiona — blokujemy scroll strony
      const idx = indexAt(t.clientX, t.clientY);
      if (idx !== null && idx !== stateRef.current.dragged) setOver(idx);
    };

    const onEnd = () => {
      if (lifted) {
        const { dragged, over } = stateRef.current;
        if (dragged !== null && over !== null && over !== dragged) {
          onReorderRef.current(dragged, over);
        }
      }
      cleanup();
    };

    const cleanup = () => {
      clearTimeout(timer);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
      touchActiveRef.current = false;
      setDragged(null);
      setOver(null);
    };

    // passive: false — musimy móc zablokować scroll podczas aktywnego przeciągania
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
  };

  const getItemProps = (index: number) => ({
    draggable: true,
    'data-drag-list': listId,
    'data-drag-index': index,
    onDragStart: (e: React.DragEvent) => {
      if ((e.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', ''); // wymagane przez Firefoksa do startu DnD
      e.dataTransfer.effectAllowed = 'move';
      setDragged(index);
    },
    onDragEnd: () => {
      setDragged(null);
      setOver(null);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (stateRef.current.dragged === null || stateRef.current.dragged === index) return;
      setOver(index);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const { dragged } = stateRef.current;
      if (dragged === null || dragged === index) return;
      onReorderRef.current(dragged, index);
      setDragged(null);
      setOver(null);
    },
    onTouchStart: (e: React.TouchEvent) => startTouch(index, e),
    isDragging: draggedIndex === index,
    isDragOver: overIndex === index,
  });

  return { getItemProps };
}
