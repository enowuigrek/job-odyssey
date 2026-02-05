import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 bg-dark-700 text-slate-100 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-primary-500
            disabled:bg-dark-900 disabled:cursor-not-allowed disabled:text-slate-600
            transition-all
            ${error ? 'ring-2 ring-danger-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-danger-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
