import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

export function CollapsibleItem({
  label,
  onRemove,
  children,
  defaultOpen = false,
}: {
  label: string;
  onRemove: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
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
