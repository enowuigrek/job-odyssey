import { useState } from 'react';

/**
 * Mouse drag-and-drop reordering for a list. Spread `getItemProps(index)`
 * onto each row (expects a draggable container). `onReorder` receives the
 * source and destination index — the caller owns how the move is applied
 * (plain array splice, or e.g. a sort_order remap persisted to a backend).
 */
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const getItemProps = (index: number) => ({
    draggable: true,
    onDragStart: () => setDraggedIndex(index),
    onDragEnd: () => {
      setDraggedIndex(null);
      setOverIndex(null);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;
      setOverIndex(index);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;
      onReorder(draggedIndex, index);
      setDraggedIndex(null);
      setOverIndex(null);
    },
    isDragging: draggedIndex === index,
    isDragOver: overIndex === index,
  });

  return { getItemProps };
}
