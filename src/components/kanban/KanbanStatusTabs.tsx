type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const VARIANT_ACTIVE_BG: Record<BadgeVariant, string> = {
  default: 'bg-dark-600 text-slate-100',
  success: 'bg-success-500 text-slate-900',
  warning: 'bg-warning-500 text-slate-900',
  danger: 'bg-danger-500 text-slate-900',
  info: 'bg-primary-500 text-slate-900',
};

/**
 * Mobile-only horizontal strip of status tabs above a Kanban carousel —
 * tap to jump to a column, active tab tracks whichever column is in view.
 */
export function KanbanStatusTabs<T extends string>({
  columns,
  activeStatus,
  onSelect,
  getLabel,
  getVariant,
  getCount,
}: {
  columns: T[];
  activeStatus: T | null;
  onSelect: (status: T) => void;
  getLabel: (status: T) => string;
  getVariant: (status: T) => BadgeVariant;
  getCount: (status: T) => number;
}) {
  return (
    <div className="flex md:hidden gap-2 overflow-x-auto kanban-scroll -mx-4 px-4 pb-2 mb-2">
      {columns.map((status) => {
        const isActive = activeStatus === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelect(status)}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium tracking-wide whitespace-nowrap transition-colors ${
              isActive ? VARIANT_ACTIVE_BG[getVariant(status)] : 'bg-dark-800 text-slate-400'
            }`}
          >
            {getLabel(status)} ({getCount(status)})
          </button>
        );
      })}
    </div>
  );
}
