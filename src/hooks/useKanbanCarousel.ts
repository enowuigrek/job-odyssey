import { useEffect, useRef, useState } from 'react';

/**
 * Tracks which Kanban column is currently in view inside a horizontally
 * scrolling container (mobile carousel), and exposes a way to jump to a
 * given column. Columns must be rendered with `data-kanban-status={status}`.
 */
export function useKanbanCarousel<T extends string>(columns: T[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStatus, setActiveStatus] = useState<T | null>(columns[0] ?? null);
  const columnsKey = columns.join('|');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const columnEls = Array.from(
      container.querySelectorAll<HTMLElement>('[data-kanban-status]')
    );
    if (columnEls.length === 0) return;

    const ratios = new Map<T, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const status = (entry.target as HTMLElement).dataset.kanbanStatus as T | undefined;
          if (status) ratios.set(status, entry.intersectionRatio);
        }
        let best: { status: T; ratio: number } | null = null;
        for (const [status, ratio] of ratios) {
          if (ratio > (best?.ratio ?? 0)) best = { status, ratio };
        }
        if (best) setActiveStatus(best.status);
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    columnEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [columnsKey]);

  const scrollToStatus = (status: T) => {
    const el = containerRef.current?.querySelector<HTMLElement>(
      `[data-kanban-status="${status}"]`
    );
    el?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  return { containerRef, activeStatus, scrollToStatus };
}
