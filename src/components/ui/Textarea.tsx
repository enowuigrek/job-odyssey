import { TextareaHTMLAttributes } from 'react';
import { useAutoResizeTextarea } from '../../hooks/useAutoResizeTextarea';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', value, ...props }: TextareaProps) {
  const ref = useAutoResizeTextarea(typeof value === 'string' ? value : '');

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        value={value}
        className={`
          w-full px-4 py-3 bg-dark-900 text-white placeholder-slate-500 resize-none overflow-hidden min-h-[120px]
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
