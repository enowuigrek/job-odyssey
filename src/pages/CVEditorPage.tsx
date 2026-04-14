import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Eye, ArrowLeft, FileEdit } from 'lucide-react';
import { Button, PageHeader } from '../components/ui';
import type { CVData, CVLink, CVCustomSection } from '../templates/cv/types';
import { defaultCVData } from '../templates/cv/defaultCVData';
import { CV_EDITOR_STORAGE_KEY, saveCVEditorData, CV_PRINT_STORAGE_KEY } from '../lib/generateCV';
import { getDistinctTrackingLinksForUser } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadData(): CVData {
  const raw = localStorage.getItem(CV_EDITOR_STORAGE_KEY);
  if (raw) {
    try { return JSON.parse(raw) as CVData; } catch { /* ignore */ }
  }
  return JSON.parse(JSON.stringify(defaultCVData)) as CVData;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function updateAt<T>(arr: T[], i: number, val: T): T[] {
  return arr.map((x, idx) => idx === i ? val : x);
}
function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface DbLink { label: string; targetUrl: string; }

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="border-b border-primary-500/40 pb-1.5 mb-4 mt-8">
      <h2 className="text-xs font-medium text-primary-400 uppercase tracking-widest">{title}</h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-slate-400 mb-1">{children}</label>;
}

