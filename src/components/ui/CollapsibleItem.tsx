import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

export function CollapsibleItem({
  label,
  onLabelChange,
  labelPlaceholder,
  onRemove,
  children,
  defaultOpen = false,
  onMoveUp,
  onMoveDown,
  draggable = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTouchStart,
  'data-drag-list': dataDragList,
  'data-drag-index': dataDragIndex,
  isDragging = false,
  isDragOver = false,
  nested = false,
}: {
  label: string;
  /** Gdy podane — po rozwinięciu nagłówek staje się edytowalny (jedno źródło nazwy, bez dublowania pola w treści) */
  onLabelChange?: (v: string) => void;
  labelPlaceholder?: string;
  onRemove: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Gdy podane — pokazuje strzałkę w górę do zmiany kolejności */
  onMoveUp?: () => void;
  /** Gdy podane — pokazuje strzałkę w dół do zmiany kolejności */
  onMoveDown?: () => void;
  /** Gdy true — element przeciągalny (spread propsów z useDragReorder) */
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  'data-drag-list'?: string;
  'data-drag-index'?: number;
  isDragging?: boolean;
  isDragOver?: boolean;
  /** Gdy element leży wewnątrz kartki sekcji (bg-dark-800) — jaśniejsze tło dla kontrastu */
  nested?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`${nested ? 'bg-dark-700/60' : 'bg-dark-800'} mb-2 ${open ? 'fold-card' : ''} transition-opacity ${isDragging ? 'opacity-40' : ''} ${
        isDragOver ? 'ring-2 ring-primary-500/50' : ''
      }`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onTouchStart={onTouchStart}
      data-drag-list={dataDragList}
      data-drag-index={dataDragIndex}
    >
      {/* pr-8 po rozwinięciu — ikony nie wjeżdżają w zagięty róg kartki */}
      <div
        className={`flex items-center gap-2 pl-3 py-2.5 cursor-pointer hover:bg-dark-700 transition-colors select-none ${open ? 'pr-8' : 'pr-3'}`}
        onClick={() => setOpen(v => !v)}
      >
        {draggable && (
          <div
            className="text-slate-500 flex-shrink-0 cursor-grab active:cursor-grabbing"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        {open
          ? <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          : <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        }
        {open && onLabelChange ? (
          <input
            value={label}
            onChange={e => onLabelChange(e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder={labelPlaceholder ?? 'Nazwa'}
            className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none border-b border-transparent focus:border-primary-500"
          />
        ) : (
          <span className="text-sm font-semibold text-white flex-1 truncate">
            {label || <span className="text-slate-500 italic font-normal">bez nazwy</span>}
          </span>
        )}
        {!draggable && (onMoveUp || onMoveDown) && (
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
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}
