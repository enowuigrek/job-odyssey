import { useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  User,
  Plus,
  Trash2,
  Check,
  Loader2,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { PageHeader, CollapsibleItem, Button } from '../components/ui';
import { FieldLabel, TextInput, TextArea, LinksEditor, BulletsEditor, YearRangePicker } from '../components/forms/FormPrimitives';
import { useProfile } from '../hooks/useProfile';
import { useUserLinks } from '../hooks/useUserLinks';
import { useDragReorder } from '../hooks/useDragReorder';
import { uploadCertificateFile } from '../lib/profileDb';
import { useAuth } from '../contexts/AuthContext';
import { updateAt, removeAt } from '../utils/array';
import type {
  CandidateProfile,
  ProfileDescription,
  ProfileExperience,
  ProfileProject,
  ProfileTechCategory,
  ProfileEducation,
  ProfileCertificate,
} from '../types/profile';

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Moves an item from `from` to `to`, reassigning sort_order among only the
 * items in between (keeping the existing set of sort_order values, just
 * handing them to whichever item now occupies that slot), with an
 * optimistic local update and persistence for each shifted item.
 */
async function reorderItems<T extends { id: string; sort_order: number }>(
  list: T[],
  from: number,
  to: number,
  setLocal: (updater: (prev: T[] | null) => T[]) => void,
  updateFn: (id: string, patch: Partial<T>) => Promise<void>
) {
  if (from === to) return;
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const slotOrders = list.slice(start, end + 1).map(item => item.sort_order);

  const reordered = [...list];
  const [moved] = reordered.splice(from, 1);
  reordered.splice(to, 0, moved);

  const updated = reordered.map((item, idx) =>
    idx >= start && idx <= end ? { ...item, sort_order: slotOrders[idx - start] } : item
  );

  setLocal(() => updated);
  await Promise.all(
    updated.slice(start, end + 1).map(item => updateFn(item.id, { sort_order: item.sort_order } as Partial<T>))
  );
}

// ── Small UI building blocks ───────────────────────────────────────────────────

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
      className={`fold-btn flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 ${
        saved
          ? 'bg-success-500/20 text-success-400'
          : 'bg-primary-500 hover:bg-primary-400 text-slate-900'
      }`}
    >
      {saving ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : saved ? (
        <Check className="w-3.5 h-3.5" />
      ) : null}
      {saving ? 'Zapisuję...' : saved ? 'Zapisano' : 'Zapisz sekcję'}
    </button>
  );
}

const SECTION_TITLES: Record<string, string> = {
  kontakt: 'Dane osobowe',
  opisy: 'Opisy profilu',
  doswiadczenie: 'Doświadczenie zawodowe',
  projekty: 'Projekty',
  technologie: 'Technologie i narzędzia',
  wyksztalcenie: 'Wykształcenie',
  certyfikaty: 'Certyfikaty',
  zainteresowania: 'Zainteresowania',
};

