import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-primary-500 text-slate-900 hover:bg-primary-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] focus:ring-primary-500',
    secondary:
      'bg-dark-700 text-slate-100 hover:bg-dark-600 focus:ring-dark-600',
    danger:
      'bg-danger-500 text-white hover:bg-danger-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] focus:ring-danger-500',
    ghost:
      'bg-transparent text-slate-300 hover:bg-dark-700 hover:text-primary-400 focus:ring-dark-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
