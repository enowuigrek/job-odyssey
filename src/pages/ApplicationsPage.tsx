import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Filter,
  ChevronDown,
  Building2,
  Briefcase,
  Calendar,
  ExternalLink,
  Trash2,
  Edit,
  ChevronUp,
  LayoutGrid,
  List,
  GripVertical,
  MessageSquare,
  MousePointerClick,
  FileDown,
  Linkedin,
  Globe,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { TrackingLinksModal } from '../components/tracking/TrackingLinksModal';
import { useUserLinks } from '../hooks/useUserLinks';
import {
  createTrackingLinks,
  getTrackingLinksForApplication,
} from '../lib/db';
import { generateCV, getCVDataById, CV_PRINT_STORAGE_KEY } from '../lib/generateCV';
import {
  Button,
  Input,
  Card,
  CardBody,
  Badge,
  Modal,
  EmptyState,
  Select,
  Textarea,
  getStatusBadgeVariant,
  getStatusLabel,
  PageHeader,
  useConfirm,
} from '../components/ui';
import { JobApplication, ApplicationStatus } from '../types';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

const statusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: 'saved', label: 'Zapisana' },
  { value: 'applied', label: 'Wysłana' },
  { value: 'cv_viewed', label: 'CV przeglądane' },
  { value: 'interview', label: 'Zaproszenie' },
  { value: 'pending', label: 'Oczekiwanie' },
  { value: 'rejected_no_interview', label: 'Odmowa' },
  { value: 'rejected_after_interview', label: 'Odmowa po rozm.' },
  { value: 'offer_declined', label: 'Odrzuciłem ofertę' },
  { value: 'withdrawn', label: 'Wycofana' },
  { value: 'success', label: 'Sukces' },
];

// Kolejność kolumn w widoku Kanban
const kanbanColumns: ApplicationStatus[] = [
  'saved',
  'applied',
  'cv_viewed',
  'interview',
  'pending',
  'success',
  'rejected_no_interview',
  'rejected_after_interview',
  'offer_declined',
  'withdrawn',
];

/** Auto-detect source from job URL domain */
function detectSourceFromUrl(url: string): string {
  if (!url) return '';
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const sources: Record<string, string> = {
      'linkedin.com': 'LinkedIn',
      'pracuj.pl': 'Pracuj.pl',
      'indeed.com': 'Indeed',
      'nofluffjobs.com': 'No Fluff Jobs',
      'justjoin.it': 'Just Join IT',
      'bulldogjob.pl': 'Bulldogjob',
      'theprotocol.it': 'The:Protocol',
      'rocket-jobs.pl': 'Rocket Jobs',
      'glassdoor.com': 'Glassdoor',
      'olx.pl': 'OLX',
    };
    for (const [domain, name] of Object.entries(sources)) {
      if (hostname.includes(domain)) return name;
    }
    return hostname;
  } catch {
    return '';
  }
}

/** Source icon component */
function SourceIcon({ url, className = 'w-4 h-4' }: { url?: string; className?: string }) {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    if (hostname.includes('linkedin.com')) {
      return <Linkedin className={`${className} text-[#0A66C2]`} />;
    }
    // For other sources, show a small favicon or globe
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
        alt=""
        className={className}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  } catch {
    return <Globe className={`${className} text-slate-500`} />;
  }
}

