import { ReactNode } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Card } from '../ui';

interface KanbanCardProps {
  /** Zwinięty layout (padding, ukryte akcje pod treścią) — używane też poza Kanbanem, w widoku listy. */
  compact?: boolean;
  /** Karta jest przeciągalna — tylko w widoku Kanban. */
  draggable?: boolean;
  isDragging?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  /** Animacja "przed chwilą przeniesiono" — kierunek wjazdu + poświata. */
  moveDirection?: 'left' | 'right' | null;
  /** Dodatkowe klasy na Card, np. pierścień "dziś" na karcie rozmowy. */
  className?: string;
  /** Zawsze widoczna treść nagłówka (nazwa firmy itd.) — bez chevrona, dokładany automatycznie. */
  header: ReactNode;
  /** Ikonki akcji pod treścią, widoczne tylko gdy compact i zwinięta. */
  compactActions?: ReactNode;
  /** Treść szczegółów pokazywana po rozwinięciu (płynnie, grid-rows 0fr↔1fr). */
  expandedContent?: ReactNode;
}

/**
 * Wspólna "skorupa" karty kanbanowej — używana przez ApplicationCard i InterviewCard.
 * Same karty mają różną treść (inne pola danych), ale mechanika (zwijanie,
 * przeciąganie, podświetlenie przeniesienia) jest identyczna i wcześniej była
 * wklejona osobno w obu miejscach.
 */
export function KanbanCard({
  compact = false,
  draggable = false,
  isDragging = false,
  isExpanded = false,
  onToggleExpand,
  onDragStart,
  onDragEnd,
  moveDirection,
  className = '',
  header,
  compactActions,
  expandedContent,
}: KanbanCardProps) {
  const cardContent = (
    <Card
      fold
      className={`group transition-shadow duration-700 ${className} ${
        moveDirection ? (moveDirection === 'right' ? 'animate-kanban-enter-right' : 'animate-kanban-enter-left') : ''
      } ${moveDirection ? 'shadow-[0_0_22px_rgba(6,182,212,0.5)]' : 'shadow-none'}`}
    >
      <div className="p-0">
        {/* Główna sekcja - klikalna aby rozwinąć */}
        <div className={`${compact ? 'px-2.5 py-2.5' : 'p-4'} cursor-pointer`} onClick={onToggleExpand}>
          <div className="flex items-center gap-1">
            {draggable && (
              <div
                className="mr-1 text-slate-400 flex-shrink-0 cursor-grab active:cursor-grabbing"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">{header}</div>

            {/* Chevron */}
            <div className="flex items-center justify-center w-6 h-6 text-slate-500 flex-shrink-0">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {/* Ikony akcji na stałe pod treścią karty, po prawej */}
          {compact && !isExpanded && compactActions && (
            <div className="flex items-center justify-end gap-0.5 mt-1.5">{compactActions}</div>
          )}
        </div>

        {/* Rozwinięte szczegóły — płynnie rozwijane i zwijane (grid-rows 0fr↔1fr).
            Próba dołożenia scale/opacity jak w animate-unfold-card na tym samym
            elemencie psuła animację (dwie nakładające się animacje wysokości
            na tym samym, jeszcze zmieniającym rozmiar kontenerze) — z powrotem
            sam grid-rows, który realnie działał płynnie. */}
        {expandedContent && (
          <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">{expandedContent}</div>
          </div>
        )}
      </div>
    </Card>
  );

  if (!draggable) return cardContent;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? 'opacity-40' : ''}`}
    >
      {cardContent}
    </div>
  );
}
