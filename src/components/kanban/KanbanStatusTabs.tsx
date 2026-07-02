import type { LucideIcon } from 'lucide-react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const VARIANT_ACTIVE_BG: Record<BadgeVariant, string> = {
  default: 'bg-dark-600 text-slate-100',
  success: 'bg-success-500 text-slate-900',
  warning: 'bg-warning-500 text-slate-900',
  danger: 'bg-danger-500 text-slate-900',
  info: 'bg-primary-500 text-slate-900',
};

/**
 * Mobile-only strip of icon-only status tabs above a Kanban carousel —
 * evenly fills the width (no horizontal scroll), tap to jump to a column,
 * active tab tracks whichever column is in view.
 */
export function KanbanStatusTabs<T extends string>({
  columns,
  activeStatus,
  onSelect,
  getLabel,
  getVariant,
  getIcon,
}: {
  columns: T[];
  activeStatus: T | null;
  onSelect: (status: T) => void;
  getLabel: (status: T) => string;
  getVariant: (status: T) => BadgeVariant;
  getIcon: (status: T) => LucideIcon;
}) {
  return (
    <div className="flex md:hidden gap-1 mb-2">
      {columns.map((status) => {
        const isActive = activeStatus === status;
        const Icon = getIcon(status);
        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelect(status)}
            title={getLabel(status)}
            className={`flex-1 flex items-center justify-center py-2.5 transition-colors ${
              isActive ? VARIANT_ACTIVE_BG[getVariant(status)] : 'bg-dark-800 text-slate-500'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
