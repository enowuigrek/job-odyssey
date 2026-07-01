import { Check } from 'lucide-react';

export function Checkbox({
  checked,
  onChange,
  title,
  className = '',
}: {
  checked: boolean;
  onChange: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <label
      className={`relative inline-flex items-center justify-center w-3.5 h-3.5 cursor-pointer flex-shrink-0 ${className}`}
      title={title}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`absolute inset-0 border transition-colors ${
          checked ? 'bg-primary-500 border-primary-500' : 'bg-dark-700 border-dark-600'
        }`}
      />
      <Check
        className={`relative w-2.5 h-2.5 text-slate-900 transition-opacity pointer-events-none ${
          checked ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </label>
  );
}