export function ApplicationsPage() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const { links: userLinks } = useUserLinks();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<ApplicationStatus[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const { confirm, ConfirmDialog } = useConfirm();
  const [draggedApp, setDraggedApp] = useState<JobApplication | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<ApplicationStatus | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Otwórz tracking modal jeśli przyszliśmy z powiadomienia
  useEffect(() => {
    const openFor = (location.state as { openTrackingFor?: string } | null)?.openTrackingFor;
    if (openFor) {
      const app = state.applications.find(a => a.id === openFor);
      if (app) {
        setExpandedId(openFor);
        setTrackingApp(app);
      }
      // Wyczyść state żeby nie otwierało się ponownie
      navigate('/applications', { replace: true, state: {} });
    }
  }, [location.state, state.applications, navigate]);
  // Listen for FAB click from Layout
  const openModalCallback = useCallback(() => openModal(), []);
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === '/applications') openModalCallback();
    };
    window.addEventListener('fab-click', handler);
    return () => window.removeEventListener('fab-click', handler);
  }, [openModalCallback]);

  const [interviewPromptApp, setInterviewPromptApp] = useState<JobApplication | null>(null);
  const [trackingApp, setTrackingApp] = useState<JobApplication | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    position: '',
    jobUrl: '',
    location: '',
    salaryOffered: '',
    salaryExpected: '',
    status: 'saved' as ApplicationStatus,
    appliedDate: new Date().toISOString().split('T')[0],
    notes: '',
    source: '',
    cvId: '' as string | undefined,
  });
  const [autoSource, setAutoSource] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  /** Generuj CV PDF z śledzeniem linków */
  const handleGeneratePdf = async () => {
    if (!editingApplication || !user) return;

    setPdfError(null);
    setPdfSuccess(false);
    setIsGeneratingPdf(true);

    try {
      // 1. Pobierz/utwórz tracking linki
      let trackingLinks = await getTrackingLinksForApplication(editingApplication.id);
      if (trackingLinks.length === 0 && userLinks.length > 0) {
        const validLinks = userLinks.filter(l => l.url.trim());
        if (validLinks.length > 0) {
          trackingLinks = await createTrackingLinks(validLinks.map(l => ({
            userId: user.id,
            applicationId: editingApplication.id,
            token: `${editingApplication.id.slice(0, 6)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            label: l.label,
            targetUrl: l.url.trim(),
          })));
        }
      }
      if (trackingLinks.length === 0) {
        setPdfError('Brak linków do śledzenia. Dodaj linki w „Moje linki".');
        return;
      }

      // 2. Zapisz dane i przejdź do generatora
      generateCV(trackingLinks);
      navigate('/cv-generator');
    } catch (err) {
      console.error('PDF generation error:', err);
      setPdfError('Błąd przy generowaniu PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const filteredApplications = useMemo(() => {
    return state.applications
      .filter((app) => {
        const matchesSearch =
          app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app.position.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(app.status);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [state.applications, searchQuery, statusFilters]);

  const toggleStatusFilter = (status: ApplicationStatus) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Grupowanie aplikacji według statusu dla widoku Kanban
  const applicationsByStatus = useMemo(() => {
    const grouped: Record<ApplicationStatus, JobApplication[]> = {
      saved: [],
      applied: [],
      cv_viewed: [],
      interview: [],
      pending: [],
      rejected_no_interview: [],
      rejected_after_interview: [],
      offer_declined: [],
      withdrawn: [],
      success: [],
    };
    filteredApplications.forEach((app) => {
      grouped[app.status].push(app);
    });
    return grouped;
  }, [filteredApplications]);

  const openModal = (application?: JobApplication, defaultStatus?: ApplicationStatus) => {
    if (application) {
      setEditingApplication(application);
      setFormData({
        companyName: application.companyName,
        position: application.position,
        jobUrl: application.jobUrl || '',
        location: application.location || '',
        salaryOffered: application.salaryOffered || '',
        salaryExpected: application.salaryExpected || '',
        status: application.status,
        appliedDate: application.appliedDate || '',
        notes: application.notes || '',
        source: application.source || '',
        cvId: application.cvId || '',
      });
    } else {
      setEditingApplication(null);
      const defaultCv = state.cvs.find(cv => cv.isDefault);
      setFormData({
        companyName: '',
        position: '',
        jobUrl: '',
        location: '',
        salaryOffered: '',
        salaryExpected: '',
        status: defaultStatus || 'saved',
        appliedDate: new Date().toISOString().split('T')[0],
        notes: '',
        source: '',
        cvId: defaultCv?.id || '',
      });
      setAutoSource('');
    }
    setPdfError(null);
    setPdfSuccess(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingApplication(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-detect source from URL if not set manually
    const finalData = {
      ...formData,
      source: formData.source || detectSourceFromUrl(formData.jobUrl),
    };

    if (editingApplication) {
      dispatch({
        type: 'UPDATE_APPLICATION',
        payload: {
          ...editingApplication,
          ...finalData,
        },
      });
    } else {
      dispatch({
        type: 'ADD_APPLICATION',
        payload: finalData,
      });
    }

    closeModal();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Usuń aplikację',
      message: 'Czy na pewno chcesz usunąć tę aplikację? Usunięte zostaną również powiązane rozmowy.',
      confirmLabel: 'Usuń',
      variant: 'danger',
    });
    if (!ok) return;
    dispatch({ type: 'DELETE_APPLICATION', payload: id });
  };

  const handleStatusChange = (app: JobApplication, newStatus: ApplicationStatus, skipInterviewPrompt = false) => {
    dispatch({
      type: 'UPDATE_APPLICATION',
      payload: {
        ...app,
        status: newStatus,
      },
    });

    // Pokaż prompt o dodanie rozmowy przy zmianie na "interview"
    if (newStatus === 'interview' && !skipInterviewPrompt) {
      setInterviewPromptApp(app);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Drag & drop handlers - używamy dataTransfer.setData dla niezawodności
  const handleDragStart = (e: React.DragEvent, app: JobApplication) => {
    setDraggedApp(app);
    e.dataTransfer.setData('application/json', JSON.stringify(app));
    e.dataTransfer.setData('text/plain', app.id);
    e.dataTransfer.effectAllowed = 'move';
    // Dodaj nieco opóźnienia żeby element był widoczny podczas przeciągania
    const target = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => {
      target.style.opacity = '0.5';
    });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedApp(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Tylko resetuj jeśli opuszczamy do elementu poza kontenerem
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: ApplicationStatus) => {
    e.preventDefault();
    e.stopPropagation();

    // Pobierz dane z dataTransfer jako backup
    const appId = e.dataTransfer.getData('text/plain');
    const appToMove = draggedApp || state.applications.find(a => a.id === appId);

    if (appToMove && appToMove.status !== newStatus) {
      handleStatusChange(appToMove, newStatus);
    }
    setDraggedApp(null);
    setDragOverStatus(null);
  };

  // Komponent karty aplikacji używany w obu widokach
  const ApplicationCard = ({ app, compact = false, draggable = false }: { app: JobApplication; compact?: boolean; draggable?: boolean }) => {
    const isExpanded = expandedId === app.id;
    const interviews = state.interviews.filter((i) => i.applicationId === app.id);

    const handleExpandClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleExpand(app.id);
    };

    const cardContent = (
      <Card className="transition-shadow">
        <CardBody className="p-0">
          {/* Główna sekcja - klikalna aby rozwinąć */}
          <div
            className={`${compact ? 'p-3' : 'p-4'} cursor-pointer`}
            onClick={handleExpandClick}
          >
            <div className="flex items-start justify-between">
              {draggable && (
                <div className="mr-2 text-slate-400 flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
                  <GripVertical className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Source icon from job URL */}
                  <SourceIcon url={app.jobUrl} className="w-4 h-4 flex-shrink-0" />
                  <h3 className={`font-semibold text-white ${compact ? 'text-sm' : 'text-lg'} truncate`}>
                    {app.companyName}
                  </h3>
                  {!compact && (
                    <Badge variant={getStatusBadgeVariant(app.status)}>
                      {getStatusLabel(app.status)}
                    </Badge>
                  )}
                </div>

                {app.position && (
                  <div className={`${compact ? 'text-xs text-slate-400' : 'text-sm text-slate-400'} truncate`}>
                    {app.position}
                  </div>
                )}
              </div>

              {/* Ikona rozwijania */}
              <div className="flex items-center justify-center w-6 h-6 text-slate-500 flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* Compact: icon-only action bar */}
            {compact && !isExpanded && (
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-dark-600/50">
                {app.jobUrl && (
                  <a
                    href={app.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-slate-500 hover:text-primary-400 transition-colors cursor-pointer"
                    title="Otwórz ofertę"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setTrackingApp(app); }}
                  className="p-1.5 text-slate-500 hover:text-green-400 transition-colors cursor-pointer"
                  title="Śledź CV"
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); openModal(app); }}
                  className="p-1.5 text-slate-500 hover:text-primary-400 transition-colors cursor-pointer"
                  title="Edytuj"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }}
                  className="p-1.5 text-slate-500 hover:text-danger-400 transition-colors cursor-pointer"
                  title="Usuń"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Rozwinięte szczegóły */}
          {isExpanded && (
            <div className="px-4 pb-4 border-t border-dark-600">
              {/* Szybka zmiana statusu */}
              <div className="mt-4 mb-4">
                <label className="text-xs text-slate-400 mb-1 block">Zmień status:</label>
                <select
                  value={app.status}
                  onChange={(e) => { e.stopPropagation(); handleStatusChange(app, e.target.value as ApplicationStatus); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 bg-dark-700 text-slate-100 border border-dark-600 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Szczegóły */}
              <div className="space-y-3 text-sm">
                {app.appliedDate && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    {format(parseISO(app.appliedDate), 'd MMMM yyyy', { locale: pl })}
                  </div>
                )}

                {app.source && (
                  <div className="text-slate-400">
                    <span className="text-slate-500">Źródło:</span> {app.source}
                  </div>
                )}

                {app.notes && (
                  <div className="text-slate-400 whitespace-pre-wrap bg-dark-700/50 p-3 mt-2">
                    {app.notes}
                  </div>
                )}

                {/* Powiązane rozmowy */}
                {interviews.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dark-600">
                    <p className="text-xs text-slate-400 mb-2">Rozmowy ({interviews.length}):</p>
                    <div className="space-y-2">
                      {interviews.map((interview) => (
                        <div
                          key={interview.id}
                          className="flex items-center justify-between text-xs bg-dark-700/50 p-2"
                        >
                          <span className="text-slate-300">
                            {format(parseISO(interview.scheduledDate), 'd MMM yyyy, HH:mm', { locale: pl })}
                          </span>
                          <Badge variant={interview.status === 'positive' ? 'success' : interview.status === 'negative' ? 'danger' : interview.status === 'waiting' ? 'warning' : 'info'} size="sm">
                            {interview.status === 'scheduled' ? 'Zaplanowana' : interview.status === 'waiting' ? 'Oczekiwanie' : interview.status === 'positive' ? 'Pozytywna' : 'Negatywna'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Akcje — icon-only */}
              <div className="flex items-center gap-1 mt-4 pt-4 border-t border-dark-600">
                {app.jobUrl && (
                  <a
                    href={app.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-slate-500 hover:text-primary-400 transition-colors cursor-pointer"
                    title="Otwórz ofertę"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setTrackingApp(app); }}
                  className="p-2 text-slate-500 hover:text-green-400 transition-colors cursor-pointer"
                  title="Śledź CV"
                >
                  <MousePointerClick className="w-4 h-4" />
                </button>
                <div className="flex-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); openModal(app); }}
                  className="p-2 text-slate-500 hover:text-primary-400 transition-colors cursor-pointer"
                  title="Edytuj"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }}
                  className="p-2 text-slate-500 hover:text-danger-400 transition-colors cursor-pointer"
                  title="Usuń"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    );

    if (draggable) {
      return (
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, app)}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing"
        >
          {cardContent}
        </div>
      );
    }

    return cardContent;
  };

  return (
    <div className={`${viewMode === 'kanban' ? 'flex flex-col h-full -mx-4 -mt-2 px-4 pt-2 md:-mx-8 md:-mt-10 md:px-8 md:pt-10' : 'space-y-6'}`}>
      {/* Header */}
      <div className={viewMode === 'kanban' ? 'mb-6' : ''}>
        <PageHeader
          icon={Briefcase}
          title="Aplikacje"
          description="Zarządzaj swoimi aplikacjami o pracę"
          actions={
            <>
              <div className="flex bg-dark-700">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 cursor-pointer ${viewMode === 'list' ? 'bg-primary-500 text-slate-900' : 'text-slate-400 hover:text-slate-100'}`}
                  title="Widok listy"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 cursor-pointer ${viewMode === 'kanban' ? 'bg-primary-500 text-slate-900' : 'text-slate-400 hover:text-slate-100'}`}
                  title="Widok Kanban"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
              <div className="hidden md:block">
                <Button onClick={() => openModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nowa aplikacja
                </Button>
              </div>
            </>
          }
        />
      </div>

      {/* Filters */}
      <div className={`space-y-2 ${viewMode === 'kanban' ? 'mb-4' : ''}`}>
        <input
          type="text"
          placeholder="Szukaj po firmie lub stanowisku..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-dark-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        {/* Mobile: toggle button */}
        <div className="sm:hidden" ref={filtersRef}>
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-dark-700 text-slate-300 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            Filtruj
            {statusFilters.length > 0 && (
              <span className="bg-primary-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5">
                {statusFilters.length}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>
          {filtersOpen && (
            <div className="mt-2 flex flex-wrap gap-2 p-3 bg-dark-800 border border-dark-600">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleStatusFilter(opt.value)}
                  className={`px-3 py-1 text-xs transition-colors cursor-pointer ${
                    statusFilters.includes(opt.value)
                      ? 'bg-primary-500 text-slate-900'
                      : 'bg-dark-700 text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {statusFilters.length > 0 && (
                <button
                  onClick={() => { setStatusFilters([]); setFiltersOpen(false); }}
                  className="px-3 py-1 text-xs text-slate-500 cursor-pointer"
                >
                  Wyczyść
                </button>
              )}
            </div>
          )}
        </div>

        {/* Desktop: chips inline */}
        <div className="hidden sm:flex flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleStatusFilter(opt.value)}
              className={`px-3 py-1 text-xs transition-colors cursor-pointer ${
                statusFilters.includes(opt.value)
                  ? 'bg-primary-500 text-slate-900'
                  : 'bg-dark-700 text-slate-400 hover:text-slate-100 hover:bg-dark-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {statusFilters.length > 0 && (
            <button
              onClick={() => setStatusFilters([])}
              className="px-3 py-1 text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Wyczyść
            </button>
          )}
        </div>
      </div>

      {/* Widok listy */}
      {viewMode === 'list' && (
        <>
          {filteredApplications.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Brak aplikacji"
              description={
                searchQuery || statusFilters.length > 0
                  ? 'Nie znaleziono aplikacji pasujących do filtrów'
                  : 'Dodaj swoją pierwszą aplikację o pracę'
              }
              action={
                !searchQuery && statusFilters.length === 0 ? (
                  <Button onClick={() => openModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj aplikację
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4">
              {filteredApplications.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Widok Kanban - rozciąga się na całą pozostałą wysokość */}
      {viewMode === 'kanban' && (() => {
        // When filters active, hide empty columns
        const hasFilters = statusFilters.length > 0 || searchQuery.length > 0;
        const visibleColumns = hasFilters
          ? kanbanColumns.filter(s => applicationsByStatus[s].length > 0)
          : kanbanColumns;

        return (
          <div className="flex-1 overflow-x-auto overflow-y-hidden kanban-scroll -mx-4 px-4 md:-mx-8 md:px-8 -mb-10">
            <div className="flex gap-3 h-full pb-4" style={{ minWidth: 'max-content' }}>
              {visibleColumns.map((status) => (
                <div
                  key={status}
                  className="w-[calc(100vw-2rem)] md:w-80 flex-shrink-0 flex flex-col h-full"
                  onDragOver={(e) => handleDragOver(e, status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="bg-dark-800 p-3 mb-2 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(status)} size="sm">
                        {getStatusLabel(status)}
                      </Badge>
                      <span className="text-xs text-slate-500">({applicationsByStatus[status].length})</span>
                    </div>
                  </div>
                  <div
                    className={`flex-1 overflow-y-auto kanban-scroll space-y-3 min-h-[200px] p-2 transition-colors ${
                      dragOverStatus === status ? 'bg-primary-500/10 border-2 border-dashed border-primary-500/50' : 'border-2 border-transparent'
                    }`}
                  >
                    {applicationsByStatus[status].length === 0 && dragOverStatus !== status ? (
                      <div className="flex flex-col gap-1">
                        <div className="w-full py-6 border-2 border-dashed border-dark-600 flex items-center justify-center">
                          <span className="text-xs text-slate-500">Brak aplikacji</span>
                        </div>
                        <button
                          onClick={() => openModal(undefined, status)}
                          className="w-full py-2 flex items-center justify-center bg-primary-500 text-slate-900 hover:bg-primary-400 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : applicationsByStatus[status].length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-primary-500/50">
                        Upuść tutaj
                      </div>
                    ) : (
                      <>
                        {applicationsByStatus[status].map((app) => (
                          <ApplicationCard key={app.id} app={app} compact draggable />
                        ))}
                        <button
                          onClick={() => openModal(undefined, status)}
                          className="w-full mt-1 py-2 flex items-center justify-center bg-primary-500 text-slate-900 hover:bg-primary-400 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingApplication ? 'Edytuj aplikację' : 'Nowa aplikacja'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Firma (wymagana) + Stanowisko (opcjonalne) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Firma *"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
            <Input
              label="Stanowisko"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="np. Frontend Developer"
            />
          </div>

          {/* Link do oferty + auto-detected source */}
          <div>
            <Input
              label="Link do oferty"
              type="url"
              value={formData.jobUrl}
              onChange={(e) => {
                const url = e.target.value;
                setFormData({ ...formData, jobUrl: url });
                setAutoSource(detectSourceFromUrl(url));
              }}
              placeholder="https://..."
            />
            {autoSource && !formData.source && (
              <p className="mt-1 text-xs text-slate-500">
                Źródło: <span className="text-primary-400">{autoSource}</span> (auto)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={statusOptions}
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as ApplicationStatus })
              }
            />
            <Input
              label="Data aplikacji"
              type="date"
              value={formData.appliedDate}
              onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
            />
          </div>

          {/* CV + Generuj PDF */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              CV do tej aplikacji
            </label>
            <div className="flex gap-2">
              <select
                value={formData.cvId || ''}
                onChange={(e) => setFormData({ ...formData, cvId: e.target.value || undefined })}
                className="flex-1 px-3 py-2 bg-dark-700 text-slate-100 border border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">— Bez CV —</option>
                {state.cvs.map(cv => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name}{cv.fileName ? ' 📎' : ''}{cv.isDefault ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </div>
            {formData.cvId && !state.cvs.find(cv => cv.id === formData.cvId)?.fileName && (
              <p className="text-xs text-amber-400">
                To CV nie ma pliku PDF — nie można wygenerować otagowanego PDF.
              </p>
            )}
            {formData.cvId && getCVDataById(formData.cvId) && (
              <button
                type="button"
                onClick={() => {
                  const cvData = getCVDataById(formData.cvId!);
                  if (cvData) {
                    localStorage.setItem(CV_PRINT_STORAGE_KEY, JSON.stringify(cvData));
                    navigate('/cv-generator');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary-500 hover:bg-primary-400 text-slate-900 transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                Podgląd / pobierz CV
              </button>
            )}
          </div>

          <Textarea
            label="Notatki"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Dodatkowe informacje..."
          />

          {/* Generuj otagowane CV — tylko w trybie edycji */}
          {editingApplication && (
            <div className="space-y-2 pt-3 border-t border-dark-600">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Otagowane CV</label>
                <button
                  type="button"
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  {isGeneratingPdf ? 'Generuję...' : 'Pobierz otagowane CV'}
                </button>
              </div>
              {pdfError && (
                <p className="text-xs text-danger-400 bg-danger-500/10 px-3 py-2 whitespace-pre-wrap">{pdfError}</p>
              )}

              <p className="text-[11px] text-slate-500">
                Generuje CV z linkami śledzącymi dla tej aplikacji.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-dark-600">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Anuluj
            </Button>
            <Button type="submit">
              {editingApplication ? 'Zapisz zmiany' : 'Dodaj aplikację'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal - pytanie o dodanie rozmowy */}
      <Modal
        isOpen={!!interviewPromptApp}
        onClose={() => setInterviewPromptApp(null)}
        title="Dodać termin rozmowy?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-slate-300">
            <MessageSquare className="w-8 h-8 text-primary-400" />
            <p>
              Zmieniono status na <strong className="text-primary-400">Zaproszenie</strong>.
              <br />
              Czy chcesz od razu dodać termin rozmowy?
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-600">
            <Button variant="secondary" onClick={() => setInterviewPromptApp(null)}>
              Nie
            </Button>
            <Button
              onClick={() => {
                const appId = interviewPromptApp?.id;
                setInterviewPromptApp(null);
                navigate(`/interviews?addFor=${appId}`);
              }}
            >
              Tak, dodaj rozmowę
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tracking Links Modal */}
      {trackingApp && (
        <TrackingLinksModal
          isOpen={!!trackingApp}
          onClose={() => setTrackingApp(null)}
          application={trackingApp}
        />
      )}

      <ConfirmDialog />
    </div>
  );
}
