import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PageHeader, Button, Checkbox, CollapsibleItem } from '../components/ui';
import { FieldLabel, TextInput, TextArea, BulletsEditor, YearRangePicker } from '../components/forms/FormPrimitives';
import { useProfile } from '../hooks/useProfile';
import { parseCvText, ParseCvError, ParsedCvProfile } from '../lib/parseCv';
import { updateAt, removeAt } from '../utils/array';
import type { ProfileExperienceRole } from '../types/profile';

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MIN_TEXT_LENGTH = 200;

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map(item => ('str' in item ? item.str : '')).join(' '));
  }
  return pageTexts.join('\n\n').trim();
}

type Status = 'idle' | 'reading' | 'analyzing' | 'review' | 'saving' | 'error';

interface ReviewExperience { id: string; include: boolean; company: string; roles: ProfileExperienceRole[] }
interface ReviewEducation { id: string; include: boolean; school: string; degree: string; years: string }
interface ReviewTech { id: string; include: boolean; category: string; items: string }
interface ReviewProject { id: string; include: boolean; name: string; tagline: string; description: string; stack: string }
interface ReviewCertificate { id: string; include: boolean; name: string; issuer: string; year: string }

interface ContactChecked { name: boolean; location: boolean; phone: boolean; email: boolean; links: boolean; interests: boolean }

