import { useState, useEffect, createElement, useRef } from 'react';
import type { ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Save, Eye, EyeOff, ArrowLeft, FileEdit, Pencil, Check, FileDown, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { Button, PageHeader } from '../components/ui';
import type { CVData, CVLink, CVCustomSection } from '../templates/cv/types';
import { defaultCVData } from '../templates/cv/defaultCVData';
import { CVTemplate } from '../templates/cv/CVTemplate';
import { CVHtml } from '../templates/cv/CVHtml';
import {
  getCVDataById,
  saveCVDataById,
} from '../lib/generateCV';
import { uploadCVFile } from '../lib/db';
import { useUserLinks } from '../hooks/useUserLinks';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

const DRAFT_KEY = 'jo-cv-editor-draft';

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

/** Editable section heading — pencil always visible, with collapse toggle and optional enable/disable checkbox */
function SectionHeading({
  title,
  onRename,
  enabled,
  onToggleEnabled,
  collapsed,
  onToggleCollapse,
}: {
  title: string;
  onRename?: (v: string) => void;
  enabled?: boolean;
  onToggleEnabled?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  const commit = () => {
    onRename?.(draft || title);
    setEditing(false);
  };

  return (
    <div className="border-b border-primary-500/40 pb-1.5 mb-4 mt-8 flex items-center gap-2">
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
          <h2 className="text-xs font-medium text-primary-400 uppercase tracking-widest">
            {title}
          </h2>
          {onRename && (
            <button
              type="button"
              onClick={() => { setDraft(title); setEditing(true); }}
              className="p-0.5 text-slate-500 hover:text-primary-400 transition-colors cursor-pointer flex-shrink-0"
              title="Zmień nazwę"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </>
      )}
      <div className="flex-1" />
      {onToggleEnabled !== undefined && enabled !== undefined && (
        <label className="flex items-center gap-1 cursor-pointer flex-shrink-0 mr-1" title={enabled ? 'Wyłącz sekcję' : 'Włącz sekcję'}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={onToggleEnabled}
            className="w-3.5 h-3.5"
          />
        </label>
      )}
      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
  const { links: userLinks } = useUserLinks();

  const editCvId = searchParams.get('edit');
  const editingCv = editCvId ? state.cvs.find(cv => cv.id === editCvId) : null;

  const [data, setData] = useState<CVData>(() => {
    if (editCvId) {
      const stored = getCVDataById(editCvId);
      if (stored) return stored;
    }
    // Load draft for new CV
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) { const parsed = JSON.parse(raw); return parsed.data ?? emptyData(); }
    } catch { /* ignore */ }
    return emptyData();
  });

  const [cvName, setCvName] = useState(() => {
    if (editingCv) return editingCv.name;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) { const parsed = JSON.parse(raw); return parsed.name ?? ''; }
    } catch { /* ignore */ }
    return '';
  });
  const [nameError, setNameError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const nameRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  // Build dbLinks from user's link database (Moje linki)
  const dbLinks: DbLink[] = userLinks.map(l => ({ label: l.label, targetUrl: l.url }));

  // Auto-fill contact links + email for brand-new CVs (no draft, no edit)
  const autoFilledLinks = useRef(false);
  useEffect(() => {
    if (editCvId) return;
    if (localStorage.getItem(DRAFT_KEY)) return;
    if (autoFilledLinks.current) return;
    if (userLinks.length === 0 && !user?.email) return;
    autoFilledLinks.current = true;
    setData(d => ({
      ...d,
      contact: {
        ...d.contact,
        ...(user?.email ? { email: user.email } : {}),
        ...(userLinks.length > 0 ? { links: userLinks.map(l => ({ label: l.label, url: l.url })) } : {}),
      },
    }));
  }, [userLinks, user, editCvId]);

  const set = (patch: Partial<CVData>) => setData(d => ({ ...d, ...patch }));

  /** Save draft to localStorage — no PDF, no Supabase */
  const handleDraftSave = () => {
    if (editCvId) {
      // For existing CV: just persist editor data locally
      saveCVDataById(editCvId, data);
    } else {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ name: cvName, data }));
    }
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const handleSave = async () => {
    if (!cvName.trim()) {
      setNameError(true);
      nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setNameError(false);
    setIsSaving(true);

    // Auto-generate PDF and upload to storage
    let fileName: string | undefined;
    if (user) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const el = createElement(CVTemplate, { data }) as unknown as ReactElement<DocumentProps, any>;
        const blob = await pdf(el).toBlob();
        const cvId = editCvId ?? uid();
        const safeName = cvName
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9._-]/g, '');
        const uniqueFileName = `${Date.now()}_${safeName}.pdf`;
        const pdfFile = new File([blob], uniqueFileName, { type: 'application/pdf' });
        const result = await uploadCVFile(user.id, cvId, uniqueFileName, pdfFile);
        if (result && !result.error) fileName = result.path;
      } catch (e) {
        console.error('PDF auto-generate error:', e);
      }
    }

    if (editCvId && editingCv) {
      saveCVDataById(editCvId, data);
      dispatch({ type: 'UPDATE_CV', payload: { ...editingCv, name: cvName, ...(fileName ? { fileName } : {}) } });
      setSaved(true);
      setIsSaving(false);
      setTimeout(() => { setSaved(false); navigate('/cv'); }, 800);
    } else {
      const newId = uid();
      saveCVDataById(newId, data);
      dispatch({ type: 'ADD_CV', payload: { id: newId, name: cvName, isDefault: state.cvs.length === 0, fileName } });
      localStorage.removeItem(DRAFT_KEY);
      setData(emptyData());
      setCvName('');
      setSaved(true);
      setIsSaving(false);
      setTimeout(() => { setSaved(false); navigate('/cv'); }, 800);
    }
  };

  const handlePreview = () => setShowPreview(v => !v);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const el = createElement(CVTemplate, { data }) as unknown as ReactElement<DocumentProps, any>;
      const blob = await pdf(el).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.name || 'CV'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className={showPreview ? 'pb-20' : 'space-y-2 pb-28'}>
      {!showPreview && (
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
              onClick={handleDraftSave}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                draftSaved ? 'bg-success-500/20 text-success-400' : 'bg-dark-700 hover:bg-dark-600 text-slate-300'
              }`}
              title="Zapisz szkic (bez eksportu do bazy CV)"
            >
              <Save className="w-4 h-4" />
              {draftSaved ? 'Zapisano szkic' : 'Zapisz szkic'}
            </button>
          </div>
        }
      />
      )}

      {!showPreview && (<>
      {/* CV name — required */}
      <div ref={nameRef} className="bg-dark-800 border border-dark-600 p-4">
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
      <SectionHeading
        title="Nagłówek"
        collapsed={collapsed['header']}
        onToggleCollapse={() => toggle('header')}
      />
      {!collapsed['header'] && (
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
      )}

      {/* ── Kontakt ──────────────────────────────────────────────────── */}
      <SectionHeading
        title="Kontakt"
        collapsed={collapsed['contact']}
        onToggleCollapse={() => toggle('contact')}
      />
      {!collapsed['contact'] && (
        <>
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
        </>
      )}

      {/* ── Profil ───────────────────────────────────────────────────── */}
      <SectionHeading
        title={data.profileTitle || 'Profil'}
        onRename={v => set({ profileTitle: v })}
        collapsed={collapsed['profile']}
        onToggleCollapse={() => toggle('profile')}
      />
      {!collapsed['profile'] && (
        <TextArea value={data.profile} onChange={v => set({ profile: v })} rows={5} placeholder="Krótki opis..." />
      )}

      {/* ── Podejście do pracy (opcjonalne) ──────────────────────────── */}
      <SectionHeading
        title={data.approachTitle || 'Podejście do pracy'}
        onRename={v => set({ approachTitle: v })}
        enabled={data.showApproach !== false}
        onToggleEnabled={() => set({ showApproach: !data.showApproach })}
        collapsed={collapsed['approach']}
        onToggleCollapse={() => toggle('approach')}
      />
      {!collapsed['approach'] && (
        <TextArea value={data.approach} onChange={v => set({ approach: v })} rows={4} placeholder="Jak pracujesz..." />
      )}

      {/* ── Technologie ──────────────────────────────────────────────── */}
      <SectionHeading
        title="Technologie i narzędzia"
        enabled={data.showTechnologies !== false}
        onToggleEnabled={() => set({ showTechnologies: !data.showTechnologies })}
        collapsed={collapsed['tech']}
        onToggleCollapse={() => toggle('tech')}
      />
      {!collapsed['tech'] && (
        <>
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
        </>
      )}

      {/* ── Projekty ─────────────────────────────────────────────────── */}
      <SectionHeading
        title="Wybrane projekty"
        enabled={data.showProjects !== false}
        onToggleEnabled={() => set({ showProjects: !data.showProjects })}
        collapsed={collapsed['projects']}
        onToggleCollapse={() => toggle('projects')}
      />
      {!collapsed['projects'] && (
        <>
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
        </>
      )}

      {/* ── Doświadczenie ─────────────────────────────────────────────── */}
      <SectionHeading
        title="Doświadczenie zawodowe"
        collapsed={collapsed['experience']}
        onToggleCollapse={() => toggle('experience')}
      />
      {!collapsed['experience'] && (
        <>
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
        </>
      )}

      {/* ── Wykształcenie ─────────────────────────────────────────────── */}
      <SectionHeading
        title="Wykształcenie"
        collapsed={collapsed['education']}
        onToggleCollapse={() => toggle('education')}
      />
      {!collapsed['education'] && (
        <>
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
        </>
      )}

      {/* ── Sekcje własne ─────────────────────────────────────────────── */}
      <SectionHeading
        title="Sekcje własne"
        collapsed={collapsed['custom']}
        onToggleCollapse={() => toggle('custom')}
      />
      {!collapsed['custom'] && (
        <>
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
        </>
      )}

      {/* ── Zainteresowania ───────────────────────────────────────────── */}
      <SectionHeading
        title="Zainteresowania"
        collapsed={collapsed['interests']}
        onToggleCollapse={() => toggle('interests')}
      />
      {!collapsed['interests'] && (
        <TextInput value={data.interests} onChange={v => set({ interests: v })} placeholder="Kawa • Muzyka • Sport…" />
      )}

      {/* ── RODO ──────────────────────────────────────────────────────── */}
      <SectionHeading
        title="Klauzula RODO"
        collapsed={collapsed['rodo']}
        onToggleCollapse={() => toggle('rodo')}
      />
      {!collapsed['rodo'] && (
        <TextArea value={data.rodo} onChange={v => set({ rodo: v })} rows={2} placeholder="Wyrażam zgodę na przetwarzanie…" />
      )}

      </>)}

      {/* ── Preview ───────────────────────────────────────────────────── */}
      {showPreview && <CVHtml data={data} preview />}

      {/* ── Bottom bar (always visible) ────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-dark-900 border-t border-dark-700 px-4 py-3 flex items-center gap-2 z-40">
        <span className="text-sm text-slate-400 flex-1 truncate hidden sm:block">
          {cvName || <span className="text-slate-600">Brak nazwy CV</span>}
        </span>
        <button
          onClick={handlePreview}
          className="flex items-center gap-1.5 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-slate-300 text-sm transition-colors cursor-pointer"
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showPreview ? 'Zamknij' : 'Podgląd'}
        </button>
        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          title="Pobierz PDF"
          className="flex items-center justify-center px-2.5 py-2 bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-6 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 ${
            saved ? 'bg-success-500/20 text-success-400' : 'bg-primary-500 hover:bg-primary-400 text-slate-900'
          }`}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Generuję PDF…' : saved ? 'Zapisano!' : editCvId ? 'Zapisz zmiany' : 'Zapisz do Bazy CV'}
        </button>
      </div>
    </div>
  );
}
