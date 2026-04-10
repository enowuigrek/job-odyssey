import { ElementType, ReactNode } from 'react';

interface PageHeaderProps {
  icon: ElementType;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ icon: Icon, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary-400 flex-shrink-0" />
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 truncate">{title}</h1>
        </div>
        {description && (
          <p className="text-sm text-slate-400 mt-0.5 hidden sm:block">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
