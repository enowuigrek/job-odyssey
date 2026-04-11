import { useState, useEffect } from 'react';
import { Link, ExternalLink, Copy, Check, Plus, Trash2, MousePointerClick, Clock, FileDown } from 'lucide-react';
import { Modal, Button, Badge, CountBadge } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useUserLinks } from '../../hooks/useUserLinks';
import {
  createTrackingLinks,
  getTrackingLinksForApplication,
  getClicksForApplication,
  getCVFileUrl,
  TrackingLink,
  TrackingClick,
} from '../../lib/db';
import { replacePlaceholderLinks, PlaceholderReplacement, extractPdfLinks, buildTrackUrl } from '../../lib/pdfTagging';
import { getPlaceholderUrl } from '../../lib/placeholders';
import { JobApplication } from '../../types';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const TRACK_BASE = `${SUPABASE_URL}/functions/v1/track`;

function trackUrl(token: string) {
  return `${TRACK_BASE}?t=${token}`;
}

interface LinkInput {
  label: string;
  targetUrl: string;
  preset: 'linkedin' | 'github' | 'custom';
}

const PRESETS = [
  { key: 'linkedin' as const, label: 'LinkedIn', placeholder: 'https://linkedin.com/in/twoj-profil' },
  { key: 'github' as const, label: 'GitHub', placeholder: 'https://github.com/twoj-profil' },
  { key: 'custom' as const, label: 'Custom', placeholder: 'https://...' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  application: JobApplication;
  onFirstClick?: () => void;
}

export function TrackingLinksModal({ isOpen, onClose, application, onFirstClick }: Props) {
  const { user } = useAuth();
  const { getCVById } = useApp();
  const { links: userLinks } = useUserLinks();
  const [existingLinks, setExistingLinks] = useState<TrackingLink[]>([]);
  const [clicks, setClicks] = useState<TrackingClick[]>([]);
  const [linkInputs, setLinkInputs] = useState<LinkInput[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [tab, setTab] = useState<'links' | 'clicks'>('links');

  useEffect(() => {
    if (!isOpen || !user) return;
    setIsLoading(true);

    Promise.all([
      getTrackingLinksForApplication(application.id),
      getClicksForApplication(application.id),
    ]).then(async ([links, clicks]) => {
      setClicks(clicks);

      if (clicks.length > 0 && onFirstClick) onFirstClick();

      // Jeśli brak linków, a mamy domyślne linki użytkownika → auto-generuj
      if (links.length === 0 && userLinks.length > 0) {
        const validLinks = userLinks.filter(l => l.url.trim());
        if (validLinks.length > 0) {
          const toCreate = validLinks.map(l => ({
            userId: user.id,
            applicationId: application.id,
            token: `${application.id.slice(0, 6)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            label: l.label,
            targetUrl: l.url.trim(),
          }));
          try {
            const created = await createTrackingLinks(toCreate);
            setExistingLinks(created);
          } catch {
            setExistingLinks([]);
          }
        } else {
          setExistingLinks([]);
        }
      } else {
        setExistingLinks(links);
      }

      setIsLoading(false);
    });

    // Formularz do ręcznego dodawania linków
    if (userLinks.length > 0) {
      setLinkInputs(userLinks.map(l => ({
        label: l.label,
        targetUrl: l.url,
        preset: (l.type === 'linkedin' || l.type === 'github') ? l.type : 'custom',
      })));
    } else {
      setLinkInputs([
        { label: 'LinkedIn', targetUrl: '', preset: 'linkedin' },
        { label: 'GitHub', targetUrl: '', preset: 'github' },
      ]);
    }
  }, [isOpen, application.id, onFirstClick, user, userLinks]);

  const addLinkInput = () => {
    setLinkInputs([...linkInputs, { label: '', targetUrl: '', preset: 'custom' }]);
  };

  const removeLinkInput = (index: number) => {
    setLinkInputs(linkInputs.filter((_, i) => i !== index));
  };

  const updateLinkInput = (index: number, field: keyof LinkInput, value: string) => {
    setLinkInputs(linkInputs.map((l, i) => {
      if (i !== index) return l;
      if (field === 'preset') {
        const preset = PRESETS.find(p => p.key === value);
        return { ...l, preset: value as LinkInput['preset'], label: preset?.label ?? l.label };
      }
      return { ...l, [field]: value };
    }));
  };

  const handleGenerate = async () => {
    if (!user) return;
    const validLinks = linkInputs.filter(l => l.label.trim() && l.targetUrl.trim());
    if (validLinks.length === 0) return;

    setIsSaving(true);
    try {
      const toCreate = validLinks.map(l => ({
        userId: user.id,
        applicationId: application.id,
        token: `${application.id.slice(0, 6)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        label: l.label.trim(),
        targetUrl: l.targetUrl.trim(),
      }));

      const created = await createTrackingLinks(toCreate);
      setExistingLinks(prev => [...prev, ...created]);
      setLinkInputs([{ label: '', targetUrl: '', preset: 'custom' }]);
    } finally {
      setIsSaving(false);
    }
  };

  const refreshClicks = async () => {
    setIsRefreshing(true);
    const updated = await getClicksForApplication(application.id);
    setClicks(updated);
    if (updated.length > 0 && onFirstClick) onFirstClick();
    setIsRefreshing(false);
    if (tab === 'links') setTab('clicks');
  };

  const copyToClipboard = async (token: string) => {
    await navigator.clipboard.writeText(trackUrl(token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const copyAllLinks = async () => {
    const text = existingLinks
      .map(l => `${l.label}: ${trackUrl(l.token)}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
  };

  const handleGeneratePdf = async () => {
    if (existingLinks.length === 0) return;
    setPdfError(null);

    // Sprawdź czy aplikacja ma przypisane CV z plikiem
    const cv = application.cvId ? getCVById(application.cvId) : undefined;
    if (!cv?.fileName) {
      setPdfError('Brak pliku CV przypisanego do tej aplikacji. Przypisz CV z plikiem PDF w edycji aplikacji.');
      return;
    }

    const ext = cv.fileName.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf') {
      setPdfError('Generator obsługuje tylko pliki PDF.');
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const url = await getCVFileUrl(cv.fileName);
      if (!url) {
        setPdfError('Nie udało się pobrać pliku CV.');
        return;
      }

      const response = await fetch(url);
      const pdfBytes = new Uint8Array(await response.arrayBuffer());

      // Buduj mapowania: placeholder URL → tracked URL
      // Każdy tracking link ma label (np. "LinkedIn") → placeholder = jo.placeholder/linkedin
      const replacements: PlaceholderReplacement[] = existingLinks.map(link => ({
        placeholder: getPlaceholderUrl(link.label),
        trackedUrl: trackUrl(link.token),
      }));

      console.log('Placeholder replacements:', replacements);

      // Diagnostyka — jakie linki są w PDF?
      const foundInPdf = await extractPdfLinks(pdfBytes.slice(0));
      console.log('Adnotacje znalezione w PDF:', foundInPdf);

      // Podmień placeholdery w adnotacjach PDF
      const { pdf: taggedPdf, replacedCount } = await replacePlaceholderLinks(pdfBytes, replacements);

      if (replacedCount === 0) {
        const placeholderList = replacements.map(r => r.placeholder).join(', ');
        setPdfError(
          `Nie znaleziono placeholderów w PDF.\n\n` +
          `Szukane: ${placeholderList}\n` +
          `Znalezione adnotacje: ${foundInPdf.length > 0 ? foundInPdf.join(', ') : 'brak'}\n\n` +
          `Wstaw placeholder URL-e z „Moje linki" jako hiperlinki w swoim CV (Canva, Word), potem prześlij PDF ponownie.`
        );
        return;
      }

      console.log(`✅ Podmieniono ${replacedCount} placeholderów w PDF`);

      const blob = new Blob([taggedPdf.buffer.slice(taggedPdf.byteOffset, taggedPdf.byteOffset + taggedPdf.byteLength)], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `CV_${application.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_tracked.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('PDF generation error:', err);
      setPdfError('Błąd przy generowaniu PDF. Sprawdź czy plik CV jest poprawnym PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Mapa token → liczba klików
  const clicksByToken = clicks.reduce<Record<string, TrackingClick[]>>((acc, click) => {
    if (!acc[click.token]) acc[click.token] = [];
    acc[click.token].push(click);
    return acc;
  }, {});

  const hasExistingLinks = existingLinks.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Śledzone linki — ${application.companyName}`}
      size="lg"
    >
      {isLoading ? (
        <div className="py-8 text-center text-slate-400">Ładowanie...</div>
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          {hasExistingLinks && (
            <div className="flex bg-dark-700 p-1 gap-1">
              <button
                onClick={() => setTab('links')}
                className={`flex-1 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  tab === 'links' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Link className="w-4 h-4" />
                Linki
                <CountBadge count={existingLinks.length} variant="default" />
              </button>
              <button
                onClick={() => setTab('clicks')}
                className={`flex-1 py-1.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  tab === 'clicks' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MousePointerClick className="w-4 h-4" />
                Kliknięcia
                {clicks.length > 0 && (
                  <CountBadge count={clicks.length} variant="success" />
                )}
              </button>
            </div>
          )}

          {/* Tab: Linki */}
          {(!hasExistingLinks || tab === 'links') && (
            <div className="space-y-4">
              {/* Istniejące linki */}
              {hasExistingLinks && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-300">Wygenerowane URL-e do CV</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleGeneratePdf}
                        disabled={isGeneratingPdf}
                        className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Pobierz PDF z podmienionymi linkami"
                      >
                        <FileDown className="w-3 h-3" />
                        {isGeneratingPdf ? 'Generuję...' : 'Pobierz PDF'}
                      </button>
                      <button
                        onClick={copyAllLinks}
                        className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Kopiuj wszystkie
                      </button>
                    </div>
                  </div>
                  {pdfError && (
                    <p className="text-xs text-danger-400 bg-danger-500/10 px-3 py-2">{pdfError}</p>
                  )}
                  {existingLinks.map(link => {
                    const linkClicks = clicksByToken[link.token] ?? [];
                    return (
                      <div key={link.id} className="bg-dark-700 p-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-200">{link.label}</span>
                            {linkClicks.length > 0 && (
                              <Badge variant="success" size="sm">
                                <Check className="w-3 h-3 mr-1" />
                                Kliknięty {linkClicks.length}×
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">→ {link.targetUrl}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a
                            href={trackUrl(link.token)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-green-400 transition-colors"
                            title="Testuj link (otwórz w przeglądarce)"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => copyToClipboard(link.token)}
                            className="p-1.5 text-slate-400 hover:text-primary-400 transition-colors"
                            title="Kopiuj URL"
                          >
                            {copiedToken === link.token ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Separator jeśli są już linki */}
              {hasExistingLinks && (
                <p className="text-xs text-slate-500 border-t border-dark-600 pt-3">
                  Dodaj kolejne linki:
                </p>
              )}

              {/* Form dodawania nowych linków */}
              {!hasExistingLinks && (
                <p className="text-sm text-slate-400">
                  Dodaj linki z Twojego CV — system zastąpi je trackowanymi URL-ami.
                  Wklej trackowany URL zamiast oryginalnego w swoim CV.
                </p>
              )}

              <div className="space-y-3">
                {linkInputs.map((input, index) => (
                  <div key={index} className="bg-dark-700/50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={input.preset}
                        onChange={e => updateLinkInput(index, 'preset', e.target.value)}
                        className="px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {PRESETS.map(p => (
                          <option key={p.key} value={p.key}>{p.label}</option>
                        ))}
                      </select>
                      {input.preset === 'custom' && (
                        <input
                          type="text"
                          value={input.label}
                          onChange={e => updateLinkInput(index, 'label', e.target.value)}
                          placeholder="Nazwa linku (np. Portfolio)"
                          className="flex-1 px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      )}
                      <button
                        onClick={() => removeLinkInput(index)}
                        className="p-1 text-slate-500 hover:text-danger-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="url"
                      value={input.targetUrl}
                      onChange={e => updateLinkInput(index, 'targetUrl', e.target.value)}
                      placeholder={PRESETS.find(p => p.key === input.preset)?.placeholder}
                      className="w-full px-2 py-1.5 bg-dark-600 text-slate-200 text-sm border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={addLinkInput}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-primary-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj link
                </button>
                <div className="flex-1" />
                <Button variant="secondary" onClick={onClose}>Zamknij</Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isSaving || linkInputs.every(l => !l.targetUrl.trim())}
                >
                  {isSaving ? 'Generuję...' : 'Generuj śledzone URL-e'}
                </Button>
              </div>
            </div>
          )}

          {/* Tab: Kliknięcia */}
          {hasExistingLinks && tab === 'clicks' && (
            <div className="space-y-3">
              {/* Nagłówek z odświeżaniem */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Kliknięcia są odświeżane co 30s automatycznie.</p>
                <button
                  onClick={refreshClicks}
                  disabled={isRefreshing}
                  className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 disabled:opacity-50"
                >
                  <Clock className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Sprawdzam...' : 'Odśwież teraz'}
                </button>
              </div>

              {clicks.length === 0 ? (
                <div className="py-6 text-center">
                  <MousePointerClick className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Brak kliknięć</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Pobierz otagowany PDF i wyślij rekruterowi.<br />
                    Otwórz link w przeglądarce (ikona <ExternalLink className="w-3 h-3 inline" /> w zakładce Linki) żeby przetestować.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-400">
                    Rekruter kliknął <span className="text-green-400 font-medium">{clicks.length}</span> {clicks.length === 1 ? 'link' : clicks.length < 5 ? 'linki' : 'linków'}
                  </p>

                  {/* Checklist linków */}
                  <div className="space-y-2">
                    {existingLinks.map(link => {
                      const linkClicks = clicksByToken[link.token] ?? [];
                      const lastClick = linkClicks[0];
                      return (
                        <div
                          key={link.id}
                          className={`p-3 border ${
                            linkClicks.length > 0
                              ? 'border-green-500/30 bg-green-500/5'
                              : 'border-dark-600 bg-dark-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {linkClicks.length > 0 ? (
                                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 flex-shrink-0 border border-slate-600 flex-shrink-0" />
                              )}
                              <span className={`text-sm font-medium ${
                                linkClicks.length > 0 ? 'text-green-400' : 'text-slate-400'
                              }`}>
                                {link.label}
                              </span>
                              {linkClicks.length > 1 && (
                                <span className="text-xs text-slate-500">{linkClicks.length}×</span>
                              )}
                            </div>
                            {lastClick && (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="w-3 h-3" />
                                {format(parseISO(lastClick.clickedAt), 'd MMM, HH:mm', { locale: pl })}
                              </div>
                            )}
                          </div>
                          {lastClick?.userAgent && (
                            <p className="mt-1 text-xs text-slate-600 truncate pl-6">
                              {lastClick.userAgent.slice(0, 60)}...
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Timeline kliknięć */}
                  <div className="mt-4 pt-4 border-t border-dark-600">
                    <p className="text-xs text-slate-500 mb-2">Historia kliknięć:</p>
                    <div className="space-y-1">
                      {clicks.map(click => {
                        const link = existingLinks.find(l => l.token === click.token);
                        return (
                          <div key={click.id} className="flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                              <ExternalLink className="w-3 h-3 text-green-400" />
                              <span>{link?.label ?? 'Nieznany'}</span>
                            </div>
                            <span className="text-slate-500">
                              {format(parseISO(click.clickedAt), 'd MMM yyyy, HH:mm', { locale: pl })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-dark-600">
                <button
                  onClick={() => setTab('links')}
                  className="text-xs text-slate-400 hover:text-primary-400 flex items-center gap-1"
                >
                  <Link className="w-3 h-3" />
                  Wróć do linków
                </button>
                <Button variant="secondary" onClick={onClose}>Zamknij</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
