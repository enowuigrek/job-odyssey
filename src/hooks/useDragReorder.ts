import { useState } from 'react';

/**
 * Mouse drag-and-drop reordering for a list rendered from `items`. Spread
 * `getItemProps(index)` onto each row (expects a draggable container).
 */
export function useDragReorder<T>(items: T[], onReorder: (next: T[]) => void) {
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
      const next = [...items];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(index, 0, moved);
      onReorder(next);
      setDraggedIndex(null);
      setOverIndex(null);
    },
    isDragging: draggedIndex === index,
    isDragOver: overIndex === index,
  });

  return { getItemProps };
}
