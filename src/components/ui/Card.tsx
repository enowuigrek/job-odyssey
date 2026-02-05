import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-dark-800 ${
        onClick ? 'cursor-pointer hover:bg-dark-700 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-4 border-b border-dark-700 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-4 border-t border-dark-700 bg-dark-800/50 ${className}`}>
      {children}
    </div>
  );
}
