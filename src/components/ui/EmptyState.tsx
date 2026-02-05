import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-dark-600 bg-dark-800/50">
      <div className="w-16 h-16 bg-dark-700 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-primary-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-100 mb-2 uppercase tracking-wide">{title}</h3>
      <p className="text-slate-400 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
