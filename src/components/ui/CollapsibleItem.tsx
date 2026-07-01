import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export function CollapsibleItem({
  label,
  onRemove,
  children,
  defaultOpen = false,
  onMoveUp,
  onMoveDown,
}: {
  label: string;
  onRemove: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Gdy podane — pokazuje strzałkę w górę do zmiany kolejności */
  onMoveUp?: () => void;
  /** Gdy podane — pokazuje strzałkę w dół do zmiany kolejności */
  onMoveDown?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-dark-800 border border-dark-600 mb-2">
      <div
        className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-dark-700 transition-colors select-none"
        onClick={() => setOpen(v => !v)}
      >
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        }
        <span className="text-sm text-slate-200 flex-1 truncate">
          {label || <span className="text-slate-500 italic">bez nazwy</span>}
        </span>
        {(onMoveUp || onMoveDown) && (
          <div className="flex items-center flex-shrink-0">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onMoveUp?.(); }}
              disabled={!onMoveUp}
              title="Przenieś wyżej"
              className="p-1 text-slate-600 hover:text-primary-400 disabled:opacity-30 disabled:hover:text-slate-600 transition-colors cursor-pointer disabled:cursor-default"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onMoveDown?.(); }}
              disabled={!onMoveDown}
              title="Przenieś niżej"
              className="p-1 text-slate-600 hover:text-primary-400 disabled:opacity-30 disabled:hover:text-slate-600 transition-colors cursor-pointer disabled:cursor-default"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="p-1 text-slate-600 hover:text-danger-400 transition-colors cursor-pointer flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-dark-700">
          {children}
        </div>
      )}
    </div>
  );
}
