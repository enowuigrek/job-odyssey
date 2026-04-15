import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Save, Eye, ArrowLeft, FileEdit, Pencil, Check } from 'lucide-react';
import { Button, PageHeader } from '../components/ui';
import type { CVData, CVLink, CVCustomSection } from '../templates/cv/types';
import { defaultCVData } from '../templates/cv/defaultCVData';
import {
  CV_EDITOR_STORAGE_KEY,
  CV_PRINT_STORAGE_KEY,
  getCVDataById,
  saveCVDataById,
} from '../lib/generateCV';
import { getDistinctTrackingLinksForUser } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyData(): CVData {
  return JSON.parse(JSON.stringify(defaultCVData)) as CVData;
}

function uid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function updateAt<T>(arr: T[], i: number, val: T): T[] {
  return arr.map((x, idx) => (idx === i ? val : x));
}
function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface DbLink { label: string; targetUrl: string; }

/** Editable section heading — click pencil to rename, with optional toggle */
function SectionHeading({
  title,
  onRename,
  visible,
  onToggle,
}: {
  title: string;
  onRename?: (v: string) => void;
  visible?: boolean;
  onToggle?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const commit = () => {
    onRename?.(draft || title);
    setEditing(false);
  };

  return (
    <div className="border-b border-primary-500/40 pb-1.5 mb-4 mt-8 flex items-center gap-2 group">
      {editing ? (
        <>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === 'Enter' && commit()}
            autoFocus
            className="flex-1 bg-transparent text-xs font-medium text-primary-400 uppercase tracking-widest focus:outline-none border-b border-primary-500"
          />
          <button type="button" onClick={commit} className="p-1 text-primary-400 cursor-pointer">
            <Check className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xs font-medium text-primary-400 uppercase tracking-widest flex-1">
            {title}
          </h2>
          {onRename && (
            <button
              type="button"
              onClick={() => { setDraft(title); setEditing(true); }}
              className="p-1 text-slate-600 hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Zmień nazwę sekcji"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </>
      )}
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex-shrink-0 ml-1"
        >
          {visible !== false ? 'Ukryj' : 'Pokaż'}
        </button>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-slate-400 mb-1">{children}</label>;
}

function TextInput({
  value, onChange, placeholder, className = '',
}: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-1.5 bg-dark-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${className}`}
    />
  );
}

function TextArea({
  value, onChange, placeholder, rows = 4,
}: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 bg-dark-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-y"
    />
  );
}

function LinkRow({ link, dbLinks, onChange, onRemove }: {
  link: CVLink; dbLinks: DbLink[]; onChange: (l: CVLink) => void; onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-center mb-2">
      <input
        value={link.label}
        onChange={e => onChange({ ...link, label: e.target.value })}
        placeholder="Etykieta"
        className="w-28 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0"
      />
      <input
        value={link.url}
        onChange={e => onChange({ ...link, url: e.target.value })}
        placeholder="https://..."
        className="flex-1 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0"
      />
      {dbLinks.length > 0 && (
        <select
          value=""
          onChange={e => {
            const found = dbLinks.find(l => l.targetUrl === e.target.value);
            if (found) onChange({ ...link, label: found.label, url: found.targetUrl });
          }}
          className="px-2 py-1.5 bg-dark-600 text-slate-400 text-xs focus:outline-none cursor-pointer flex-shrink-0"
        >
          <option value="">z bazy</option>
          {dbLinks.map(l => <option key={l.targetUrl} value={l.targetUrl}>{l.label}</option>)}
        </select>
      )}
      <button type="button" onClick={onRemove} className="p-1 text-slate-600 hover:text-danger-400 transition-colors cursor-pointer flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function LinksEditor({ links, dbLinks, onChange }: {
  links: CVLink[]; dbLinks: DbLink[]; onChange: (links: CVLink[]) => void;
}) {
  return (
    <div>
      {links.map((link, i) => (
        <LinkRow
          key={i}
          link={link}
          dbLinks={dbLinks}
          onChange={v => onChange(updateAt(links, i, v))}
          onRemove={() => onChange(removeAt(links, i))}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange([...links, { label: '', url: '' }])}
        className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer mt-1"
      >
        <Plus className="w-3.5 h-3.5" /> Dodaj link
      </button>
    </div>
  );
}

/** Individual bullet fields — each textarea is one bullet point */
function BulletsEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
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
            className="flex-1 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-y min-w-0"
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

function ItemCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="bg-dark-800 border border-dark-600 p-4 mb-3 relative">
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-3 right-3 p-1 text-slate-600 hover:text-danger-400 transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CVEditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { state, dispatch } = useApp();

  const editCvId = searchParams.get('edit');
  const editingCv = editCvId ? state.cvs.find(cv => cv.id === editCvId) : null;

  const [data, setData] = useState<CVData>(() => {
    if (editCvId) {
      const stored = getCVDataById(editCvId);
      if (stored) return stored;
    }
    const draft = localStorage.getItem(CV_EDITOR_STORAGE_KEY);
    if (draft && !editCvId) {
      try { return JSON.parse(draft) as CVData; } catch { /* */ }
    }
    return emptyData();
  });

  const [cvName, setCvName] = useState(editingCv?.name ?? '');
  const [nameError, setNameError] = useState(false);
  const [dbLinks, setDbLinks] = useState<DbLink[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDistinctTrackingLinksForUser(user.id).then(setDbLinks).catch(() => {});
  }, [user]);

  // Persist draft (new CV only) to localStorage while editing
  useEffect(() => {
    if (!editCvId) {
      localStorage.setItem(CV_EDITOR_STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, editCvId]);

  const set = (patch: Partial<CVData>) => setData(d => ({ ...d, ...patch }));

  const handleSave = () => {
    if (!cvName.trim()) { setNameError(true); return; }
    setNameError(false);

    if (editCvId && editingCv) {
      saveCVDataById(editCvId, data);
      dispatch({ type: 'UPDATE_CV', payload: { ...editingCv, name: cvName } });
      setSaved(true);
      setTimeout(() => { setSaved(false); navigate('/cv'); }, 800);
    } else {
      const newId = uid();
      saveCVDataById(newId, data);
      dispatch({ type: 'ADD_CV', payload: { id: newId, name: cvName, isDefault: state.cvs.length === 0 } });
      // Clear draft
      localStorage.removeItem(CV_EDITOR_STORAGE_KEY);
      setData(emptyData());
      setCvName('');
      setSaved(true);
      setTimeout(() => { setSaved(false); navigate('/cv'); }, 800);
    }
  };

  const handlePreview = () => {
    localStorage.setItem(CV_PRINT_STORAGE_KEY, JSON.stringify(data));
    navigate('/cv-generator');
  };

  return (
    <div className="space-y-2 pb-28">
      <PageHeader
        icon={FileEdit}
        title={editCvId ? 'Edytuj CV' : 'Nowe CV'}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 text-slate-300 text-sm transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Podgląd</span>
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                saved ? 'bg-success-500/20 text-success-400' : 'bg-primary-500 hover:bg-primary-400 text-slate-900'
              }`}
            >
              <Save className="w-4 h-4" />
              {saved ? 'Zapisano!' : 'Zapisz'}
            </button>
          </div>
        }
      />

      {/* CV name — required */}
      <div className="bg-dark-800 border border-dark-600 p-4">
        <FieldLabel>Nazwa CV (widoczna w Bazie CV) *</FieldLabel>
        <TextInput
          value={cvName}
          onChange={v => { setCvName(v); if (v.trim()) setNameError(false); }}
          placeholder="np. CV Frontend Developer 2025"
          className={nameError ? 'ring-1 ring-danger-500' : ''}
        />
        {nameError && <p className="text-xs text-danger-400 mt-1">Podaj nazwę CV przed zapisaniem.</p>}
        {dbLinks.length > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            {dbLinks.length} linków z bazy dostępnych w polach linków.
          </p>
        )}
      </div>

      {/* ── Nagłówek ─────────────────────────────────────────────────── */}
      <SectionHeading title="Nagłówek" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <FieldLabel>Imię i nazwisko</FieldLabel>
          <TextInput value={data.name} onChange={v => set({ name: v })} placeholder="IMIĘ NAZWISKO" />
        </div>
        <div>
          <FieldLabel>Podtytuł / stanowisko</FieldLabel>
          <TextInput value={data.subtitle} onChange={v => set({ subtitle: v })} placeholder="Frontend Developer | React" />
        </div>
      </div>

      {/* ── Kontakt ──────────────────────────────────────────────────── */}
      <SectionHeading title="Kontakt" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <FieldLabel>Lokalizacja</FieldLabel>
          <TextInput value={data.contact.location} onChange={v => set({ contact: { ...data.contact, location: v } })} placeholder="Miasto" />
        </div>
        <div>
          <FieldLabel>Telefon</FieldLabel>
          <TextInput value={data.contact.phone} onChange={v => set({ contact: { ...data.contact, phone: v } })} placeholder="000 000 000" />
        </div>
        <div>
          <FieldLabel>E-mail</FieldLabel>
          <TextInput value={data.contact.email} onChange={v => set({ contact: { ...data.contact, email: v } })} placeholder="email@example.com" />
        </div>
      </div>
      <FieldLabel>Linki (LinkedIn, GitHub, Portfolio…)</FieldLabel>
      <LinksEditor
        links={data.contact.links}
        dbLinks={dbLinks}
        onChange={links => set({ contact: { ...data.contact, links } })}
      />

      {/* ── Profil ───────────────────────────────────────────────────── */}
      <SectionHeading
        title={data.profileTitle || 'Profil'}
        onRename={v => set({ profileTitle: v })}
      />
      <TextArea value={data.profile} onChange={v => set({ profile: v })} rows={5} placeholder="Krótki opis..." />

      {/* ── Podejście do pracy (opcjonalne) ──────────────────────────── */}
      <SectionHeading
        title={data.approachTitle || 'Podejście do pracy'}
        onRename={v => set({ approachTitle: v })}
        visible={data.showApproach !== false}
        onToggle={() => set({ showApproach: data.showApproach === false ? true : false })}
      />
      {data.showApproach !== false && (
        <TextArea value={data.approach} onChange={v => set({ approach: v })} rows={4} placeholder="Jak pracujesz..." />
      )}

      {/* ── Technologie ──────────────────────────────────────────────── */}
      <SectionHeading title="Technologie i narzędzia" />
      {data.technologies.map((tech, ti) => (
        <ItemCard key={ti} onRemove={() => set({ technologies: removeAt(data.technologies, ti) })}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pr-6">
            <div>
              <FieldLabel>Kategoria</FieldLabel>
              <TextInput
                value={tech.category}
                onChange={v => set({ technologies: updateAt(data.technologies, ti, { ...tech, category: v }) })}
                placeholder="Frontend:"
              />
            </div>
            <div className="md:col-span-2">
              <FieldLabel>Technologie</FieldLabel>
              <TextInput
                value={tech.items}
                onChange={v => set({ technologies: updateAt(data.technologies, ti, { ...tech, items: v }) })}
                placeholder="React, TypeScript, Tailwind…"
              />
            </div>
          </div>
        </ItemCard>
      ))}
      <Button variant="secondary" onClick={() => set({ technologies: [...data.technologies, { category: '', items: '' }] })}>
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj kategorię
      </Button>

      {/* ── Projekty ─────────────────────────────────────────────────── */}
      <SectionHeading title="Wybrane projekty" />
      {data.projects.map((proj, pi) => (
        <ItemCard key={pi} onRemove={() => set({ projects: removeAt(data.projects, pi) })}>
          <div className="space-y-3 pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Nazwa projektu</FieldLabel>
                <TextInput value={proj.name} onChange={v => set({ projects: updateAt(data.projects, pi, { ...proj, name: v }) })} placeholder="NAZWA PROJEKTU" />
              </div>
              <div>
                <FieldLabel>Tagline</FieldLabel>
                <TextInput value={proj.tagline} onChange={v => set({ projects: updateAt(data.projects, pi, { ...proj, tagline: v }) })} placeholder="Jedno zdanie…" />
              </div>
            </div>
            <div>
              <FieldLabel>Opis</FieldLabel>
              <TextArea value={proj.description} onChange={v => set({ projects: updateAt(data.projects, pi, { ...proj, description: v }) })} rows={3} />
            </div>
            <div>
              <FieldLabel>Stack</FieldLabel>
              <TextInput value={proj.stack} onChange={v => set({ projects: updateAt(data.projects, pi, { ...proj, stack: v }) })} placeholder="Stack: React, TypeScript…" />
            </div>
            <div>
              <FieldLabel>Notatka (opcjonalna)</FieldLabel>
              <TextInput value={proj.note ?? ''} onChange={v => set({ projects: updateAt(data.projects, pi, { ...proj, note: v || undefined }) })} placeholder="np. Zbudowany z AI" />
            </div>
            <div>
              <FieldLabel>Linki</FieldLabel>
              <LinksEditor links={proj.links} dbLinks={dbLinks} onChange={links => set({ projects: updateAt(data.projects, pi, { ...proj, links }) })} />
            </div>
          </div>
        </ItemCard>
      ))}
      <Button variant="secondary" onClick={() => set({ projects: [...data.projects, { name: '', tagline: '', description: '', stack: '', links: [] }] })}>
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj projekt
      </Button>

      {/* ── Doświadczenie ─────────────────────────────────────────────── */}
      <SectionHeading title="Doświadczenie zawodowe" />
      {data.experience.map((exp, ei) => (
        <ItemCard key={ei} onRemove={() => set({ experience: removeAt(data.experience, ei) })}>
          <div className="space-y-3 pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Firma</FieldLabel>
                <TextInput value={exp.company} onChange={v => set({ experience: updateAt(data.experience, ei, { ...exp, company: v }) })} placeholder="NAZWA FIRMY" />
              </div>
              <div>
                <FieldLabel>Link firmy (opcjonalny)</FieldLabel>
                <div className="flex gap-2">
                  <input
                    value={exp.companyLink?.label ?? ''}
                    onChange={e => {
                      const label = e.target.value;
                      const url = exp.companyLink?.url ?? '';
                      set({ experience: updateAt(data.experience, ei, { ...exp, companyLink: label || url ? { label, url } : undefined }) });
                    }}
                    placeholder="Etykieta"
                    className="w-24 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0"
                  />
                  <input
                    value={exp.companyLink?.url ?? ''}
                    onChange={e => {
                      const url = e.target.value;
                      const label = exp.companyLink?.label ?? '';
                      set({ experience: updateAt(data.experience, ei, { ...exp, companyLink: label || url ? { label, url } : undefined }) });
                    }}
                    placeholder="https://…"
                    className="flex-1 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0"
                  />
                </div>
              </div>
            </div>

            {exp.roles.map((role, ri) => (
              <div key={ri} className="bg-dark-700/60 p-3 relative">
                <button
                  type="button"
                  onClick={() => set({ experience: updateAt(data.experience, ei, { ...exp, roles: removeAt(exp.roles, ri) }) })}
                  className="absolute top-2 right-2 p-1 text-slate-600 hover:text-danger-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="pr-6 mb-3">
                  <FieldLabel>Stanowisko | lata</FieldLabel>
                  <TextInput
                    value={role.title}
                    onChange={v => set({ experience: updateAt(data.experience, ei, { ...exp, roles: updateAt(exp.roles, ri, { ...role, title: v }) }) })}
                    placeholder="Senior Developer | 2023 – obecnie"
                  />
                </div>
                <FieldLabel>Punkty</FieldLabel>
                <BulletsEditor
                  bullets={role.bullets}
                  onChange={bullets => set({ experience: updateAt(data.experience, ei, { ...exp, roles: updateAt(exp.roles, ri, { ...role, bullets }) }) })}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => set({ experience: updateAt(data.experience, ei, { ...exp, roles: [...exp.roles, { title: '', years: '', bullets: [] }] }) })}
              className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Dodaj stanowisko
            </button>
          </div>
        </ItemCard>
      ))}
      <Button variant="secondary" onClick={() => set({ experience: [...data.experience, { company: '', roles: [{ title: '', years: '', bullets: [] }] }] })}>
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj firmę
      </Button>

      {/* ── Wykształcenie ─────────────────────────────────────────────── */}
      <SectionHeading title="Wykształcenie" />
      {data.education.map((edu, edi) => (
        <ItemCard key={edi} onRemove={() => set({ education: removeAt(data.education, edi) })}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pr-6">
            <div>
              <FieldLabel>Szkoła / uczelnia</FieldLabel>
              <TextInput value={edu.school} onChange={v => set({ education: updateAt(data.education, edi, { ...edu, school: v }) })} placeholder="UCZELNIA" />
            </div>
            <div>
              <FieldLabel>Kierunek</FieldLabel>
              <TextInput value={edu.degree} onChange={v => set({ education: updateAt(data.education, edi, { ...edu, degree: v }) })} placeholder="Informatyka" />
            </div>
            <div>
              <FieldLabel>Lata</FieldLabel>
              <TextInput value={edu.years} onChange={v => set({ education: updateAt(data.education, edi, { ...edu, years: v }) })} placeholder="2019 – 2023" />
            </div>
          </div>
        </ItemCard>
      ))}
      <Button variant="secondary" onClick={() => set({ education: [...data.education, { school: '', degree: '', years: '' }] })}>
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj wykształcenie
      </Button>

      {/* ── Sekcje własne ─────────────────────────────────────────────── */}
      <SectionHeading title="Sekcje własne" />
      <p className="text-xs text-slate-500 -mt-2 mb-3">Dowolne sekcje z własnym nagłówkiem — np. Certyfikaty, Języki, Wolontariat.</p>
      {(data.customSections ?? []).map((sec, si) => (
        <ItemCard key={sec.id} onRemove={() => set({ customSections: removeAt(data.customSections ?? [], si) })}>
          <div className="space-y-2 pr-6">
            <div>
              <FieldLabel>Nagłówek sekcji</FieldLabel>
              <TextInput
                value={sec.title}
                onChange={v => set({ customSections: updateAt(data.customSections ?? [], si, { ...sec, title: v }) })}
                placeholder="np. Certyfikaty"
              />
            </div>
            <div>
              <FieldLabel>Treść</FieldLabel>
              <TextArea
                value={sec.content}
                onChange={v => set({ customSections: updateAt(data.customSections ?? [], si, { ...sec, content: v }) })}
                rows={3}
              />
            </div>
          </div>
        </ItemCard>
      ))}
      <Button variant="secondary" onClick={() => set({ customSections: [...(data.customSections ?? []), { id: uid(), title: '', content: '' }] })}>
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj sekcję
      </Button>

      {/* ── Zainteresowania ───────────────────────────────────────────── */}
      <SectionHeading title="Zainteresowania" />
      <TextInput value={data.interests} onChange={v => set({ interests: v })} placeholder="Kawa • Muzyka • Sport…" />

      {/* ── RODO ──────────────────────────────────────────────────────── */}
      <SectionHeading title="Klauzula RODO" />
      <TextArea value={data.rodo} onChange={v => set({ rodo: v })} rows={2} placeholder="Wyrażam zgodę na przetwarzanie…" />

      {/* ── Bottom save bar ────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-dark-900 border-t border-dark-700 px-4 py-3 flex items-center gap-2 z-40">
        <span className="text-sm text-slate-400 flex-1 truncate hidden sm:block">
          {cvName || <span className="text-slate-600">Brak nazwy CV</span>}
        </span>
        <button
          onClick={handlePreview}
          className="flex items-center gap-1.5 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-slate-300 text-sm transition-colors cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          Podgląd
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 px-6 py-2 text-sm font-medium transition-colors cursor-pointer ${
            saved ? 'bg-success-500/20 text-success-400' : 'bg-primary-500 hover:bg-primary-400 text-slate-900'
          }`}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Zapisano!' : editCvId ? 'Zapisz zmiany' : 'Zapisz do Bazy CV'}
        </button>
      </div>
    </div>
  );
}
