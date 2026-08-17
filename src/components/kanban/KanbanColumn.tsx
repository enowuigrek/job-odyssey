import { ReactNode } from 'react';
import { Badge } from '../ui';

interface KanbanColumnProps<TStatus extends string> {
  status: TStatus;
  badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  badgeLabel: string;
  count: number;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  isEmpty: boolean;
  emptyLabel: string;
  /** Cała kolumna wyszarzona (np. brak jakichkolwiek aplikacji w appce, więc rozmowy nie mają się do czego odnieść). */
  emptyDimmed?: boolean;
  /**
   * Fantomowy nagłówek karty tej kolumny (te same klasy/tekst co realny header,
   * niewidoczny) — dzięki temu placeholder pustej kolumny ma dokładnie taką
   * wysokość jak prawdziwa karta, bez zgadywania magicznej liczby pikseli i
   * bez ryzyka, że się rozjedzie między Aplikacjami a Rozmowami tak jak wcześniej.
   */
  emptyGhostHeader: ReactNode;
  /** Przycisk/formularz szybkiego dodawania — pod kartami albo pod placeholderem. */
  inlineAdd: ReactNode;
  /** Karty tej kolumny — renderowane tylko gdy !isEmpty. */
  children?: ReactNode;
}

/**
 * Wspólna "skorupa" kolumny Kanban — nagłówek z licznikiem, obszar przewijany,
 * podświetlenie podczas przeciągania i placeholder pustej kolumny. Wcześniej
 * ta sama struktura była wklejona osobno w Aplikacjach i Rozmowach i już raz
 * się rozjechała (wysokość placeholdera dopasowana tylko do kart Aplikacji).
 */
export function KanbanColumn<TStatus extends string>({
  status,
  badgeVariant,
  badgeLabel,
  count,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  isEmpty,
  emptyLabel,
  emptyDimmed = false,
  emptyGhostHeader,
  inlineAdd,
  children,
}: KanbanColumnProps<TStatus>) {
  return (
    <div
      data-kanban-status={status}
      className="w-full md:w-80 flex-shrink-0 flex flex-col h-full snap-start px-4 md:px-0"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="bg-dark-800 p-3 mb-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant={badgeVariant} size="sm">{badgeLabel}</Badge>
          <span className="text-xs text-slate-500">({count})</span>
        </div>
      </div>
      <div
        className={`flex-1 overflow-y-auto kanban-scroll space-y-1.5 min-h-[200px] p-1.5 transition-colors ${
          isDragOver ? 'bg-primary-500/10 border-2 border-dashed border-primary-500/50' : 'border-2 border-transparent'
        }`}
      >
        {isEmpty && !isDragOver ? (
          <div className={`flex flex-col gap-1 ${emptyDimmed ? 'opacity-40' : ''}`}>
            <div className="relative w-full border-2 border-dashed border-dark-600">
              {/* Fantom decyduje o wysokości, sam jest niewidoczny */}
              <div className="px-2.5 py-2.5 invisible" aria-hidden="true">
                {emptyGhostHeader}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-slate-400">{emptyLabel}</span>
              </div>
            </div>
            {inlineAdd}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-primary-500/50">
            Upuść tutaj
          </div>
        ) : (
          <>
            {children}
            {inlineAdd}
          </>
        )}
      </div>
    </div>
  );
}
