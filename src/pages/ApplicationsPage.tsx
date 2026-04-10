import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Filter,
  ChevronDown,
  Building2,
  Briefcase,
  MapPin,
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
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { TrackingLinksModal } from '../components/tracking/TrackingLinksModal';
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

export function ApplicationsPage() {
  const { state, dispatch } = useApp();
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

  const openModal = (application?: JobApplication) => {
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
      // Domyślnie wybierz domyślne CV
      const defaultCv = state.cvs.find(cv => cv.isDefault);
      setFormData({
        companyName: '',
        position: '',
        jobUrl: '',
        location: '',
        salaryOffered: '',
        salaryExpected: '',
        status: 'saved',
        appliedDate: new Date().toISOString().split('T')[0],
        notes: '',
        source: '',
        cvId: defaultCv?.id || '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingApplication(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingApplication) {
      dispatch({
        type: 'UPDATE_APPLICATION',
        payload: {
          ...editingApplication,
          ...formData,
        },
      });
    } else {
      dispatch({
        type: 'ADD_APPLICATION',
        payload: formData,
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
      <Card className="hover:shadow-md transition-shadow">
        <CardBody className="p-0">
          {/* Główna sekcja - klikalna aby rozwinąć */}
          <div
            className={`${compact ? 'p-3' : 'p-4'} hover:bg-dark-700 transition-colors cursor-pointer`}
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
                  <h3 className={`font-semibold text-white ${compact ? 'text-sm' : 'text-lg'} truncate`}>
                    {app.position}
                  </h3>
                  {!compact && (
                    <Badge variant={getStatusBadgeVariant(app.status)}>
                      {getStatusLabel(app.status)}
                    </Badge>
                  )}
                </div>

                <div className={`flex items-center gap-2 ${compact ? 'text-xs text-slate-300' : 'text-sm text-slate-400'}`}>
                  <span className="flex items-center gap-1 truncate">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    {app.companyName}
                  </span>
                  {!compact && app.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {app.location}
                    </span>
                  )}
                </div>
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
                    Data aplikacji: {format(parseISO(app.appliedDate), 'd MMMM yyyy', { locale: pl })}
                  </div>
                )}

                {app.location && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    {app.location}
                  </div>
                )}

                {(app.salaryOffered || app.salaryExpected) && (
                  <div className="flex gap-4 text-slate-400">
                    {app.salaryOffered && (
                      <span>
                        <span className="text-slate-500">W ofercie:</span> {app.salaryOffered}
                      </span>
                    )}
                    {app.salaryExpected && (
                      <span>
                        <span className="text-slate-500">Oczekiwane:</span> {app.salaryExpected}
                      </span>
                    )}
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

              {/* Akcje */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dark-600">
                {app.jobUrl && (
                  <a
                    href={app.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-primary-400 hover:bg-dark-700 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Otwórz ofertę
                  </a>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setTrackingApp(app); }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-green-400 hover:bg-green-500/10 transition-colors cursor-pointer"
                  title="Śledzone linki CV"
                >
                  <MousePointerClick className="w-4 h-4" />
                  Śledź CV
                </button>
                <div className="flex-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(app);
                  }}
                  className="p-2 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 cursor-pointer"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(app.id);
                  }}
                  className="p-2 text-slate-500 hover:text-danger-400 hover:bg-danger-500/10 cursor-pointer"
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
    <div className={`${viewMode === 'kanban' ? 'flex flex-col h-full -m-8 -mt-10 p-8 pt-10' : 'space-y-6'}`}>
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
              <Button onClick={() => openModal()}>
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nowa aplikacja</span>
              </Button>
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
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden kanban-scroll -mx-4 px-4 md:-mx-8 md:px-8 -mb-10">
          <div className="flex gap-3 h-full pb-4" style={{ minWidth: 'max-content' }}>
            {kanbanColumns.map((status) => (
              <div
                key={status}
                className="w-72 md:w-80 flex-shrink-0 flex flex-col h-full"
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
                  {applicationsByStatus[status].length === 0 ? (
                    <div className={`text-center py-8 text-slate-500 text-sm ${
                      dragOverStatus !== status ? 'border-2 border-dashed border-dark-600' : ''
                    }`}>
                      {dragOverStatus === status ? 'Upuść tutaj' : 'Brak aplikacji'}
                    </div>
                  ) : (
                    applicationsByStatus[status].map((app) => (
                      <ApplicationCard key={app.id} app={app} compact draggable />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingApplication ? 'Edytuj aplikację' : 'Nowa aplikacja'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Firma *"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
            <Input
              label="Stanowisko *"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Lokalizacja"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <Input
              label="Źródło"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="LinkedIn, Pracuj.pl..."
            />
          </div>

          <Input
            label="Link do oferty"
            type="url"
            value={formData.jobUrl}
            onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Wynagrodzenie w ofercie"
              value={formData.salaryOffered}
              onChange={(e) => setFormData({ ...formData, salaryOffered: e.target.value })}
              placeholder="15 000 - 20 000 PLN"
            />
            <Input
              label="Moje oczekiwania"
              value={formData.salaryExpected}
              onChange={(e) => setFormData({ ...formData, salaryExpected: e.target.value })}
              placeholder="18 000 PLN"
            />
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

          {/* Wybór CV */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              CV do tej aplikacji
            </label>
            <select
              value={formData.cvId || ''}
              onChange={(e) => setFormData({ ...formData, cvId: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-dark-700 text-slate-100 border border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">— Bez CV —</option>
              {state.cvs.map(cv => (
                <option key={cv.id} value={cv.id}>
                  {cv.name}{cv.fileName ? ' 📎' : ''}{cv.isDefault ? ' ★' : ''}
                </option>
              ))}
            </select>
            {formData.cvId && !state.cvs.find(cv => cv.id === formData.cvId)?.fileName && (
              <p className="mt-1 text-xs text-amber-400">
                To CV nie ma załączonego pliku PDF — nie będzie można wygenerować otagowanego PDF.
              </p>
            )}
          </div>

          <Textarea
            label="Notatki"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Dodatkowe informacje..."
          />

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
