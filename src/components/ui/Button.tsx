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
  // Bez focus ringa — po kliknięciu myszką zostawał na przycisku jako ramka
  const baseStyles =
    'inline-flex items-center justify-center font-medium tracking-wide transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  // Kolor tła/tekstu stały — hover/klik obsługuje .fold-btn (zagięty róg kartki, patrz index.css).
  // Ghost bez zagięcia: klapka i cień na przezroczystym tle wyglądałyby jak błąd.
  const variants = {
    primary: 'fold-btn bg-primary-500 text-slate-900',
    secondary: 'fold-btn bg-dark-700 text-slate-100',
    danger: 'fold-btn bg-danger-500 text-white',
    ghost: 'bg-transparent text-slate-300',
  };

  // Mniejszy fold na "sm" — stałe 12px na niskim przycisku (~28px) wyglądało
  // nieproporcjonalnie duże i sprawiało wrażenie przesunięcia/asymetrii.
  const sizes = {
    sm: 'px-3 py-1.5 text-xs [--fold:6px]',
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
