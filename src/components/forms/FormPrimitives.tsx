import { ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { updateAt, removeAt } from '../../utils/array';
import { useAutoResizeTextarea } from '../../hooks/useAutoResizeTextarea';
import { Button } from '../ui/Button';

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
      className={`w-full px-3 py-1.5 bg-dark-700 text-white text-sm${light ? ' font-light' : ''} placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${className}`}
    />
  );
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1970 + 2 }, (_, i) => String(CURRENT_YEAR + 1 - i));

function parseYearRange(value: string): { from: string; to: string } {
  const [from = '', to = ''] = value.split('–').map(s => s.trim());
  return { from, to };
}

function formatYearRange(from: string, to: string): string {
  if (!from && !to) return '';
  if (from && !to) return from;
  if (!from && to) return to;
  return `${from} – ${to}`;
}

/** Two dropdowns ("Od" / "Do", "Do" also offers "Obecnie") composing a "YYYY – YYYY" / "YYYY – obecnie" string. */
export function YearRangePicker({
  value,
  onChange,
  light = false,
}: {
  value: string;
  onChange: (v: string) => void;
  light?: boolean;
}) {
  const { from, to } = parseYearRange(value);
  const selectClass = `px-2 py-1.5 bg-dark-700 text-white text-sm${light ? ' font-light' : ''} focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer`;

  return (
    <div className="flex items-center gap-2">
      <select
        value={from}
        onChange={e => onChange(formatYearRange(e.target.value, to))}
        className={selectClass}
      >
        <option value="">Od</option>
        {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <span className="text-slate-500 text-sm flex-shrink-0">–</span>
      <select
        value={to}
        onChange={e => onChange(formatYearRange(from, e.target.value))}
        className={selectClass}
      >
        <option value="">Do</option>
        <option value="obecnie">Obecnie</option>
        {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
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
  const ref = useAutoResizeTextarea(value);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2 bg-dark-700 text-white text-sm${light ? ' font-light' : ''} placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none overflow-hidden`}
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
            className={`w-28 px-2 py-1.5 bg-dark-700 text-white text-sm${light ? ' font-light' : ''} placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0`}
          />
          <input
            value={link.url}
            onChange={e => onChange(updateAt(links, i, { ...link, url: e.target.value }))}
            placeholder="https://..."
            className={`flex-1 px-2 py-1.5 bg-dark-700 text-white text-sm${light ? ' font-light' : ''} placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0`}
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
      <Button variant="primary" size="sm" type="button" onClick={() => onChange([...links, { label: '', url: '' } as T])} className="mt-1">
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj link
      </Button>
    </div>
  );
}

function BulletRow({
  bullet,
  onChange,
  onRemove,
  light,
}: {
  bullet: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  light: boolean;
}) {
  const ref = useAutoResizeTextarea(bullet);

  return (
    <div className="flex gap-2 items-start mb-2">
      <span className="text-slate-400 text-sm mt-1.5 flex-shrink-0 w-4">•</span>
      <textarea
        ref={ref}
        value={bullet}
        onChange={e => onChange(e.target.value)}
        rows={2}
        placeholder="Opis..."
        className={`flex-1 px-2 py-1.5 bg-dark-700 text-white text-sm${light ? ' font-light' : ''} placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none overflow-hidden min-w-0`}
      />
      <button
        type="button"
        onClick={onRemove}
        className="mt-1.5 p-1 text-slate-600 hover:text-danger-400 transition-colors cursor-pointer flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
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
        <BulletRow
          key={i}
          bullet={bullet}
          onChange={v => onChange(updateAt(bullets, i, v))}
          onRemove={() => onChange(removeAt(bullets, i))}
          light={light}
        />
      ))}
      <Button variant="primary" size="sm" type="button" onClick={() => onChange([...bullets, ''])} className="mt-1">
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj punkt
      </Button>
    </div>
  );
}

/** Single-line tag list — one input per item, add/remove instead of one blob string. */
export function TagListEditor({
  items,
  onChange,
  addLabel,
  placeholder,
  light = false,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  placeholder?: string;
  light?: boolean;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            value={item}
            onChange={e => onChange(updateAt(items, i, e.target.value))}
            placeholder={placeholder}
            className={`flex-1 px-2 py-1.5 bg-dark-700 text-white text-sm${light ? ' font-light' : ''} placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0`}
          />
          <button
            type="button"
            onClick={() => onChange(removeAt(items, i))}
            className="p-1 text-slate-600 hover:text-danger-400 transition-colors cursor-pointer flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <Button variant="primary" size="sm" type="button" onClick={() => onChange([...items, ''])}>
        <Plus className="w-3.5 h-3.5 mr-1.5" /> {addLabel}
      </Button>
    </div>
  );
}
