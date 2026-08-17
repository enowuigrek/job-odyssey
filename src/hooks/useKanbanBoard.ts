import { useEffect, useRef, useState } from 'react';

/**
 * Stan i logika wspólne dla obu widoków Kanban (Aplikacje, Rozmowy) —
 * rozwijanie karty, przeciąganie (natywne DnD, bez customowego "duszka"),
 * i podświetlenie "przed chwilą przeniesiono" (justMoved). Wcześniej ta
 * sama logika była wklejona osobno w każdej stronie i już raz się rozjechała
 * (np. wysokość placeholdera pustej kolumny) — stąd wydzielenie.
 */
export function useKanbanBoard<TItem extends { id: string; status: TStatus }, TStatus extends string>(
  columnOrder: TStatus[]
) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TStatus | null>(null);
  const [draggedItem, setDraggedItem] = useState<TItem | null>(null);
  const [justMoved, setJustMoved] = useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  const justMovedTimeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (justMovedTimeoutRef.current) window.clearTimeout(justMovedTimeoutRef.current);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(current => (current === id ? null : id));
  };

  /** Woła to strona przed właściwym zapisem nowego statusu — ustawia animację i timeout na jej zgaszenie. */
  const triggerMoveHighlight = (item: TItem, newStatus: TStatus) => {
    if (item.status === newStatus) return;
    const direction: 'left' | 'right' =
      columnOrder.indexOf(newStatus) > columnOrder.indexOf(item.status) ? 'right' : 'left';
    setExpandedId(id => (id === item.id ? null : id));
    setJustMoved({ id: item.id, direction });
    if (justMovedTimeoutRef.current) window.clearTimeout(justMovedTimeoutRef.current);
    justMovedTimeoutRef.current = window.setTimeout(() => setJustMoved(null), 1600);
  };

  const handleDragStart = (item: TItem) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TStatus) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Tylko resetuj jeśli opuszczamy do elementu poza kontenerem
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: TStatus, onDropped: (item: TItem, newStatus: TStatus) => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItem && draggedItem.status !== newStatus) {
      onDropped(draggedItem, newStatus);
    }
    setDraggedItem(null);
    setDragOverStatus(null);
  };

  return {
    expandedId,
    setExpandedId,
    toggleExpand,
    dragOverStatus,
    draggedItem,
    justMoved,
    triggerMoveHighlight,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
