import { ElementType, ReactNode } from 'react';

interface PageHeaderProps {
  icon: ElementType;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ icon: Icon, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-6 h-6 text-primary-400 flex-shrink-0" />
          <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
        </div>
        {description && <p className="text-slate-400 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
