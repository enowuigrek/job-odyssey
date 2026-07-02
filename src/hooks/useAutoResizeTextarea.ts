import { useEffect, useRef } from 'react';

/**
 * Grows a textarea to fit its content instead of scrolling internally —
 * re-measures whenever `value` changes (typing, or a programmatic fill).
 */
export function useAutoResizeTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return ref;
}