function TextInput({
  value, onChange, placeholder, className = '',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
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
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
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

function LinkRow({
  link, dbLinks, onChange, onRemove,
}: {
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
          {dbLinks.map(l => (
            <option key={l.targetUrl} value={l.targetUrl}>{l.label}</option>
          ))}
        </select>
      )}
      <button type="button" onClick={onRemove} className="p-1 text-slate-600 hover:text-danger-400 transition-colors cursor-pointer flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function LinksEditor({
  links, dbLinks, onChange,
}: {
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
        <Plus className="w-3.5 h-3.5" />
        Dodaj link
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
  const { user } = useAuth();
  const [data, setData] = useState<CVData>(loadData);
  const [dbLinks, setDbLinks] = useState<DbLink[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDistinctTrackingLinksForUser(user.id).then(setDbLinks).catch(() => {});
  }, [user]);

  const save = () => {
    saveCVEditorData(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const preview = () => {
    saveCVEditorData(data);
    localStorage.setItem(CV_PRINT_STORAGE_KEY, JSON.stringify(data));
    navigate('/cv-generator');
  };

  const set = (patch: Partial<CVData>) => setData(d => ({ ...d, ...patch }));

  return (
    <div className="space-y-2 pb-16">
      <PageHeader
        icon={FileEdit}
        title="Edytor CV"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Wróć</span>
            </button>
            <button
              onClick={preview}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-dark-700 hover:bg-dark-600 text-slate-300 text-sm transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Podgląd
            </button>
            <button
              onClick={save}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                saved
                  ? 'bg-success-500/20 text-success-400'
                  : 'bg-primary-500 hover:bg-primary-400 text-slate-900'
              }`}
            >
              <Save className="w-4 h-4" />
              {saved ? 'Zapisano!' : 'Zapisz'}
            </button>
          </div>
        }
      />

      {dbLinks.length > 0 && (
        <p className="text-xs text-slate-500">
          Znaleziono {dbLinks.length} linków z bazy — dostępne w polach linków jako „z bazy".
        </p>
      )}

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
          <TextInput
            value={data.contact.location}
            onChange={v => set({ contact: { ...data.contact, location: v } })}
            placeholder="Miasto"
          />
        </div>
        <div>
          <FieldLabel>Telefon</FieldLabel>
          <TextInput
            value={data.contact.phone}
            onChange={v => set({ contact: { ...data.contact, phone: v } })}
            placeholder="000 000 000"
          />
        </div>
        <div>
          <FieldLabel>E-mail</FieldLabel>
          <TextInput
            value={data.contact.email}
            onChange={v => set({ contact: { ...data.contact, email: v } })}
            placeholder="email@example.com"
          />
        </div>
      </div>
      <FieldLabel>Linki (LinkedIn, GitHub, Portfolio...)</FieldLabel>
      <LinksEditor
        links={data.contact.links}
        dbLinks={dbLinks}
        onChange={links => set({ contact: { ...data.contact, links } })}
      />

      {/* ── Profil ───────────────────────────────────────────────────── */}
      <SectionHeading title="Profil" />
      <TextArea
        value={data.profile}
        onChange={v => set({ profile: v })}
        placeholder="Krótki opis..."
        rows={5}
      />

      {/* ── Podejście do pracy ───────────────────────────────────────── */}
      <SectionHeading title="Podejście do pracy" />
      <TextArea
        value={data.approach}
        onChange={v => set({ approach: v })}
        placeholder="Jak pracujesz..."
        rows={4}
      />

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
              <FieldLabel>Technologie (oddzielone przecinkami)</FieldLabel>
              <TextInput
                value={tech.items}
                onChange={v => set({ technologies: updateAt(data.technologies, ti, { ...tech, items: v }) })}
                placeholder="React, TypeScript, Tailwind..."
              />
            </div>
          </div>
        </ItemCard>
      ))}
      <Button
        variant="secondary"
        onClick={() => set({ technologies: [...data.technologies, { category: '', items: '' }] })}
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Dodaj kategorię
      </Button>

      {/* ── Projekty ─────────────────────────────────────────────────── */}
      <SectionHeading title="Wybrane projekty" />
      {data.projects.map((proj, pi) => (
        <ItemCard key={pi} onRemove={() => set({ projects: removeAt(data.projects, pi) })}>
          <div className="space-y-3 pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Nazwa projektu</FieldLabel>
                <TextInput
                  value={proj.name}
                  onChange={v => set({ projects: updateAt(data.projects, pi, { ...proj, name: v }) })}
                  placeholder="NAZWA PROJEKTU"
                />
              </div>
              <div>
                <FieldLabel>Tagline (krótki opis)</FieldLabel>
                <TextInput
                  value={proj.tagline}
                  onChange={v => set({ projects: updateAt(data.projects, pi, { ...proj, tagline: v }) })}
                  placeholder="Jedno zdanie..."
                />
              </div>
            </div>
            <div>
              <FieldLabel>Opis</FieldLabel>
              <TextArea
                value={proj.description}
                onChange={v => set({ projects: updateAt(data.projects, pi, { ...proj, description: v }) })}
                rows={3}
              />
            </div>
            <div>
              <FieldLabel>Stack technologiczny</FieldLabel>
              <TextInput
                value={proj.stack}
                onChange={v => set({ projects: updateAt(data.projects, pi, { ...proj, stack: v }) })}
                placeholder="Stack: React, TypeScript..."
              />
            </div>
            <div>
              <FieldLabel>Notatka (opcjonalna)</FieldLabel>
              <TextInput
                value={proj.note ?? ''}
                onChange={v => set({ projects: updateAt(data.projects, pi, { ...proj, note: v || undefined }) })}
                placeholder="np. Zbudowany metodą AI-assisted development"
              />
            </div>
            <div>
              <FieldLabel>Linki</FieldLabel>
              <LinksEditor
                links={proj.links}
                dbLinks={dbLinks}
                onChange={links => set({ projects: updateAt(data.projects, pi, { ...proj, links }) })}
              />
            </div>
          </div>
        </ItemCard>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          set({
            projects: [
              ...data.projects,
              { name: '', tagline: '', description: '', stack: '', links: [] },
            ],
          })
        }
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Dodaj projekt
      </Button>

      {/* ── Doświadczenie ─────────────────────────────────────────────── */}
      <SectionHeading title="Doświadczenie zawodowe" />
      {data.experience.map((exp, ei) => (
        <ItemCard key={ei} onRemove={() => set({ experience: removeAt(data.experience, ei) })}>
          <div className="space-y-3 pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <FieldLabel>Firma</FieldLabel>
                <TextInput
                  value={exp.company}
                  onChange={v => set({ experience: updateAt(data.experience, ei, { ...exp, company: v }) })}
                  placeholder="NAZWA FIRMY"
                />
              </div>
              <div>
                <FieldLabel>Link firmy (opcjonalny)</FieldLabel>
                <div className="flex gap-2">
                  <input
                    value={exp.companyLink?.label ?? ''}
                    onChange={e => {
                      const label = e.target.value;
                      const url = exp.companyLink?.url ?? '';
                      set({
                        experience: updateAt(data.experience, ei, {
                          ...exp,
                          companyLink: label || url ? { label, url } : undefined,
                        }),
                      });
                    }}
                    placeholder="Etykieta"
                    className="w-24 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 flex-shrink-0"
                  />
                  <input
                    value={exp.companyLink?.url ?? ''}
                    onChange={e => {
                      const url = e.target.value;
                      const label = exp.companyLink?.label ?? '';
                      set({
                        experience: updateAt(data.experience, ei, {
                          ...exp,
                          companyLink: label || url ? { label, url } : undefined,
                        }),
                      });
                    }}
                    placeholder="https://..."
                    className="flex-1 px-2 py-1.5 bg-dark-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0"
                  />
                </div>
              </div>
            </div>

            {/* Roles */}
            <div>
              <FieldLabel>Stanowiska</FieldLabel>
              {exp.roles.map((role, ri) => (
                <div key={ri} className="bg-dark-700/60 p-3 mb-2 relative">
                  <button
                    type="button"
                    onClick={() =>
                      set({
                        experience: updateAt(data.experience, ei, {
                          ...exp,
                          roles: removeAt(exp.roles, ri),
                        }),
                      })
                    }
                    className="absolute top-2 right-2 p-1 text-slate-600 hover:text-danger-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 pr-6">
                    <div>
                      <FieldLabel>Stanowisko | lata</FieldLabel>
                      <TextInput
                        value={role.title}
                        onChange={v =>
                          set({
                            experience: updateAt(data.experience, ei, {
                              ...exp,
                              roles: updateAt(exp.roles, ri, { ...role, title: v }),
                            }),
                          })
                        }
                        placeholder="Frontend Developer | 2023 – obecnie"
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Punkty (jeden na linię)</FieldLabel>
                    <TextArea
                      value={role.bullets.join('\n')}
                      onChange={v =>
                        set({
                          experience: updateAt(data.experience, ei, {
                            ...exp,
                            roles: updateAt(exp.roles, ri, {
                              ...role,
                              bullets: v.split('\n').filter(b => b.trim()),
                            }),
                          }),
                        })
                      }
                      rows={3}
                      placeholder="Opis obowiązków...&#10;Kolejny punkt..."
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  set({
                    experience: updateAt(data.experience, ei, {
                      ...exp,
                      roles: [...exp.roles, { title: '', years: '', bullets: [] }],
                    }),
                  })
                }
                className="flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors cursor-pointer mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Dodaj stanowisko
              </button>
            </div>
          </div>
        </ItemCard>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          set({
            experience: [
              ...data.experience,
              { company: '', roles: [{ title: '', years: '', bullets: [] }] },
            ],
          })
        }
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Dodaj firmę
      </Button>

      {/* ── Wykształcenie ─────────────────────────────────────────────── */}
      <SectionHeading title="Wykształcenie" />
      {data.education.map((edu, edi) => (
        <ItemCard key={edi} onRemove={() => set({ education: removeAt(data.education, edi) })}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pr-6">
            <div>
              <FieldLabel>Szkoła / uczelnia</FieldLabel>
              <TextInput
                value={edu.school}
                onChange={v => set({ education: updateAt(data.education, edi, { ...edu, school: v }) })}
                placeholder="UCZELNIA"
              />
            </div>
            <div>
              <FieldLabel>Kierunek / tytuł</FieldLabel>
              <TextInput
                value={edu.degree}
                onChange={v => set({ education: updateAt(data.education, edi, { ...edu, degree: v }) })}
                placeholder="Informatyka"
              />
            </div>
            <div>
              <FieldLabel>Lata</FieldLabel>
              <TextInput
                value={edu.years}
                onChange={v => set({ education: updateAt(data.education, edi, { ...edu, years: v }) })}
                placeholder="2019 – 2023"
              />
            </div>
          </div>
        </ItemCard>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          set({ education: [...data.education, { school: '', degree: '', years: '' }] })
        }
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Dodaj wykształcenie
      </Button>

      {/* ── Sekcje własne ─────────────────────────────────────────────── */}
      <SectionHeading title="Sekcje własne" />
      <p className="text-xs text-slate-500 mb-3">
        Dowolne sekcje z własnym nagłówkiem i treścią — np. Certyfikaty, Wolontariat, Języki.
      </p>
      {(data.customSections ?? []).map((sec, si) => (
        <ItemCard
          key={sec.id}
          onRemove={() =>
            set({ customSections: removeAt(data.customSections ?? [], si) })
          }
        >
          <div className="space-y-2 pr-6">
            <div>
              <FieldLabel>Nagłówek sekcji</FieldLabel>
              <TextInput
                value={sec.title}
                onChange={v =>
                  set({
                    customSections: updateAt(data.customSections ?? [], si, { ...sec, title: v }),
                  })
                }
                placeholder="np. Certyfikaty"
              />
            </div>
            <div>
              <FieldLabel>Treść</FieldLabel>
              <TextArea
                value={sec.content}
                onChange={v =>
                  set({
                    customSections: updateAt(data.customSections ?? [], si, { ...sec, content: v }),
                  })
                }
                rows={3}
                placeholder="Opis sekcji..."
              />
            </div>
          </div>
        </ItemCard>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          set({
            customSections: [
              ...(data.customSections ?? []),
              { id: uid(), title: '', content: '' },
            ],
          })
        }
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Dodaj sekcję
      </Button>

      {/* ── Zainteresowania ───────────────────────────────────────────── */}
      <SectionHeading title="Zainteresowania" />
      <TextInput
        value={data.interests}
        onChange={v => set({ interests: v })}
        placeholder="Kawa • Muzyka • Sport..."
      />

      {/* ── RODO ──────────────────────────────────────────────────────── */}
      <SectionHeading title="Klauzula RODO" />
      <TextArea
        value={data.rodo}
        onChange={v => set({ rodo: v })}
        rows={2}
        placeholder="Wyrażam zgodę na przetwarzanie moich danych osobowych..."
      />

      {/* ── Bottom save bar ────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-dark-900 border-t border-dark-700 px-4 py-3 flex justify-end gap-2 z-40">
        <button
          onClick={preview}
          className="flex items-center gap-1.5 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-slate-300 text-sm transition-colors cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          Podgląd
        </button>
        <button
          onClick={save}
          className={`flex items-center gap-1.5 px-6 py-2 text-sm font-medium transition-colors cursor-pointer ${
            saved
              ? 'bg-success-500/20 text-success-400'
              : 'bg-primary-500 hover:bg-primary-400 text-slate-900'
          }`}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Zapisano!' : 'Zapisz'}
        </button>
      </div>
    </div>
  );
}