export function ImportCvPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const {
    profile, updateProfile,
    experiences: existingExperiences, addExperience,
    education: existingEducation, addEducation,
    techCategories: existingTechCategories, addTechCategory,
    projects: existingProjects, addProject,
    certificates: existingCertificates, addCertificate,
  } = useProfile();

  // ── Stan ekranu podglądu (wypełniany po udanej analizie) ────────────────────
  const [contactDraft, setContactDraft] = useState({ name: '', location: '', phone: '', email: '' });
  const [linksDraft, setLinksDraft] = useState<{ label: string; url: string }[]>([]);
  const [contactChecked, setContactChecked] = useState<ContactChecked>({
    name: false, location: false, phone: false, email: false, links: false, interests: false,
  });
  const [interestsDraft, setInterestsDraft] = useState('');
  const [reviewExperiences, setReviewExperiences] = useState<ReviewExperience[]>([]);
  const [reviewEducation, setReviewEducation] = useState<ReviewEducation[]>([]);
  const [reviewTech, setReviewTech] = useState<ReviewTech[]>([]);
  const [reviewProjects, setReviewProjects] = useState<ReviewProject[]>([]);
  const [reviewCertificates, setReviewCertificates] = useState<ReviewCertificate[]>([]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    if (file.type !== 'application/pdf') {
      setStatus('error');
      setError('Obsługiwane są na razie tylko pliki PDF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus('error');
      setError('Plik jest za duży (limit 8 MB).');
      return;
    }

    setStatus('reading');
    let text: string;
    try {
      text = await extractPdfText(file);
      if (text.length < MIN_TEXT_LENGTH) {
        setStatus('error');
        setError('Nie udało się odczytać tekstu z tego pliku — może to skan (obraz). Spróbuj pliku PDF wygenerowanego z edytora tekstu, albo uzupełnij profil ręcznie.');
        return;
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
      setError('Nie udało się odczytać pliku PDF.');
      return;
    }

    setStatus('analyzing');
    let parsed: ParsedCvProfile;
    try {
      parsed = await parseCvText(text);
    } catch (e) {
      console.error(e);
      setStatus('error');
      setError(e instanceof ParseCvError ? e.message : 'Nie udało się przeanalizować CV — spróbuj ponownie.');
      return;
    }

    // ── Przygotowanie ekranu podglądu z wykrytych danych ──────────────────────
    setContactDraft({
      name: parsed.contact?.name ?? '',
      location: parsed.contact?.location ?? '',
      phone: parsed.contact?.phone ?? '',
      email: parsed.contact?.email ?? '',
    });
    setLinksDraft(parsed.contact?.links ?? []);
    setContactChecked({
      name: !profile.name && !!parsed.contact?.name,
      location: !profile.location && !!parsed.contact?.location,
      phone: !profile.phone && !!parsed.contact?.phone,
      email: !profile.email && !!parsed.contact?.email,
      links: profile.links.length === 0 && (parsed.contact?.links?.length ?? 0) > 0,
      interests: !profile.interests && !!parsed.interests,
    });
    setInterestsDraft(parsed.interests ?? '');
    setReviewExperiences((parsed.experiences ?? []).map(exp => ({
      id: uuidv4(), include: true, company: exp.company,
      roles: exp.roles.map(r => ({ title: r.title, years: r.years ?? '', bullets: r.bullets })),
    })));
    setReviewEducation((parsed.education ?? []).map(edu => ({ id: uuidv4(), include: true, ...edu })));
    setReviewTech((parsed.techCategories ?? []).map(t => ({ id: uuidv4(), include: true, ...t })));
    setReviewProjects((parsed.projects ?? []).map(p => ({
      id: uuidv4(), include: true, name: p.name,
      tagline: p.tagline ?? '', description: p.description ?? '', stack: p.stack ?? '',
    })));
    setReviewCertificates((parsed.certificates ?? []).map(c => ({
      id: uuidv4(), include: true, name: c.name, issuer: c.issuer ?? '', year: c.year ?? '',
    })));

    setStatus('review');
  }, [profile]);

  const handleSave = useCallback(async () => {
    setStatus('saving');
    setError(null);
    try {
      const contactChanged = contactChecked.name || contactChecked.location || contactChecked.phone
        || contactChecked.email || contactChecked.links || contactChecked.interests;
      if (contactChanged) {
        await updateProfile({
          name: contactChecked.name ? contactDraft.name : profile.name,
          location: contactChecked.location ? contactDraft.location : profile.location,
          phone: contactChecked.phone ? contactDraft.phone : profile.phone,
          email: contactChecked.email ? contactDraft.email : profile.email,
          links: contactChecked.links ? linksDraft : profile.links,
          interests: contactChecked.interests ? interestsDraft : profile.interests,
          rodo: profile.rodo,
        });
      }

      const includedExperiences = reviewExperiences.filter(e => e.include);
      for (let i = 0; i < includedExperiences.length; i++) {
        const e = includedExperiences[i];
        await addExperience({ company: e.company, roles: e.roles, sort_order: existingExperiences.length + i });
      }

      const includedEducation = reviewEducation.filter(e => e.include);
      for (let i = 0; i < includedEducation.length; i++) {
        const e = includedEducation[i];
        await addEducation({ school: e.school, degree: e.degree, years: e.years, sort_order: existingEducation.length + i });
      }

      const includedTech = reviewTech.filter(t => t.include);
      for (let i = 0; i < includedTech.length; i++) {
        const t = includedTech[i];
        await addTechCategory({ category: t.category, items: t.items, sort_order: existingTechCategories.length + i });
      }

      const includedProjects = reviewProjects.filter(p => p.include);
      for (let i = 0; i < includedProjects.length; i++) {
        const p = includedProjects[i];
        await addProject({ name: p.name, tagline: p.tagline, description: p.description, stack: p.stack, sort_order: existingProjects.length + i });
      }

      const includedCertificates = reviewCertificates.filter(c => c.include);
      for (let i = 0; i < includedCertificates.length; i++) {
        const c = includedCertificates[i];
        await addCertificate({ name: c.name, issuer: c.issuer, year: c.year, sort_order: existingCertificates.length + i });
      }

      navigate('/profil/doswiadczenie');
    } catch (e) {
      console.error(e);
      setStatus('review');
      setError('Część danych mogła się nie zapisać — sprawdź profil i spróbuj ponownie dla brakujących pozycji.');
    }
  }, [
    contactChecked, contactDraft, linksDraft, interestsDraft, profile, updateProfile,
    reviewExperiences, existingExperiences.length, addExperience,
    reviewEducation, existingEducation.length, addEducation,
    reviewTech, existingTechCategories.length, addTechCategory,
    reviewProjects, existingProjects.length, addProject,
    reviewCertificates, existingCertificates.length, addCertificate,
    navigate,
  ]);

  const busy = status === 'reading' || status === 'analyzing';

  return (
    <div className="space-y-6 pb-20">
      <PageHeader icon={FileText} title="Importuj z CV" description="Profil kandydata" />

      {status !== 'review' && status !== 'saving' && (
        <div className="fold-card bg-dark-800 p-4 space-y-4">
          <p className="text-xs text-slate-500 font-light">
            Wgraj plik PDF ze swoim CV — AI spróbuje wypełnić nim Twój profil kandydata. Zanim cokolwiek się zapisze, zobaczysz i będziesz mógł/mogła poprawić wykryte dane.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {status === 'reading' ? 'Odczytuję plik…' : status === 'analyzing' ? 'Analizuję CV z AI…' : 'Wybierz plik PDF'}
          </Button>
          {status === 'analyzing' && (
            <p className="text-xs text-slate-500 font-light">To może potrwać do minuty przy bogatym CV — nie zamykaj tej strony.</p>
          )}
          {error && <p className="text-sm text-danger-400">{error}</p>}
        </div>
      )}

      {(status === 'review' || status === 'saving') && (
        <div className="space-y-4">
          <div className="fold-card bg-dark-800 p-4">
            <p className="text-sm text-slate-300">
              To są dane wykryte automatycznie z Twojego CV — sprawdź je przed zapisaniem, model AI mógł się pomylić. Zaznaczone pozycje trafią do profilu.
            </p>
          </div>

          {/* ── KONTAKT ──────────────────────────────────────────────────────── */}
          <div className="fold-card bg-dark-800 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Dane kontaktowe</h3>
            {([
              ['name', 'Imię i nazwisko', contactDraft.name, (v: string) => setContactDraft(d => ({ ...d, name: v }))],
              ['location', 'Lokalizacja', contactDraft.location, (v: string) => setContactDraft(d => ({ ...d, location: v }))],
              ['phone', 'Telefon', contactDraft.phone, (v: string) => setContactDraft(d => ({ ...d, phone: v }))],
              ['email', 'Email', contactDraft.email, (v: string) => setContactDraft(d => ({ ...d, email: v }))],
            ] as const).map(([key, label, value, onChange]) => (
              !!value && (
                <div key={key} className="flex items-start gap-3">
                  <Checkbox
                    checked={contactChecked[key]}
                    onChange={() => setContactChecked(c => ({ ...c, [key]: !c[key] }))}
                    className="mt-2.5"
                    title="Zaktualizuj to pole w profilu"
                  />
                  <div className="flex-1 min-w-0">
                    <FieldLabel light>{label}</FieldLabel>
                    <TextInput value={value} onChange={onChange} />
                  </div>
                </div>
              )
            ))}
            {linksDraft.length > 0 && (
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={contactChecked.links}
                  onChange={() => setContactChecked(c => ({ ...c, links: !c.links }))}
                  className="mt-2.5"
                  title="Zastąp linki w profilu wykrytymi"
                />
                <div className="flex-1 min-w-0">
                  <FieldLabel light>Linki ({linksDraft.map(l => l.label || l.url).join(', ')})</FieldLabel>
                </div>
              </div>
            )}
            {!!interestsDraft && (
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={contactChecked.interests}
                  onChange={() => setContactChecked(c => ({ ...c, interests: !c.interests }))}
                  className="mt-2.5"
                  title="Zaktualizuj zainteresowania w profilu"
                />
                <div className="flex-1 min-w-0">
                  <FieldLabel light>Zainteresowania</FieldLabel>
                  <TextArea value={interestsDraft} onChange={setInterestsDraft} rows={2} />
                </div>
              </div>
            )}
          </div>

          {/* ── DOŚWIADCZENIE ────────────────────────────────────────────────── */}
          {reviewExperiences.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white px-1">Doświadczenie zawodowe</h3>
              {reviewExperiences.map((exp, i) => (
                <CollapsibleItem
                  key={exp.id}
                  label={exp.company || 'Firma'}
                  onRemove={() => setReviewExperiences(prev => removeAt(prev, i))}
                >
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <Checkbox checked={exp.include} onChange={() => setReviewExperiences(prev => updateAt(prev, i, { ...exp, include: !exp.include }))} />
                      Uwzględnij w profilu
                    </label>
                    <div>
                      <FieldLabel light>Firma</FieldLabel>
                      <TextInput value={exp.company} onChange={v => setReviewExperiences(prev => updateAt(prev, i, { ...exp, company: v }))} />
                    </div>
                    {exp.roles.map((role, ri) => (
                      <div key={ri} className="bg-dark-700/60 p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          <div>
                            <FieldLabel light>Stanowisko</FieldLabel>
                            <TextInput
                              value={role.title}
                              onChange={v => setReviewExperiences(prev => updateAt(prev, i, { ...exp, roles: updateAt(exp.roles, ri, { ...role, title: v }) }))}
                            />
                          </div>
                          <div>
                            <FieldLabel light>Lata</FieldLabel>
                            <YearRangePicker
                              value={role.years ?? ''}
                              onChange={v => setReviewExperiences(prev => updateAt(prev, i, { ...exp, roles: updateAt(exp.roles, ri, { ...role, years: v }) }))}
                            />
                          </div>
                        </div>
                        <FieldLabel light>Zakres obowiązków</FieldLabel>
                        <BulletsEditor
                          bullets={role.bullets}
                          onChange={bullets => setReviewExperiences(prev => updateAt(prev, i, { ...exp, roles: updateAt(exp.roles, ri, { ...role, bullets }) }))}
                        />
                      </div>
                    ))}
                  </div>
                </CollapsibleItem>
              ))}
            </div>
          )}

          {/* ── WYKSZTAŁCENIE ────────────────────────────────────────────────── */}
          {reviewEducation.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white px-1">Wykształcenie</h3>
              {reviewEducation.map((edu, i) => (
                <CollapsibleItem key={edu.id} label={edu.school || 'Szkoła'} onRemove={() => setReviewEducation(prev => removeAt(prev, i))}>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <Checkbox checked={edu.include} onChange={() => setReviewEducation(prev => updateAt(prev, i, { ...edu, include: !edu.include }))} />
                      Uwzględnij w profilu
                    </label>
                    <div>
                      <FieldLabel light>Szkoła</FieldLabel>
                      <TextInput value={edu.school} onChange={v => setReviewEducation(prev => updateAt(prev, i, { ...edu, school: v }))} />
                    </div>
                    <div>
                      <FieldLabel light>Kierunek</FieldLabel>
                      <TextInput value={edu.degree} onChange={v => setReviewEducation(prev => updateAt(prev, i, { ...edu, degree: v }))} />
                    </div>
                    <div>
                      <FieldLabel light>Lata</FieldLabel>
                      <YearRangePicker value={edu.years} onChange={v => setReviewEducation(prev => updateAt(prev, i, { ...edu, years: v }))} />
                    </div>
                  </div>
                </CollapsibleItem>
              ))}
            </div>
          )}

          {/* ── TECHNOLOGIE ──────────────────────────────────────────────────── */}
          {reviewTech.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white px-1">Technologie</h3>
              {reviewTech.map((t, i) => (
                <CollapsibleItem key={t.id} label={t.category || 'Kategoria'} onRemove={() => setReviewTech(prev => removeAt(prev, i))}>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <Checkbox checked={t.include} onChange={() => setReviewTech(prev => updateAt(prev, i, { ...t, include: !t.include }))} />
                      Uwzględnij w profilu
                    </label>
                    <div>
                      <FieldLabel light>Kategoria</FieldLabel>
                      <TextInput value={t.category} onChange={v => setReviewTech(prev => updateAt(prev, i, { ...t, category: v }))} />
                    </div>
                    <div>
                      <FieldLabel light>Technologie</FieldLabel>
                      <TextArea value={t.items} onChange={v => setReviewTech(prev => updateAt(prev, i, { ...t, items: v }))} rows={2} />
                    </div>
                  </div>
                </CollapsibleItem>
              ))}
            </div>
          )}

          {/* ── PROJEKTY ─────────────────────────────────────────────────────── */}
          {reviewProjects.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white px-1">Projekty</h3>
              {reviewProjects.map((p, i) => (
                <CollapsibleItem key={p.id} label={p.name || 'Projekt'} onRemove={() => setReviewProjects(prev => removeAt(prev, i))}>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <Checkbox checked={p.include} onChange={() => setReviewProjects(prev => updateAt(prev, i, { ...p, include: !p.include }))} />
                      Uwzględnij w profilu
                    </label>
                    <div>
                      <FieldLabel light>Nazwa</FieldLabel>
                      <TextInput value={p.name} onChange={v => setReviewProjects(prev => updateAt(prev, i, { ...p, name: v }))} />
                    </div>
                    <div>
                      <FieldLabel light>Hasło</FieldLabel>
                      <TextInput value={p.tagline} onChange={v => setReviewProjects(prev => updateAt(prev, i, { ...p, tagline: v }))} />
                    </div>
                    <div>
                      <FieldLabel light>Opis</FieldLabel>
                      <TextArea value={p.description} onChange={v => setReviewProjects(prev => updateAt(prev, i, { ...p, description: v }))} />
                    </div>
                    <div>
                      <FieldLabel light>Stack</FieldLabel>
                      <TextInput value={p.stack} onChange={v => setReviewProjects(prev => updateAt(prev, i, { ...p, stack: v }))} />
                    </div>
                  </div>
                </CollapsibleItem>
              ))}
            </div>
          )}

          {/* ── CERTYFIKATY ──────────────────────────────────────────────────── */}
          {reviewCertificates.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white px-1">Certyfikaty</h3>
              {reviewCertificates.map((c, i) => (
                <CollapsibleItem key={c.id} label={c.name || 'Certyfikat'} onRemove={() => setReviewCertificates(prev => removeAt(prev, i))}>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs text-slate-400">
                      <Checkbox checked={c.include} onChange={() => setReviewCertificates(prev => updateAt(prev, i, { ...c, include: !c.include }))} />
                      Uwzględnij w profilu
                    </label>
                    <div>
                      <FieldLabel light>Nazwa</FieldLabel>
                      <TextInput value={c.name} onChange={v => setReviewCertificates(prev => updateAt(prev, i, { ...c, name: v }))} />
                    </div>
                    <div>
                      <FieldLabel light>Wystawca</FieldLabel>
                      <TextInput value={c.issuer} onChange={v => setReviewCertificates(prev => updateAt(prev, i, { ...c, issuer: v }))} />
                    </div>
                    <div>
                      <FieldLabel light>Rok</FieldLabel>
                      <TextInput value={c.year} onChange={v => setReviewCertificates(prev => updateAt(prev, i, { ...c, year: v }))} />
                    </div>
                  </div>
                </CollapsibleItem>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-danger-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setStatus('idle')} disabled={status === 'saving'}>
              Anuluj
            </Button>
            <Button type="button" onClick={handleSave} disabled={status === 'saving'}>
              {status === 'saving' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {status === 'saving' ? 'Zapisuję…' : 'Zapisz do profilu'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
