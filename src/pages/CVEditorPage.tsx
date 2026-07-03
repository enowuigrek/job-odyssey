import { useState, useEffect, createElement, useRef } from 'react';
import type { ReactElement } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Save, Eye, EyeOff, ArrowLeft, FileEdit, Pencil, Check, Loader2, ChevronDown, ChevronRight, Database } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { Button, PageHeader, CollapsibleItem, Checkbox } from '../components/ui';
import { FieldLabel, TextInput, TextArea, LinksEditor, BulletsEditor, YearRangePicker, TagListEditor } from '../components/forms/FormPrimitives';
import type { CVData } from '../templates/cv/types';
import { defaultCVData } from '../templates/cv/defaultCVData';
import { CVTemplate } from '../templates/cv/CVTemplate';
import { CVHtml } from '../templates/cv/CVHtml';
import {
  getCVDataById,
  saveCVDataById,
} from '../lib/generateCV';
import { uploadCVFile } from '../lib/db';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useDragReorder } from '../hooks/useDragReorder';
import { updateAt, removeAt, moveAt } from '../utils/array';

function draftKey(userId?: string) {
  return userId ? `jo-cv-editor-draft-${userId}` : 'jo-cv-editor-draft';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyData(): CVData {
  return JSON.parse(JSON.stringify(defaultCVData)) as CVData;
}

function uid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
    <div
      className={`bg-dark-800 mb-2 mt-6 flex items-center gap-2 px-3 py-2.5 transition-colors select-none${
        onToggleCollapse ? ' cursor-pointer hover:bg-dark-700' : ''
      }`}
      onClick={editing ? undefined : onToggleCollapse}
    >
      {onToggleCollapse && (
        collapsed
          ? <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
      )}
      {editing ? (
        <>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === 'Enter' && commit()}
            autoFocus
            className="flex-1 bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-primary-500"
            onClick={e => e.stopPropagation()}
          />
          <button type="button" onClick={e => { e.stopPropagation(); commit(); }} className="p-1 text-primary-400 cursor-pointer flex-shrink-0">
            <Check className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <span className="text-sm font-semibold text-white flex-1 truncate">
            {title}
          </span>
          {onRename && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setDraft(title); setEditing(true); }}
              className="p-1 text-slate-500 hover:text-primary-400 transition-colors cursor-pointer flex-shrink-0"
              title="Zmień nazwę"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}
      {onToggleEnabled !== undefined && enabled !== undefined && (
        <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={enabled}
            onChange={onToggleEnabled}
            title={enabled ? 'Wyłącz sekcję' : 'Włącz sekcję'}
          />
        </div>
      )}
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

// ── ProfileImportMenu ─────────────────────────────────────────────────────────

