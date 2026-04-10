interface CountBadgeProps {
  count: number;
  variant?: 'default' | 'success' | 'primary' | 'warning';
  size?: 'sm' | 'md';
}

export function CountBadge({ count, variant = 'default', size = 'sm' }: CountBadgeProps) {
  const variants = {
    default: 'bg-dark-600 text-slate-300',
    success: 'bg-green-500 text-white',
    primary: 'bg-primary-600 text-white',
    warning: 'bg-warning-500 text-dark-900',
  };

  const sizes = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold flex-shrink-0 ${variants[variant]} ${sizes[size]}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
