import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal, Button } from '../ui';
import { CvLinkMapping } from '../../hooks/useCVLinkMappings';
import { UserLink } from '../../hooks/useUserLinks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mappings: CvLinkMapping[]) => void;
  detectedUrls: string[];
  userLinks: UserLink[];
  cvName: string;
}

type MappingType = CvLinkMapping['type'];

function normalizeUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
    .toLowerCase()
    .trim();
}

function detectType(url: string): MappingType {
  const norm = normalizeUrl(url);
  if (norm.startsWith('linkedin.com')) return 'linkedin';
  if (norm.startsWith('github.com')) return 'github';
  return 'other';
}

function autoLabel(url: string, userLinks: UserLink[]): { label: string; type: MappingType } {
  const normUrl = normalizeUrl(url);
  const match = userLinks.find(l => normalizeUrl(l.url) === normUrl);
  if (match) return { label: match.label, type: match.type as MappingType };
  // Próba auto-wykrycia po częściowym dopasowaniu
  const partial = userLinks.find(l => {
    const n = normalizeUrl(l.url);
    return normUrl.startsWith(n) || n.startsWith(normUrl);
  });
  if (partial) return { label: partial.label, type: partial.type as MappingType };
  return { label: '', type: detectType(url) };
}

interface RowState {
  originalUrl: string;
  label: string;
  type: MappingType;
}

const TYPE_OPTIONS: { value: MappingType; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'github', label: 'GitHub' },
  { value: 'project', label: 'Projekt' },
  { value: 'other', label: 'Inne' },
];

export function CvLinkDetectionModal({ isOpen, onClose, onSave, detectedUrls, userLinks, cvName }: Props) {
  const [rows, setRows] = useState<RowState[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (detectedUrls.length > 0) {
      // PDF ma linki — pokaż je do potwierdzenia
      setRows(detectedUrls.map(url => {
        const { label, type } = autoLabel(url, userLinks);
        return { originalUrl: url, label, type };
      }));
    } else if (userLinks.length > 0) {
      // Brak wykrytych linków — pre-filluj z "Moje linki"
      setRows(userLinks.map(l => ({
        originalUrl: l.url,
        label: l.label,
        type: l.type as MappingType,
      })));
    } else {
      setRows([{ originalUrl: '', label: '', type: 'other' }]);
    }
  }, [isOpen, detectedUrls, userLinks]);

  const updateRow = (index: number, patch: Partial<RowState>) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, { originalUrl: '', label: '', type: 'other' }]);
  };

  const removeRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const valid = rows.filter(r => r.originalUrl.trim() && r.label.trim());
    onSave(valid.map(r => ({
      originalUrl: r.originalUrl.trim(),
      label: r.label.trim(),
      type: r.type,
    })));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Wykryte linki w CV — ${cvName}`}
      size="lg"
      disableBackdropClose
    >
      <div className="space-y-4">
        {detectedUrls.length > 0 ? (
          <p className="text-sm text-slate-400">
            Wykryto <span className="text-slate-200 font-medium">{detectedUrls.length}</span> linków w PDF. Sprawdź etykiety i zapisz.
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Nie wykryto linków automatycznie. Poniżej wczytano Twoje linki z profilu —
            <span className="text-slate-200"> usuń te, których nie ma w tym CV</span>, i zapisz.
          </p>
        )}

        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="bg-dark-700 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <input
                    type="url"
                    value={row.originalUrl}
                    onChange={e => updateRow(index, { originalUrl: e.target.value })}
                    placeholder="URL z CV (np. https://linkedin.com/in/...)"
                    className="w-full px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    readOnly={false}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="p-1.5 text-slate-500 hover:text-danger-400 transition-colors flex-shrink-0"
                  title="Usuń"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={row.label}
                  onChange={e => updateRow(index, { label: e.target.value })}
                  placeholder="Etykieta (np. LinkedIn, GitHub)"
                  className="flex-1 px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <select
                  value={row.type}
                  onChange={e => updateRow(index, { type: e.target.value as MappingType })}
                  className="px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-primary-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Dodaj link ręcznie
        </button>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
          <Button variant="secondary" onClick={onClose}>
            Pomiń
          </Button>
          <Button onClick={handleSave}>
            Zapisz mapowania
          </Button>
        </div>
      </div>
    </Modal>
  );
}