function ProfileImportMenu<T>({
  items,
  labelFn,
  onImport,
  primaryLabel,
}: {
  items: T[];
  labelFn: (item: T) => string;
  onImport: (selected: T[]) => void;
  /** Gdy podany — przycisk wygląda jak główny "Dodaj X" i otwiera picker z profilu */
  primaryLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  if (items.length === 0 && !primaryLabel) return null;

  const toggle = (i: number) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const handleImport = () => {
    onImport(items.filter((_, i) => selected.has(i)));
    setOpen(false);
    setSelected(new Set());
  };

  const handleCancel = () => {
    setOpen(false);
    setSelected(new Set());
  };

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        size="sm"
        variant={primaryLabel ? 'primary' : 'secondary'}
        onClick={() => setOpen(v => !v)}
      >
        {primaryLabel ? <Plus className="w-3.5 h-3.5 mr-1.5" /> : <Database className="w-3.5 h-3.5 mr-1.5" />}
        {primaryLabel ?? 'Wybierz z profilu'}
      </Button>
      {open && (
        <div className="absolute z-20 bottom-full mb-1 left-0 bg-dark-800 border border-dark-600 p-3 w-64 shadow-xl">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 py-1">Brak pozycji w profilu kandydata.</p>
          ) : (
            <>
              <p className="text-xs text-slate-400 mb-2">Wybierz z profilu:</p>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 text-xs text-slate-300 hover:text-slate-100">
                    <Checkbox checked={selected.has(i)} onChange={() => toggle(i)} />
                    <span className="truncate cursor-pointer" onClick={() => toggle(i)}>{labelFn(item)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="border-t border-dark-700 mt-2 pt-2 flex gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleImport}
                className="text-xs px-3 py-1.5 bg-primary-500 text-slate-900 hover:bg-primary-400 cursor-pointer transition-colors"
              >
                Importuj
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs px-3 py-1.5 bg-dark-700 text-slate-400 hover:bg-dark-600 cursor-pointer transition-colors"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CVEditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { state, dispatch } = useApp();
  const { profile, descriptions, experiences, projects: profileProjects, techCategories, education: profileEducation, certificates: profileCertificates, isLoading: profileLoading } = useProfile();
  const editCvId = searchParams.get('edit');
  const editingCv = editCvId ? state.cvs.find(cv => cv.id === editCvId) : null;
  const DRAFT_KEY = draftKey(user?.id);

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

  const nameRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    header: true, contact: true, profile: true,
    tech: true, projects: true, experience: true, education: true,
    certificates: true, custom: true, interests: true, rodo: true,
  });
  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  // Auto-fill from Profil kandydata for brand-new CVs (no draft, no edit)
  const autoFilledProfile = useRef(false);
  useEffect(() => {
    if (editCvId) return;
    if (localStorage.getItem(DRAFT_KEY)) return;
    if (autoFilledProfile.current) return;
    if (profileLoading) return;
    autoFilledProfile.current = true;
    setData(d => ({
      ...d,
      name: profile.name || d.name,
      contact: {
        ...d.contact,
        location: profile.location || d.contact.location,
        phone: profile.phone || d.contact.phone,
        email: profile.email || user?.email || d.contact.email,
        links: profile.links.length > 0
          ? profile.links.map(l => ({ label: l.label, url: l.url }))
          : d.contact.links,
      },
    }));
  }, [profile, profileLoading, user, editCvId, DRAFT_KEY]);

  const set = (patch: Partial<CVData>) => setData(d => ({ ...d, ...patch }));

  const technologiesDrag = useDragReorder((from, to) => set({ technologies: moveAt(data.technologies, from, to) }));
  const projectsDrag = useDragReorder((from, to) => set({ projects: moveAt(data.projects, from, to) }));
  const experienceDrag = useDragReorder((from, to) => set({ experience: moveAt(data.experience, from, to) }));
  const educationDrag = useDragReorder((from, to) => set({ education: moveAt(data.education, from, to) }));
  const certificatesDrag = useDragReorder((from, to) => set({ certificates: moveAt(data.certificates ?? [], from, to) }));

  /** Save draft to localStorage — no PDF, no Supabase */
  const handleDraftSave = () => {
    if (editCvId) {
      // For existing CV: persist editor data + sync name change to AppContext
      saveCVDataById(editCvId, data);
      if (editingCv && cvName.trim() && cvName !== editingCv.name) {
        dispatch({ type: 'UPDATE_CV', payload: { ...editingCv, name: cvName } });
      }
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
      setTimeout(() => setSaved(false), 2000); // stay in editor
    } else {
      const newId = uid();
      saveCVDataById(newId, data);
      dispatch({ type: 'ADD_CV', payload: { id: newId, name: cvName, isDefault: state.cvs.length === 0, fileName } });
      localStorage.removeItem(DRAFT_KEY);
      setSaved(true);
      setIsSaving(false);
      // Navigate to edit mode so user can continue editing the newly created CV
      setTimeout(() => { setSaved(false); navigate(`/cv-editor?edit=${newId}`); }, 800);
    }
  };

  const handlePreview = () => setShowPreview(v => !v);

  return (
    <div className={showPreview ? 'pb-20' : 'space-y-2 pb-28'}>
      {!showPreview && (
      <PageHeader
        icon={FileEdit}
        title={editCvId ? 'Edytuj CV' : 'Nowe CV'}
        actions={
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
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
        <div className="space-y-2">
          <TextArea value={data.profile} onChange={v => set({ profile: v })} rows={5} placeholder="Krótki opis..." />
          <ProfileImportMenu
            items={descriptions}
            labelFn={d => d.name}
            onImport={items => set({ profile: items.map(d => d.content).join('\n\n') })}
          />
        </div>
      )}

      {/* ── Technologie ──────────────────────────────────────────────── */}
      <SectionHeading
        title={data.technologiesTitle || 'Technologie i narzędzia'}
        onRename={v => set({ technologiesTitle: v })}
        enabled={data.showTechnologies !== false}
        onToggleEnabled={() => set({ showTechnologies: !data.showTechnologies })}
        collapsed={collapsed['tech']}
        onToggleCollapse={() => toggle('tech')}
      />
      {!collapsed['tech'] && (
        <>
          {data.technologies.map((tech, ti) => (
            <CollapsibleItem
              key={ti}
              label={tech.category}
              onRemove={() => set({ technologies: removeAt(data.technologies, ti) })}
              {...technologiesDrag.getItemProps(ti)}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <FieldLabel>Kategoria</FieldLabel>
                  <TextInput
                    value={tech.category}
                    onChange={v => set({ technologies: updateAt(data.technologies, ti, { ...tech, category: v }) })}
                    placeholder="Frontend"
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Pozycje</FieldLabel>
                  <TextInput
                    value={tech.items}
                    onChange={v => set({ technologies: updateAt(data.technologies, ti, { ...tech, items: v }) })}
                    placeholder="React, TypeScript, Tailwind…"
                  />
                </div>
              </div>
            </CollapsibleItem>
          ))}
          <ProfileImportMenu
            items={techCategories}
            labelFn={t => `${t.category}: ${t.items.slice(0, 40)}`}
            onImport={items => set({ technologies: [...data.technologies, ...items.map(t => ({ category: t.category, items: t.items }))] })}
            primaryLabel="Dodaj kategorię"
          />
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
            <CollapsibleItem
              key={pi}
              label={proj.name}
              onRemove={() => set({ projects: removeAt(data.projects, pi) })}
              {...projectsDrag.getItemProps(pi)}
            >
              <div className="space-y-3">
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
                  <LinksEditor links={proj.links} onChange={links => set({ projects: updateAt(data.projects, pi, { ...proj, links }) })} />
                </div>
              </div>
            </CollapsibleItem>
          ))}
          <ProfileImportMenu
            items={profileProjects}
            labelFn={p => p.name || '(bez nazwy)'}
            onImport={items => set({ projects: [...data.projects, ...items.map(p => ({ name: p.name, tagline: p.tagline, description: p.description, stack: p.stack, note: p.note, links: p.links.map(l => ({ label: l.label, url: l.url })) }))] })}
            primaryLabel="Dodaj projekt"
          />
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
            <CollapsibleItem
              key={ei}
              label={exp.company}
              onRemove={() => set({ experience: removeAt(data.experience, ei) })}
              {...experienceDrag.getItemProps(ei)}
            >
              <div className="space-y-3">
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
                        className="w-24 px-2 py-1.5 bg-dark-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0"
                      />
                      <input
                        value={exp.companyLink?.url ?? ''}
                        onChange={e => {
                          const url = e.target.value;
                          const label = exp.companyLink?.label ?? '';
                          set({ experience: updateAt(data.experience, ei, { ...exp, companyLink: label || url ? { label, url } : undefined }) });
                        }}
                        placeholder="https://…"
                        className="flex-1 px-2 py-1.5 bg-dark-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0"
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
                    <div className="pr-6 mb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <FieldLabel>Stanowisko</FieldLabel>
                        <TextInput
                          value={role.title}
                          onChange={v => set({ experience: updateAt(data.experience, ei, { ...exp, roles: updateAt(exp.roles, ri, { ...role, title: v }) }) })}
                          placeholder="Senior Developer"
                        />
                      </div>
                      <div>
                        <FieldLabel>Lata</FieldLabel>
                        <YearRangePicker
                          value={role.years}
                          onChange={v => set({ experience: updateAt(data.experience, ei, { ...exp, roles: updateAt(exp.roles, ri, { ...role, years: v }) }) })}
                        />
                      </div>
                    </div>
                    <FieldLabel>Punkty</FieldLabel>
                    <BulletsEditor
                      bullets={role.bullets}
                      onChange={bullets => set({ experience: updateAt(data.experience, ei, { ...exp, roles: updateAt(exp.roles, ri, { ...role, bullets }) }) })}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => set({ experience: updateAt(data.experience, ei, { ...exp, roles: [...exp.roles, { title: '', years: '', bullets: [] }] }) })}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj stanowisko
                </Button>
              </div>
            </CollapsibleItem>
          ))}
          <ProfileImportMenu
            items={experiences}
            labelFn={e => e.company}
            onImport={items => set({ experience: [...data.experience, ...items.map(e => ({ company: e.company, companyLink: e.company_link, roles: e.roles.map(r => ({ title: r.title, years: r.years ?? '', bullets: r.bullets })) }))] })}
            primaryLabel="Dodaj firmę"
          />
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
            <CollapsibleItem
              key={edi}
              label={edu.school}
              onRemove={() => set({ education: removeAt(data.education, edi) })}
              {...educationDrag.getItemProps(edi)}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
                  <YearRangePicker value={edu.years} onChange={v => set({ education: updateAt(data.education, edi, { ...edu, years: v }) })} />
                </div>
              </div>
            </CollapsibleItem>
          ))}
          <ProfileImportMenu
            items={profileEducation}
            labelFn={e => `${e.school}${e.degree ? ' \u2013 ' + e.degree : ''}`}
            onImport={items => set({ education: [...data.education, ...items.map(e => ({ school: e.school, degree: e.degree, years: e.years }))] })}
            primaryLabel="Dodaj wykształcenie"
          />
        </>
      )}

      {/* ── Certyfikaty ───────────────────────────────────────────────── */}
      <SectionHeading
        title={data.certificatesTitle || 'Certyfikaty'}
        onRename={v => set({ certificatesTitle: v })}
        enabled={data.showCertificates !== false}
        onToggleEnabled={() => set({ showCertificates: !data.showCertificates })}
        collapsed={collapsed['certificates']}
        onToggleCollapse={() => toggle('certificates')}
      />
      {!collapsed['certificates'] && (
        <>
          {(data.certificates ?? []).map((cert, ci) => (
            <CollapsibleItem
              key={ci}
              label={cert.name}
              onRemove={() => set({ certificates: removeAt(data.certificates ?? [], ci) })}
              {...certificatesDrag.getItemProps(ci)}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="md:col-span-2">
                  <FieldLabel>Nazwa certyfikatu</FieldLabel>
                  <TextInput
                    value={cert.name}
                    onChange={v => set({ certificates: updateAt(data.certificates ?? [], ci, { ...cert, name: v }) })}
                    placeholder="AWS Certified Developer"
                  />
                </div>
                <div>
                  <FieldLabel>Rok</FieldLabel>
                  <TextInput
                    value={cert.year}
                    onChange={v => set({ certificates: updateAt(data.certificates ?? [], ci, { ...cert, year: v }) })}
                    placeholder="2024"
                  />
                </div>
                <div className="md:col-span-3">
                  <FieldLabel>Wystawca</FieldLabel>
                  <TextInput
                    value={cert.issuer}
                    onChange={v => set({ certificates: updateAt(data.certificates ?? [], ci, { ...cert, issuer: v }) })}
                    placeholder="Amazon Web Services"
                  />
                </div>
              </div>
            </CollapsibleItem>
          ))}
          <ProfileImportMenu
            items={profileCertificates}
            labelFn={c => `${c.name}${c.issuer ? ' – ' + c.issuer : ''}${c.year ? ' (' + c.year + ')' : ''}`}
            onImport={items => set({
              certificates: [...(data.certificates ?? []), ...items.map(c => ({ name: c.name, issuer: c.issuer, year: c.year, url: c.file_url }))],
              showCertificates: true,
            })}
            primaryLabel="Dodaj certyfikat"
          />
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
          <p className="text-xs text-slate-500 -mt-2 mb-3">Dowolne sekcje z własnym nagłówkiem — np. Języki, Wolontariat, Osiągnięcia.</p>
          {(data.customSections ?? []).map((sec, si) => (
            <ItemCard key={sec.id} onRemove={() => set({ customSections: removeAt(data.customSections ?? [], si) })}>
              <div className="space-y-2 pr-6">
                <div>
                  <FieldLabel>Nagłówek sekcji</FieldLabel>
                  <TextInput
                    value={sec.title}
                    onChange={v => set({ customSections: updateAt(data.customSections ?? [], si, { ...sec, title: v }) })}
                    placeholder="np. Języki"
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
          <Button variant="primary" onClick={() => set({ customSections: [...(data.customSections ?? []), { id: uid(), title: '', content: '' }] })}>
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
        <TagListEditor
          items={data.interests}
          onChange={v => set({ interests: v })}
          addLabel="Dodaj zainteresowanie"
          placeholder="np. Muzyka"
        />
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
        {/* Podgląd */}
        <button
          onClick={handlePreview}
          className="flex items-center gap-1.5 px-3 py-2 bg-dark-700 hover:bg-dark-600 text-slate-300 text-sm transition-colors cursor-pointer"
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="hidden sm:inline">{showPreview ? 'Zamknij' : 'Podgląd'}</span>
        </button>
        {/* Zapisz szkic */}
        <button
          onClick={handleDraftSave}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors cursor-pointer ${
            draftSaved ? 'bg-success-500/20 text-success-400' : 'bg-dark-700 hover:bg-dark-600 text-slate-300'
          }`}
          title="Zapisz szkic lokalnie"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">{draftSaved ? 'Zapisano' : 'Zapisz'}</span>
        </button>
        {/* Dodaj / zapisz do bazy CV */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 ${
            saved ? 'bg-success-500/20 text-success-400' : 'bg-primary-500 hover:bg-primary-400 text-slate-900'
          }`}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span className="hidden sm:inline">
            {isSaving ? 'Zapisuję…' : saved ? 'Zapisano!' : editCvId ? 'Zapisz zmiany' : 'Dodaj do Bazy CV'}
          </span>
        </button>
      </div>
    </div>
  );
}
