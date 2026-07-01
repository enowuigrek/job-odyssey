import { ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { updateAt, removeAt } from '../../utils/array';

/**
 * Shared editor building blocks used by CVEditorPage and ProfilePage.
 * `light` toggles the `font-light` weight ProfilePage uses that CVEditorPage doesn't —
 * preserves the existing visual difference between the two instead of forcing one style.
 */

export function FieldLabel({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <label className={`block text-xs text-slate-400 mb-1${light ? ' font-light' : ''}`}>
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  className = '',
  light = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  light?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-1.5 bg-dark-700 text-slate-100 text-sm${light ? ' font-light' : ''} placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${className}`}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  light = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  light?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2 bg-dark-700 text-slate-100 text-sm${light ? ' font-light' : ''} placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-y`}
    />
  );
}

interface LabelUrl {
  label: string;
  url: string;
}

export function LinksEditor<T extends LabelUrl>({
  links,
  onChange,
  light = false,
}: {
  links: T[];
  onChange: (links: T[]) => void;
  light?: boolean;
}) {
  return (
    <div>
      {links.map((link, i) => (
        <div key={i} className="flex gap-2 items-center mb-2">
          <input
            value={link.label}
            onChange={e => onChange(updateAt(links, i, { ...link, label: e.target.value }))}
            placeholder="Etykieta"
            className={`w-28 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm${light ? ' font-light' : ''} placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0`}
          />
          <input
            value={link.url}
            onChange={e => onChange(updateAt(links, i, { ...link, url: e.target.value }))}
            placeholder="https://..."
            className={`flex-1 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm${light ? ' font-light' : ''} placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0`}
          />
          <button
            type="button"
            onClick={() => onChange(removeAt(links, i))}
            className="p-1 text-slate-600 hover:text-danger-400 transition-colors cursor-pointer flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...links, { label: '', url: '' } as T])}
        className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer mt-1"
      >
        <Plus className="w-3.5 h-3.5" /> Dodaj link
      </button>
    </div>
  );
}

export function BulletsEditor({
  bullets,
  onChange,
  light = false,
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
  light?: boolean;
}) {
  return (
    <div>
      {bullets.map((bullet, i) => (
        <div key={i} className="flex gap-2 items-start mb-2">
          <span className="text-slate-400 text-sm mt-1.5 flex-shrink-0 w-4">•</span>
          <textarea
            value={bullet}
            onChange={e => onChange(updateAt(bullets, i, e.target.value))}
            rows={2}
            placeholder="Opis..."
            className={`flex-1 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm${light ? ' font-light' : ''} placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-y min-w-0`}
          />
          <button
            type="button"
            onClick={() => onChange(removeAt(bullets, i))}
            className="mt-1.5 p-1 text-slate-600 hover:text-danger-400 transition-colors cursor-pointer flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...bullets, ''])}
        className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer mt-1"
      >
        <Plus className="w-3.5 h-3.5" /> Dodaj punkt
      </button>
    </div>
  );
}
