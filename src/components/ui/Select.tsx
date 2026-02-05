import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full pl-4 pr-10 py-3 bg-dark-700 text-slate-100
            focus:outline-none focus:ring-2 focus:ring-primary-500
            disabled:bg-dark-900 disabled:cursor-not-allowed disabled:text-slate-600
            transition-all cursor-pointer appearance-none
            bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')]
            bg-[length:20px] bg-[right_12px_center] bg-no-repeat
            ${error ? 'ring-2 ring-danger-500' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-dark-700">
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 text-sm text-danger-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
