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
    'inline-flex items-center justify-center font-medium tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

  // Kolor tła/tekstu stały — hover/klik obsługuje .fold-btn (zagięty róg kartki, patrz index.css).
  // Ghost bez zagięcia: klapka i cień na przezroczystym tle wyglądałyby jak błąd.
  const variants = {
    primary: 'fold-btn bg-primary-500 text-slate-900 focus:ring-primary-500',
    secondary: 'fold-btn bg-dark-700 text-slate-100 focus:ring-dark-600',
    danger: 'fold-btn bg-danger-500 text-white focus:ring-danger-500',
    ghost: 'bg-transparent text-slate-300 focus:ring-dark-600',
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