// ── Main component ─────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { section = 'kontakt' } = useParams<{ section: string }>();
  const { user } = useAuth();
  const { links: userLinks, addLink, updateLink } = useUserLinks();

  const {
    profile,
    descriptions,
    experiences,
    projects,
    techCategories,
    education,
    certificates,
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
    addCertificate,
    updateCertificate,
    removeCertificate,
  } = useProfile();

  // ── Contact / interests draft ────────────────────────────────────────────────
  const [contactDraft, setContactDraft] = useState<CandidateProfile | null>(null);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  const [interestsDraft, setInterestsDraft] = useState<{ interests: string; rodo: string } | null>(null);
  const [interestsSaving, setInterestsSaving] = useState(false);
  const [interestsSaved, setInterestsSaved] = useState(false);

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

  // ── Per-item saving state ────────────────────────────────────────────────────
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  const markSaving = (id: string) => setSavingMap(m => ({ ...m, [id]: true }));
  const markSaved = (id: string) => {
    setSavingMap(m => ({ ...m, [id]: false }));
    setSavedMap(m => ({ ...m, [id]: true }));
    setTimeout(() => setSavedMap(m => ({ ...m, [id]: false })), 2000);
  };

  // ── Local optimistic state for list sections ─────────────────────────────────
  const [localDescriptions, setLocalDescriptions] = useState<ProfileDescription[] | null>(null);
  const [localExperiences, setLocalExperiences] = useState<ProfileExperience[] | null>(null);
  const [localProjects, setLocalProjects] = useState<ProfileProject[] | null>(null);
  const [localTech, setLocalTech] = useState<ProfileTechCategory[] | null>(null);
  const [localEducation, setLocalEducation] = useState<ProfileEducation[] | null>(null);
  const [localCertificates, setLocalCertificates] = useState<ProfileCertificate[] | null>(null);
  const [uploadingCertId, setUploadingCertId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadCertId = useRef<string | null>(null);

  if (profileLoaded && localDescriptions === null && descriptions.length >= 0) setLocalDescriptions(descriptions);
  if (profileLoaded && localExperiences === null && experiences.length >= 0) setLocalExperiences(experiences);
  if (profileLoaded && localProjects === null && projects.length >= 0) setLocalProjects(projects);
  if (profileLoaded && localTech === null && techCategories.length >= 0) setLocalTech(techCategories);
  if (profileLoaded && localEducation === null && education.length >= 0) setLocalEducation(education);
  if (profileLoaded && localCertificates === null && certificates.length >= 0) setLocalCertificates(certificates);

  const descs = localDescriptions ?? descriptions;
  const exps = localExperiences ?? experiences;
  const projs = localProjects ?? projects;
  const tech = localTech ?? techCategories;
  const edu = localEducation ?? education;
  const certs = localCertificates ?? certificates;

  const descriptionsDrag = useDragReorder((from, to) => reorderItems(descs, from, to, setLocalDescriptions, updateDescription));
  const experiencesDrag = useDragReorder((from, to) => reorderItems(exps, from, to, setLocalExperiences, updateExperience));
  const projectsDrag = useDragReorder((from, to) => reorderItems(projs, from, to, setLocalProjects, updateProject));
  const techDrag = useDragReorder((from, to) => reorderItems(tech, from, to, setLocalTech, updateTechCategory));
  const educationDrag = useDragReorder((from, to) => reorderItems(edu, from, to, setLocalEducation, updateEducation));
  const certificatesDrag = useDragReorder((from, to) => reorderItems(certs, from, to, setLocalCertificates, updateCertificate));

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
    try { await updateDescription(desc.id, desc); markSaved(desc.id); }
    catch (e) { setSavingMap(m => ({ ...m, [desc.id]: false })); console.error(e); }
  }, [updateDescription]);

  const handleSaveExperience = useCallback(async (exp: ProfileExperience) => {
    markSaving(exp.id);
    try { await updateExperience(exp.id, exp); markSaved(exp.id); }
    catch (e) { setSavingMap(m => ({ ...m, [exp.id]: false })); console.error(e); }
  }, [updateExperience]);

  const handleSaveProject = useCallback(async (proj: ProfileProject) => {
    markSaving(proj.id);
    try { await updateProject(proj.id, proj); markSaved(proj.id); }
    catch (e) { setSavingMap(m => ({ ...m, [proj.id]: false })); console.error(e); }
  }, [updateProject]);

  const handleSaveTech = useCallback(async (t: ProfileTechCategory) => {
    markSaving(t.id);
    try { await updateTechCategory(t.id, t); markSaved(t.id); }
    catch (e) { setSavingMap(m => ({ ...m, [t.id]: false })); console.error(e); }
  }, [updateTechCategory]);

  const handleSaveEducation = useCallback(async (e: ProfileEducation) => {
    markSaving(e.id);
    try { await updateEducation(e.id, e); markSaved(e.id); }
    catch (e2) { setSavingMap(m => ({ ...m, [e.id]: false })); console.error(e2); }
  }, [updateEducation]);

  const syncCertificateToUserLinks = useCallback((cert: ProfileCertificate) => {
    if (!cert.file_url) return;
    const existing = userLinks.find(l => l.type === 'certificate' && l.url === cert.file_url);
    if (!existing) {
      addLink({ label: cert.name || 'Certyfikat', url: cert.file_url, type: 'certificate' });
    } else if (existing.label !== cert.name) {
      updateLink(existing.id, { label: cert.name });
    }
  }, [userLinks, addLink, updateLink]);

  const handleSaveCertificate = useCallback(async (cert: ProfileCertificate) => {
    markSaving(cert.id);
    try {
      await updateCertificate(cert.id, cert);
      syncCertificateToUserLinks(cert);
      markSaved(cert.id);
    }
    catch (e) { setSavingMap(m => ({ ...m, [cert.id]: false })); console.error(e); }
  }, [updateCertificate, syncCertificateToUserLinks]);

  const handleUploadFile = useCallback(async (certId: string, file: File) => {
    if (!user) return;
    setUploadingCertId(certId);
    try {
      const url = await uploadCertificateFile(user.id, certId, file);
      const cert = (localCertificates ?? certificates).find(c => c.id === certId);
      if (!cert) return;
      const updated = { ...cert, file_url: url };
      setLocalCertificates(prev => (prev ?? []).map(c => c.id === certId ? updated : c));
      await updateCertificate(certId, { file_url: url });
      syncCertificateToUserLinks(updated);
      markSaved(certId);
    }
    catch (e) { console.error(e); }
    finally { setUploadingCertId(null); }
  }, [user, localCertificates, certificates, updateCertificate, syncCertificateToUserLinks]);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
        <span className="ml-3 text-slate-400 font-light">Ładowanie profilu...</span>
      </div>
    );
  }

  const sectionTitle = SECTION_TITLES[section] ?? 'Profil kandydata';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        icon={User}
        title={sectionTitle}
        description="Profil kandydata"
      />

      {/* ── DANE OSOBOWE ─────────────────────────────────────────────────────── */}
      {section === 'kontakt' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <FieldLabel light>Imię i nazwisko</FieldLabel>
              <TextInput light
                value={contact.name}
                onChange={v => setContactDraft(d => ({ ...(d ?? contact), name: v }))}
                placeholder="Jan Kowalski"
              />
            </div>
            <div>
              <FieldLabel light>Lokalizacja</FieldLabel>
              <TextInput light
                value={contact.location}
                onChange={v => setContactDraft(d => ({ ...(d ?? contact), location: v }))}
                placeholder="Warszawa"
              />
            </div>
            <div>
              <FieldLabel light>Telefon</FieldLabel>
              <TextInput light
                value={contact.phone}
                onChange={v => setContactDraft(d => ({ ...(d ?? contact), phone: v }))}
                placeholder="000 000 000"
              />
            </div>
            <div>
              <FieldLabel light>E-mail</FieldLabel>
              <TextInput light
                value={contact.email}
                onChange={v => setContactDraft(d => ({ ...(d ?? contact), email: v }))}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div>
            <FieldLabel light>Linki (LinkedIn, GitHub, Portfolio…)</FieldLabel>
            <LinksEditor light
              links={contact.links}
              onChange={links => setContactDraft(d => ({ ...(d ?? contact), links }))}
            />
          </div>
          <div className="flex justify-end pt-2">
            <SaveButton onClick={handleSaveContact} saving={contactSaving} saved={contactSaved} />
          </div>
        </div>
      )}

      {/* ── OPISY PROFILU ────────────────────────────────────────────────────── */}
      {section === 'opisy' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-light">
            Nazwane opisy do różnych pozycji — np. "Frontend Dev", "AI Dev". Wybierane przy generowaniu CV.
          </p>
          {descs.map((desc, di) => (
            <CollapsibleItem
              key={desc.id}
              label={desc.name}
              labelPlaceholder="np. Frontend Dev"
              onLabelChange={v => setLocalDescriptions(prev =>
                (prev ?? descs).map(d => d.id === desc.id ? { ...d, name: v } : d)
              )}
              onRemove={async () => {
                setLocalDescriptions(prev => (prev ?? descs).filter(d => d.id !== desc.id));
                await removeDescription(desc.id);
              }}
              {...descriptionsDrag.getItemProps(di)}
            >
              <div className="space-y-2">
                <div>
                  <FieldLabel light>Treść</FieldLabel>
                  <TextArea light
                    value={desc.content}
                    onChange={v => setLocalDescriptions(prev =>
                      (prev ?? descs).map(d => d.id === desc.id ? { ...d, content: v } : d)
                    )}
                    rows={5}
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
            </CollapsibleItem>
          ))}
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await addDescription({ name: '', content: '' });
              setLocalDescriptions(null);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Dodaj opis
          </Button>
        </div>
      )}

      {/* ── DOŚWIADCZENIE ZAWODOWE ───────────────────────────────────────────── */}
      {section === 'doswiadczenie' && (
        <div className="space-y-3">
          {exps.map((exp, expi) => (
            <CollapsibleItem
              key={exp.id}
              label={exp.company}
              labelPlaceholder="NAZWA FIRMY"
              onLabelChange={v => setLocalExperiences(prev =>
                (prev ?? exps).map(e => e.id === exp.id ? { ...e, company: v } : e)
              )}
              onRemove={async () => {
                setLocalExperiences(prev => (prev ?? exps).filter(e => e.id !== exp.id));
                await removeExperience(exp.id);
              }}
              {...experiencesDrag.getItemProps(expi)}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <FieldLabel light>Link firmy (opcjonalny)</FieldLabel>
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
                        className="w-24 px-2 py-1.5 bg-dark-700 text-white text-sm font-light placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0"
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
                        className="flex-1 px-2 py-1.5 bg-dark-700 text-white text-sm font-light placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0"
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
                    <div className="pr-6 mb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <FieldLabel light>Stanowisko</FieldLabel>
                        <TextInput light
                          value={role.title}
                          onChange={v => setLocalExperiences(prev =>
                            (prev ?? exps).map(ex => ex.id === exp.id
                              ? { ...ex, roles: updateAt(ex.roles, ri, { ...role, title: v }) }
                              : ex
                            )
                          )}
                          placeholder="Senior Developer"
                        />
                      </div>
                      <div>
                        <FieldLabel light>Lata</FieldLabel>
                        <YearRangePicker light
                          value={role.years ?? ''}
                          onChange={v => setLocalExperiences(prev =>
                            (prev ?? exps).map(ex => ex.id === exp.id
                              ? { ...ex, roles: updateAt(ex.roles, ri, { ...role, years: v }) }
                              : ex
                            )
                          )}
                        />
                      </div>
                    </div>
                    <FieldLabel light>Punkty</FieldLabel>
                    <BulletsEditor light
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

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setLocalExperiences(prev =>
                    (prev ?? exps).map(ex => ex.id === exp.id
                      ? { ...ex, roles: [...ex.roles, { title: '', years: '', bullets: [] }] }
                      : ex
                    )
                  )}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Dodaj stanowisko
                </Button>

                <div className="flex justify-end">
                  <SaveButton
                    onClick={() => handleSaveExperience(exps.find(e => e.id === exp.id) ?? exp)}
                    saving={!!savingMap[exp.id]}
                    saved={!!savedMap[exp.id]}
                  />
                </div>
              </div>
            </CollapsibleItem>
          ))}
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await addExperience({ company: '', roles: [{ title: '', years: '', bullets: [] }] });
              setLocalExperiences(null);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Dodaj firmę
          </Button>
        </div>
      )}

      {/* ── PROJEKTY ────────────────────────────────────────────────────────── */}
      {section === 'projekty' && (
        <div className="space-y-3">
          {projs.map((proj, proji) => (
            <CollapsibleItem
              key={proj.id}
              label={proj.name}
              labelPlaceholder="NAZWA PROJEKTU"
              onLabelChange={v => setLocalProjects(prev =>
                (prev ?? projs).map(p => p.id === proj.id ? { ...p, name: v } : p)
              )}
              onRemove={async () => {
                setLocalProjects(prev => (prev ?? projs).filter(p => p.id !== proj.id));
                await removeProject(proj.id);
              }}
              {...projectsDrag.getItemProps(proji)}
            >
              <div className="space-y-3">
                <div>
                  <FieldLabel light>Tagline</FieldLabel>
                  <TextInput light
                    value={proj.tagline}
                    onChange={v => setLocalProjects(prev =>
                      (prev ?? projs).map(p => p.id === proj.id ? { ...p, tagline: v } : p)
                    )}
                    placeholder="Jedno zdanie..."
                  />
                </div>
                <div>
                  <FieldLabel light>Opis</FieldLabel>
                  <TextArea light
                    value={proj.description}
                    onChange={v => setLocalProjects(prev =>
                      (prev ?? projs).map(p => p.id === proj.id ? { ...p, description: v } : p)
                    )}
                    rows={3}
                  />
                </div>
                <div>
                  <FieldLabel light>Stack</FieldLabel>
                  <TextInput light
                    value={proj.stack}
                    onChange={v => setLocalProjects(prev =>
                      (prev ?? projs).map(p => p.id === proj.id ? { ...p, stack: v } : p)
                    )}
                    placeholder="React, TypeScript, Tailwind…"
                  />
                </div>
                <div>
                  <FieldLabel light>Notatka (opcjonalna)</FieldLabel>
                  <TextInput light
                    value={proj.note ?? ''}
                    onChange={v => setLocalProjects(prev =>
                      (prev ?? projs).map(p => p.id === proj.id ? { ...p, note: v || undefined } : p)
                    )}
                    placeholder="np. Zbudowany z AI"
                  />
                </div>
                <div>
                  <FieldLabel light>Linki</FieldLabel>
                  <LinksEditor light
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
            </CollapsibleItem>
          ))}
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await addProject({ name: '' });
              setLocalProjects(null);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Dodaj projekt
          </Button>
        </div>
      )}

      {/* ── TECHNOLOGIE I NARZĘDZIA ──────────────────────────────────────────── */}
      {section === 'technologie' && (
        <div className="space-y-3">
          {tech.map((t, ti) => (
            <CollapsibleItem
              key={t.id}
              label={t.category}
              labelPlaceholder="Frontend"
              onLabelChange={v => setLocalTech(prev =>
                (prev ?? tech).map(x => x.id === t.id ? { ...x, category: v } : x)
              )}
              onRemove={async () => {
                setLocalTech(prev => (prev ?? tech).filter(x => x.id !== t.id));
                await removeTechCategory(t.id);
              }}
              {...techDrag.getItemProps(ti)}
            >
              <div>
                <FieldLabel light>Technologie</FieldLabel>
                <TextInput light
                  value={t.items}
                  onChange={v => setLocalTech(prev =>
                    (prev ?? tech).map(x => x.id === t.id ? { ...x, items: v } : x)
                  )}
                  placeholder="React, TypeScript, Tailwind…"
                />
              </div>
              <div className="flex justify-end mt-3">
                <SaveButton
                  onClick={() => handleSaveTech(tech.find(x => x.id === t.id) ?? t)}
                  saving={!!savingMap[t.id]}
                  saved={!!savedMap[t.id]}
                />
              </div>
            </CollapsibleItem>
          ))}
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await addTechCategory({ category: '', items: '' });
              setLocalTech(null);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Dodaj kategorię
          </Button>
        </div>
      )}

      {/* ── WYKSZTAŁCENIE ────────────────────────────────────────────────────── */}
      {section === 'wyksztalcenie' && (
        <div className="space-y-3">
          {edu.map((e, edi) => (
            <CollapsibleItem
              key={e.id}
              label={e.school}
              labelPlaceholder="UCZELNIA"
              onLabelChange={v => setLocalEducation(prev =>
                (prev ?? edu).map(x => x.id === e.id ? { ...x, school: v } : x)
              )}
              onRemove={async () => {
                setLocalEducation(prev => (prev ?? edu).filter(x => x.id !== e.id));
                await removeEducation(e.id);
              }}
              {...educationDrag.getItemProps(edi)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <FieldLabel light>Kierunek</FieldLabel>
                  <TextInput light
                    value={e.degree}
                    onChange={v => setLocalEducation(prev =>
                      (prev ?? edu).map(x => x.id === e.id ? { ...x, degree: v } : x)
                    )}
                    placeholder="Informatyka"
                  />
                </div>
                <div>
                  <FieldLabel light>Lata</FieldLabel>
                  <YearRangePicker light
                    value={e.years}
                    onChange={v => setLocalEducation(prev =>
                      (prev ?? edu).map(x => x.id === e.id ? { ...x, years: v } : x)
                    )}
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
            </CollapsibleItem>
          ))}
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await addEducation({ school: '', degree: '', years: '' });
              setLocalEducation(null);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Dodaj wykształcenie
          </Button>
        </div>
      )}

      {/* ── CERTYFIKATY ──────────────────────────────────────────────────────── */}
      {section === 'certyfikaty' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 font-light">
            Certyfikaty z plikiem stają się klikalnym linkiem w CV — rekruter może otworzyć plik, a Ty dostaniesz powiadomienie.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0];
              const certId = pendingUploadCertId.current;
              if (file && certId) await handleUploadFile(certId, file);
              e.target.value = '';
            }}
          />
          {certs.map((cert, certi) => (
            <CollapsibleItem
              key={cert.id}
              label={cert.name}
              labelPlaceholder="AWS Certified Developer"
              onLabelChange={v => setLocalCertificates(prev =>
                (prev ?? certs).map(c => c.id === cert.id ? { ...c, name: v } : c)
              )}
              onRemove={async () => {
                setLocalCertificates(prev => (prev ?? certs).filter(c => c.id !== cert.id));
                await removeCertificate(cert.id);
              }}
              {...certificatesDrag.getItemProps(certi)}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="md:col-span-2">
                    <FieldLabel light>Wystawca</FieldLabel>
                    <TextInput light
                      value={cert.issuer}
                      onChange={v => setLocalCertificates(prev =>
                        (prev ?? certs).map(c => c.id === cert.id ? { ...c, issuer: v } : c)
                      )}
                      placeholder="Amazon Web Services"
                    />
                  </div>
                  <div>
                    <FieldLabel light>Rok</FieldLabel>
                    <TextInput light
                      value={cert.year}
                      onChange={v => setLocalCertificates(prev =>
                        (prev ?? certs).map(c => c.id === cert.id ? { ...c, year: v } : c)
                      )}
                      placeholder="2024"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      pendingUploadCertId.current = cert.id;
                      fileInputRef.current?.click();
                    }}
                    disabled={uploadingCertId === cert.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-dark-700 text-slate-300 hover:text-white hover:bg-dark-600 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {uploadingCertId === cert.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Upload className="w-3.5 h-3.5" />
                    }
                    {cert.file_url ? 'Zmień plik' : 'Dodaj plik'}
                  </button>
                  {cert.file_url && (
                    <a
                      href={cert.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Podgląd
                    </a>
                  )}
                  {cert.file_url && (
                    <span className="text-xs text-success-400">Plik wgrany</span>
                  )}
                </div>
                <div className="flex justify-end">
                  <SaveButton
                    onClick={() => handleSaveCertificate(certs.find(c => c.id === cert.id) ?? cert)}
                    saving={!!savingMap[cert.id]}
                    saved={!!savedMap[cert.id]}
                  />
                </div>
              </div>
            </CollapsibleItem>
          ))}
          <Button
            type="button"
            size="sm"
            onClick={async () => {
              await addCertificate({ name: '', issuer: '', year: '' });
              setLocalCertificates(null);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Dodaj certyfikat
          </Button>
        </div>
      )}

      {/* ── ZAINTERESOWANIA + RODO ───────────────────────────────────────────── */}
      {section === 'zainteresowania' && (
        <div className="space-y-4">
          <div>
            <FieldLabel light>Zainteresowania</FieldLabel>
            <TextInput light
              value={interestsRodo.interests}
              onChange={v => setInterestsDraft(d => ({ ...(d ?? interestsRodo), interests: v }))}
              placeholder="Kawa • Muzyka • Sport…"
            />
          </div>
          <div>
            <FieldLabel light>Klauzula RODO</FieldLabel>
            <TextArea light
              value={interestsRodo.rodo}
              onChange={v => setInterestsDraft(d => ({ ...(d ?? interestsRodo), rodo: v }))}
              rows={3}
              placeholder="Wyrażam zgodę na przetwarzanie moich danych osobowych..."
            />
          </div>
          <div className="flex justify-end pt-2">
            <SaveButton onClick={handleSaveInterests} saving={interestsSaving} saved={interestsSaved} />
          </div>
        </div>
      )}
    </div>
  );
}
