import { useState, useCallback } from 'react';
import {
  User,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '../components/ui';
import { useProfile } from '../hooks/useProfile';
import type {
  CandidateProfile,
  ProfileDescription,
  ProfileExperience,
  ProfileProject,
  ProfileTechCategory,
  ProfileEducation,
  ProfileLink,
} from '../types/profile';

// ── Helpers ────────────────────────────────────────────────────────────────────

function updateAt<T>(arr: T[], i: number, val: T): T[] {
  return arr.map((x, idx) => (idx === i ? val : x));
}
function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

// ── Small UI building blocks ───────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-slate-400 mb-1 font-light">{children}</label>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  className = '',
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full px-3 py-1.5 bg-dark-700 text-slate-100 text-sm font-light placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${className}`}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  onBlur?: () => void;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 bg-dark-700 text-slate-100 text-sm font-light placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-y"
    />
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

/** Links editor for ProfileLink[] */
function LinksEditor({
  links,
  onChange,
}: {
  links: ProfileLink[];
  onChange: (links: ProfileLink[]) => void;
}) {
  return (
    <div>
      {links.map((link, i) => (
        <div key={i} className="flex gap-2 items-center mb-2">
          <input
            value={link.label}
            onChange={e => onChange(updateAt(links, i, { ...link, label: e.target.value }))}
            placeholder="Etykieta"
            className="w-28 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm font-light placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0"
          />
          <input
            value={link.url}
            onChange={e => onChange(updateAt(links, i, { ...link, url: e.target.value }))}
            placeholder="https://..."
            className="flex-1 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm font-light placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0"
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
        onClick={() => onChange([...links, { label: '', url: '' }])}
        className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer mt-1"
      >
        <Plus className="w-3.5 h-3.5" /> Dodaj link
      </button>
    </div>
  );
}

function BulletsEditor({
  bullets,
  onChange,
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
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
            className="flex-1 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm font-light placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-y min-w-0"
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

/** Collapsible section heading */
function SectionHeading({
  id,
  title,
  collapsed,
  onToggle,
}: {
  id: string;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div id={id} className="border-b border-primary-500/40 pb-1.5 mb-4 mt-8 flex items-center gap-2">
      <h2 className="text-xs font-medium text-primary-400 uppercase tracking-widest">{title}</h2>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onToggle}
        className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex-shrink-0"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

/** Save button with feedback state */
function SaveButton({
  onClick,
  saving,
  saved,
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60 ${
        saved
          ? 'bg-success-500/20 text-success-400'
          : 'bg-primary-500 hover:bg-primary-400 text-slate-900'
      }`}
    >
      {saving ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : saved ? (
        <Check className="w-3 h-3" />
      ) : null}
      {saving ? 'Zapisuję...' : saved ? 'Zapisano' : 'Zapisz sekcję'}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProfilePage() {
  const {
    profile,
    descriptions,
    experiences,
    projects,
    techCategories,
    education,
    isLoading,
    updateProfile,
    addDescription,
    updateDescription,
    removeDescription,
    addExperience,
    updateExperience,
    removeExperience,
    addProject,
    updateProject,
    removeProject,
    addTechCategory,
    updateTechCategory,
    removeTechCategory,
    addEducation,
    updateEducation,
    removeEducation,
  } = useProfile();

  // Collapse state per section
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  // Local draft state for sections that save explicitly
  const [contactDraft, setContactDraft] = useState<CandidateProfile | null>(null);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  const [interestsDraft, setInterestsDraft] = useState<{ interests: string; rodo: string } | null>(null);
  const [interestsSaving, setInterestsSaving] = useState(false);
  const [interestsSaved, setInterestsSaved] = useState(false);

  // Use profile from hook as base, merged with any local drafts
  const contact: CandidateProfile = contactDraft ?? profile;
  const interestsRodo = interestsDraft ?? { interests: profile.interests, rodo: profile.rodo };

  // Sync drafts when profile loads
  const profileLoaded = !isLoading;
  const [synced, setSynced] = useState(false);
  if (profileLoaded && !synced) {
    setSynced(true);
    setContactDraft(profile);
    setInterestsDraft({ interests: profile.interests, rodo: profile.rodo });
  }

  // Per-description, per-experience, per-project, per-tech, per-edu saving state
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  const markSaving = (id: string) => setSavingMap(m => ({ ...m, [id]: true }));
  const markSaved = (id: string) => {
    setSavingMap(m => ({ ...m, [id]: false }));
    setSavedMap(m => ({ ...m, [id]: true }));
    setTimeout(() => setSavedMap(m => ({ ...m, [id]: false })), 2000);
  };

  // ── Save handlers ────────────────────────────────────────────────────────────

  const handleSaveContact = useCallback(async () => {
    if (!contactDraft) return;
    setContactSaving(true);
    try {
      await updateProfile(contactDraft);
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2000);
    } finally {
      setContactSaving(false);
    }
  }, [contactDraft, updateProfile]);

  const handleSaveInterests = useCallback(async () => {
    if (!interestsDraft || !contactDraft) return;
    setInterestsSaving(true);
    try {
      await updateProfile({ ...contactDraft, ...interestsDraft });
      setInterestsSaved(true);
      setTimeout(() => setInterestsSaved(false), 2000);
    } finally {
      setInterestsSaving(false);
    }
  }, [interestsDraft, contactDraft, updateProfile]);

  const handleSaveDescription = useCallback(async (desc: ProfileDescription) => {
    markSaving(desc.id);
    try {
      await updateDescription(desc.id, desc);
      markSaved(desc.id);
    } catch (e) {
      setSavingMap(m => ({ ...m, [desc.id]: false }));
      console.error(e);
    }
  }, [updateDescription]);

  const handleSaveExperience = useCallback(async (exp: ProfileExperience) => {
    markSaving(exp.id);
    try {
      await updateExperience(exp.id, exp);
      markSaved(exp.id);
    } catch (e) {
      setSavingMap(m => ({ ...m, [exp.id]: false }));
      console.error(e);
    }
  }, [updateExperience]);

  const handleSaveProject = useCallback(async (proj: ProfileProject) => {
    markSaving(proj.id);
    try {
      await updateProject(proj.id, proj);
      markSaved(proj.id);
    } catch (e) {
      setSavingMap(m => ({ ...m, [proj.id]: false }));
      console.error(e);
    }
  }, [updateProject]);

  const handleSaveTech = useCallback(async (tech: ProfileTechCategory) => {
    markSaving(tech.id);
    try {
      await updateTechCategory(tech.id, tech);
      markSaved(tech.id);
    } catch (e) {
      setSavingMap(m => ({ ...m, [tech.id]: false }));
      console.error(e);
    }
  }, [updateTechCategory]);

  const handleSaveEducation = useCallback(async (edu: ProfileEducation) => {
    markSaving(edu.id);
    try {
      await updateEducation(edu.id, edu);
      markSaved(edu.id);
    } catch (e) {
      setSavingMap(m => ({ ...m, [edu.id]: false }));
      console.error(e);
    }
  }, [updateEducation]);

  // ── Local state for list items (optimistic UI) ───────────────────────────────

  const [localDescriptions, setLocalDescriptions] = useState<ProfileDescription[] | null>(null);
  const [localExperiences, setLocalExperiences] = useState<ProfileExperience[] | null>(null);
  const [localProjects, setLocalProjects] = useState<ProfileProject[] | null>(null);
  const [localTech, setLocalTech] = useState<ProfileTechCategory[] | null>(null);
  const [localEducation, setLocalEducation] = useState<ProfileEducation[] | null>(null);

  // Sync from hook when data first arrives
  if (profileLoaded && localDescriptions === null && descriptions.length >= 0) {
    setLocalDescriptions(descriptions);
  }
  if (profileLoaded && localExperiences === null && experiences.length >= 0) {
    setLocalExperiences(experiences);
  }
  if (profileLoaded && localProjects === null && projects.length >= 0) {
    setLocalProjects(projects);
  }
  if (profileLoaded && localTech === null && techCategories.length >= 0) {
    setLocalTech(techCategories);
  }
  if (profileLoaded && localEducation === null && education.length >= 0) {
    setLocalEducation(education);
  }

  const descs = localDescriptions ?? descriptions;
  const exps = localExperiences ?? experiences;
  const projs = localProjects ?? projects;
  const tech = localTech ?? techCategories;
  const edu = localEducation ?? education;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
        <span className="ml-3 text-slate-400 font-light">Ładowanie profilu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-20">
      <PageHeader
        icon={User}
        title="Profil kandydata"
        description="Twoje dane źródłowe do generowania CV."
      />

      {/* ── Kontakt ─────────────────────────────────────────────────────────── */}
      <SectionHeading
        id="kontakt"
        title="Kontakt"
        collapsed={!!collapsed['kontakt']}
        onToggle={() => toggle('kontakt')}
      />
      {!collapsed['kontakt'] && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <FieldLabel>Lokalizacja</FieldLabel>
              <TextInput
                value={contact.location}
                onChange={v => setContactDraft(d => ({ ...(d ?? contact), location: v }))}
                placeholder="Miasto"
              />
            </div>
            <div>
              <FieldLabel>Telefon</FieldLabel>
              <TextInput
                value={contact.phone}
                onChange={v => setContactDraft(d => ({ ...(d ?? contact), phone: v }))}
                placeholder="000 000 000"
              />
            </div>
            <div>
              <FieldLabel>E-mail</FieldLabel>
              <TextInput
                value={contact.email}
                onChange={v => setContactDraft(d => ({ ...(d ?? contact), email: v }))}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div>
            <FieldLabel>Linki (LinkedIn, GitHub, Portfolio…)</FieldLabel>
            <LinksEditor
              links={contact.links}
              onChange={links => setContactDraft(d => ({ ...(d ?? contact), links }))}
            />
          </div>
          <div className="flex justify-end">
            <SaveButton
              onClick={handleSaveContact}
              saving={contactSaving}
              saved={contactSaved}
            />
          </div>
        </div>
      )}

      {/* ── Opisy profilu ───────────────────────────────────────────────────── */}
      <SectionHeading
        id="opisy"
        title="Opisy profilu"
        collapsed={!!collapsed['opisy']}
        onToggle={() => toggle('opisy')}
      />
      {!collapsed['opisy'] && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-light -mt-2">
            Nazwane opisy do różnych pozycji — np. "Frontend Dev", "AI Dev". Wybierane przy generowaniu CV.
          </p>
          {descs.map(desc => (
            <ItemCard
              key={desc.id}
              onRemove={async () => {
                setLocalDescriptions(prev => (prev ?? descs).filter(d => d.id !== desc.id));
                await removeDescription(desc.id);
              }}
            >
              <div className="space-y-2 pr-6">
                <div>
                  <FieldLabel>Nazwa opisu</FieldLabel>
                  <TextInput
                    value={desc.name}
                    onChange={v => setLocalDescriptions(prev =>
                      (prev ?? descs).map(d => d.id === desc.id ? { ...d, name: v } : d)
                    )}
                    placeholder="np. Frontend Dev"
                  />
                </div>
                <div>
                  <FieldLabel>Treść</FieldLabel>
                  <TextArea
                    value={desc.content}
                    onChange={v => setLocalDescriptions(prev =>
                      (prev ?? descs).map(d => d.id === desc.id ? { ...d, content: v } : d)
                    )}
                    rows={4}
                    placeholder="Opis profilu kandydata..."
                  />
                </div>
                <div className="flex justify-end">
                  <SaveButton
                    onClick={() => handleSaveDescription(descs.find(d => d.id === desc.id) ?? desc)}
                    saving={!!savingMap[desc.id]}
                    saved={!!savedMap[desc.id]}
                  />
                </div>
              </div>
            </ItemCard>
          ))}
          <button
            type="button"
            onClick={async () => {
              await addDescription({ name: '', content: '' });
              setLocalDescriptions(null); // re-sync from hook
            }}
            className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Dodaj opis
          </button>
        </div>
      )}

      {/* ── Doświadczenie zawodowe ───────────────────────────────────────────── */}
      <SectionHeading
        id="doswiadczenie"
        title="Doświadczenie zawodowe"
        collapsed={!!collapsed['doswiadczenie']}
        onToggle={() => toggle('doswiadczenie')}
      />
      {!collapsed['doswiadczenie'] && (
        <div className="space-y-3">
          {exps.map(exp => (
            <ItemCard
              key={exp.id}
              onRemove={async () => {
                setLocalExperiences(prev => (prev ?? exps).filter(e => e.id !== exp.id));
                await removeExperience(exp.id);
              }}
            >
              <div className="space-y-3 pr-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Firma</FieldLabel>
                    <TextInput
                      value={exp.company}
                      onChange={v => setLocalExperiences(prev =>
                        (prev ?? exps).map(e => e.id === exp.id ? { ...e, company: v } : e)
                      )}
                      placeholder="NAZWA FIRMY"
                    />
                  </div>
                  <div>
                    <FieldLabel>Link firmy (opcjonalny)</FieldLabel>
                    <div className="flex gap-2">
                      <input
                        value={exp.company_link?.label ?? ''}
                        onChange={e => {
                          const label = e.target.value;
                          const url = exp.company_link?.url ?? '';
                          setLocalExperiences(prev =>
                            (prev ?? exps).map(ex => ex.id === exp.id
                              ? { ...ex, company_link: label || url ? { label, url } : undefined }
                              : ex
                            )
                          );
                        }}
                        placeholder="Etykieta"
                        className="w-24 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm font-light placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0"
                      />
                      <input
                        value={exp.company_link?.url ?? ''}
                        onChange={e => {
                          const url = e.target.value;
                          const label = exp.company_link?.label ?? '';
                          setLocalExperiences(prev =>
                            (prev ?? exps).map(ex => ex.id === exp.id
                              ? { ...ex, company_link: label || url ? { label, url } : undefined }
                              : ex
                            )
                          );
                        }}
                        placeholder="https://…"
                        className="flex-1 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm font-light placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0"
                      />
                    </div>
                  </div>
                </div>

                {exp.roles.map((role, ri) => (
                  <div key={ri} className="bg-dark-700/60 p-3 relative">
                    <button
                      type="button"
                      onClick={() => setLocalExperiences(prev =>
                        (prev ?? exps).map(ex => ex.id === exp.id
                          ? { ...ex, roles: removeAt(ex.roles, ri) }
                          : ex
                        )
                      )}
                      className="absolute top-2 right-2 p-1 text-slate-600 hover:text-danger-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="pr-6 mb-3">
                      <FieldLabel>Stanowisko | lata</FieldLabel>
                      <TextInput
                        value={role.title}
                        onChange={v => setLocalExperiences(prev =>
                          (prev ?? exps).map(ex => ex.id === exp.id
                            ? { ...ex, roles: updateAt(ex.roles, ri, { ...role, title: v }) }
                            : ex
                          )
                        )}
                        placeholder="Senior Developer | 2023 – obecnie"
                      />
                    </div>
                    <FieldLabel>Punkty</FieldLabel>
                    <BulletsEditor
                      bullets={role.bullets}
                      onChange={bullets => setLocalExperiences(prev =>
                        (prev ?? exps).map(ex => ex.id === exp.id
                          ? { ...ex, roles: updateAt(ex.roles, ri, { ...role, bullets }) }
                          : ex
                        )
                      )}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setLocalExperiences(prev =>
                    (prev ?? exps).map(ex => ex.id === exp.id
                      ? { ...ex, roles: [...ex.roles, { title: '', bullets: [] }] }
                      : ex
                    )
                  )}
                  className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Dodaj stanowisko
                </button>

                <div className="flex justify-end">
                  <SaveButton
                    onClick={() => handleSaveExperience(exps.find(e => e.id === exp.id) ?? exp)}
                    saving={!!savingMap[exp.id]}
                    saved={!!savedMap[exp.id]}
                  />
                </div>
              </div>
            </ItemCard>
          ))}
          <button
            type="button"
            onClick={async () => {
              await addExperience({ company: '', roles: [{ title: '', bullets: [] }] });
              setLocalExperiences(null);
            }}
            className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Dodaj firmę
          </button>
        </div>
      )}

      {/* ── Projekty ────────────────────────────────────────────────────────── */}
      <SectionHeading
        id="projekty"
        title="Projekty"
        collapsed={!!collapsed['projekty']}
        onToggle={() => toggle('projekty')}
      />
      {!collapsed['projekty'] && (
        <div className="space-y-3">
          {projs.map(proj => (
            <ItemCard
              key={proj.id}
              onRemove={async () => {
                setLocalProjects(prev => (prev ?? projs).filter(p => p.id !== proj.id));
                await removeProject(proj.id);
              }}
            >
              <div className="space-y-3 pr-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Nazwa projektu</FieldLabel>
                    <TextInput
                      value={proj.name}
                      onChange={v => setLocalProjects(prev =>
                        (prev ?? projs).map(p => p.id === proj.id ? { ...p, name: v } : p)
                      )}
                      placeholder="NAZWA PROJEKTU"
                    />
                  </div>
                  <div>
                    <FieldLabel>Tagline</FieldLabel>
                    <TextInput
                      value={proj.tagline}
                      onChange={v => setLocalProjects(prev =>
                        (prev ?? projs).map(p => p.id === proj.id ? { ...p, tagline: v } : p)
                      )}
                      placeholder="Jedno zdanie..."
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Opis</FieldLabel>
                  <TextArea
                    value={proj.description}
                    onChange={v => setLocalProjects(prev =>
                      (prev ?? projs).map(p => p.id === proj.id ? { ...p, description: v } : p)
                    )}
                    rows={3}
                  />
                </div>
                <div>
                  <FieldLabel>Stack</FieldLabel>
                  <TextInput
                    value={proj.stack}
                    onChange={v => setLocalProjects(prev =>
                      (prev ?? projs).map(p => p.id === proj.id ? { ...p, stack: v } : p)
                    )}
                    placeholder="React, TypeScript, Tailwind…"
                  />
                </div>
                <div>
                  <FieldLabel>Notatka (opcjonalna)</FieldLabel>
                  <TextInput
                    value={proj.note ?? ''}
                    onChange={v => setLocalProjects(prev =>
                      (prev ?? projs).map(p => p.id === proj.id ? { ...p, note: v || undefined } : p)
                    )}
                    placeholder="np. Zbudowany z AI"
                  />
                </div>
                <div>
                  <FieldLabel>Linki</FieldLabel>
                  <LinksEditor
                    links={proj.links}
                    onChange={links => setLocalProjects(prev =>
                      (prev ?? projs).map(p => p.id === proj.id ? { ...p, links } : p)
                    )}
                  />
                </div>
                <div className="flex justify-end">
                  <SaveButton
                    onClick={() => handleSaveProject(projs.find(p => p.id === proj.id) ?? proj)}
                    saving={!!savingMap[proj.id]}
                    saved={!!savedMap[proj.id]}
                  />
                </div>
              </div>
            </ItemCard>
          ))}
          <button
            type="button"
            onClick={async () => {
              await addProject({ name: '' });
              setLocalProjects(null);
            }}
            className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Dodaj projekt
          </button>
        </div>
      )}

      {/* ── Technologie i narzędzia ─────────────────────────────────────────── */}
      <SectionHeading
        id="technologie"
        title="Technologie i narzędzia"
        collapsed={!!collapsed['technologie']}
        onToggle={() => toggle('technologie')}
      />
      {!collapsed['technologie'] && (
        <div className="space-y-3">
          {tech.map(t => (
            <ItemCard
              key={t.id}
              onRemove={async () => {
                setLocalTech(prev => (prev ?? tech).filter(x => x.id !== t.id));
                await removeTechCategory(t.id);
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pr-6">
                <div>
                  <FieldLabel>Kategoria</FieldLabel>
                  <TextInput
                    value={t.category}
                    onChange={v => setLocalTech(prev =>
                      (prev ?? tech).map(x => x.id === t.id ? { ...x, category: v } : x)
                    )}
                    placeholder="Frontend:"
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Technologie</FieldLabel>
                  <TextInput
                    value={t.items}
                    onChange={v => setLocalTech(prev =>
                      (prev ?? tech).map(x => x.id === t.id ? { ...x, items: v } : x)
                    )}
                    placeholder="React, TypeScript, Tailwind…"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <SaveButton
                  onClick={() => handleSaveTech(tech.find(x => x.id === t.id) ?? t)}
                  saving={!!savingMap[t.id]}
                  saved={!!savedMap[t.id]}
                />
              </div>
            </ItemCard>
          ))}
          <button
            type="button"
            onClick={async () => {
              await addTechCategory({ category: '', items: '' });
              setLocalTech(null);
            }}
            className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Dodaj kategorię
          </button>
        </div>
      )}

      {/* ── Wykształcenie ───────────────────────────────────────────────────── */}
      <SectionHeading
        id="wyksztalcenie"
        title="Wykształcenie"
        collapsed={!!collapsed['wyksztalcenie']}
        onToggle={() => toggle('wyksztalcenie')}
      />
      {!collapsed['wyksztalcenie'] && (
        <div className="space-y-3">
          {edu.map(e => (
            <ItemCard
              key={e.id}
              onRemove={async () => {
                setLocalEducation(prev => (prev ?? edu).filter(x => x.id !== e.id));
                await removeEducation(e.id);
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pr-6">
                <div>
                  <FieldLabel>Szkoła / uczelnia</FieldLabel>
                  <TextInput
                    value={e.school}
                    onChange={v => setLocalEducation(prev =>
                      (prev ?? edu).map(x => x.id === e.id ? { ...x, school: v } : x)
                    )}
                    placeholder="UCZELNIA"
                  />
                </div>
                <div>
                  <FieldLabel>Kierunek</FieldLabel>
                  <TextInput
                    value={e.degree}
                    onChange={v => setLocalEducation(prev =>
                      (prev ?? edu).map(x => x.id === e.id ? { ...x, degree: v } : x)
                    )}
                    placeholder="Informatyka"
                  />
                </div>
                <div>
                  <FieldLabel>Lata</FieldLabel>
                  <TextInput
                    value={e.years}
                    onChange={v => setLocalEducation(prev =>
                      (prev ?? edu).map(x => x.id === e.id ? { ...x, years: v } : x)
                    )}
                    placeholder="2019 – 2023"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <SaveButton
                  onClick={() => handleSaveEducation(edu.find(x => x.id === e.id) ?? e)}
                  saving={!!savingMap[e.id]}
                  saved={!!savedMap[e.id]}
                />
              </div>
            </ItemCard>
          ))}
          <button
            type="button"
            onClick={async () => {
              await addEducation({ school: '', degree: '', years: '' });
              setLocalEducation(null);
            }}
            className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Dodaj wykształcenie
          </button>
        </div>
      )}

      {/* ── Zainteresowania + RODO ──────────────────────────────────────────── */}
      <SectionHeading
        id="zainteresowania"
        title="Zainteresowania + RODO"
        collapsed={!!collapsed['zainteresowania']}
        onToggle={() => toggle('zainteresowania')}
      />
      {!collapsed['zainteresowania'] && (
        <div className="space-y-4">
          <div>
            <FieldLabel>Zainteresowania</FieldLabel>
            <TextInput
              value={interestsRodo.interests}
              onChange={v => setInterestsDraft(d => ({ ...(d ?? interestsRodo), interests: v }))}
              placeholder="Kawa • Muzyka • Sport…"
            />
          </div>
          <div>
            <FieldLabel>Klauzula RODO</FieldLabel>
            <TextArea
              value={interestsRodo.rodo}
              onChange={v => setInterestsDraft(d => ({ ...(d ?? interestsRodo), rodo: v }))}
              rows={2}
              placeholder="Wyrażam zgodę na przetwarzanie moich danych osobowych..."
            />
          </div>
          <div className="flex justify-end">
            <SaveButton
              onClick={handleSaveInterests}
              saving={interestsSaving}
              saved={interestsSaved}
            />
          </div>
        </div>
      )}
    </div>
  );
}
