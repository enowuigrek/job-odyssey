import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Filter,
  Calendar,
  Clock,
  Trash2,
  Edit,
  LayoutGrid,
  List,
  GripVertical,
  Building2,
  ChevronDown,
  ChevronUp,
  MapPin,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
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
  getInterviewStatusBadgeVariant,
  getInterviewStatusLabel,
  PageHeader,
  useConfirm,
} from '../components/ui';
import { Interview, InterviewStatus } from '../types';
import { format, parseISO, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';

const statusOptions = [
  { value: 'scheduled', label: 'Zaplanowana' },
  { value: 'waiting', label: 'Oczekiwanie' },
  { value: 'positive', label: 'Pozytywna' },
  { value: 'negative', label: 'Negatywna' },
];

// Kolejność kolumn w widoku Kanban
const kanbanColumns: InterviewStatus[] = ['scheduled', 'waiting', 'positive', 'negative'];

export function InterviewsPage() {
  const { state, dispatch } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState<InterviewStatus[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const { confirm, ConfirmDialog } = useConfirm();
  const [draggedInterview, setDraggedInterview] = useState<Interview | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<InterviewStatus | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const [formData, setFormData] = useState({
    applicationId: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    location: '',
    status: 'scheduled' as InterviewStatus,
    whatWentWell: '',
    whatWentWrong: '',
    notes: '',
  });

  // Sprawdź czy jest parametr addFor w URL (dodawanie rozmowy dla konkretnej aplikacji)
  useEffect(() => {
    const addForApp = searchParams.get('addFor');
    if (addForApp && state.applications.find(a => a.id === addForApp)) {
      setFormData(prev => ({
        ...prev,
        applicationId: addForApp,
        scheduledDate: new Date().toISOString().split('T')[0],
      }));
      setIsModalOpen(true);
      // Usuń parametr z URL
      setSearchParams({});
    }
  }, [searchParams, state.applications, setSearchParams]);

  // Listen for FAB click from Layout
  const openModalFab = useCallback(() => { if (state.applications.length > 0) openModal(); }, [state.applications.length]);
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === '/interviews') openModalFab();
    };
    window.addEventListener('fab-click', handler);
    return () => window.removeEventListener('fab-click', handler);
  }, [openModalFab]);

  const toggleStatusFilter = (status: InterviewStatus) => {
    setStatusFilters((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const filteredInterviews = useMemo(() => {
    return state.interviews
      .filter((interview) => {
        const app = state.applications.find((a) => a.id === interview.applicationId);
        const matchesSearch =
          app?.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          app?.position.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilters.length === 0 || statusFilters.includes(interview.status);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  }, [state.interviews, state.applications, searchQuery, statusFilters]);

  // Grupowanie rozmów według statusu dla widoku Kanban
  const interviewsByStatus = useMemo(() => {
    const grouped: Record<InterviewStatus, Interview[]> = {
      scheduled: [],
      waiting: [],
      positive: [],
      negative: [],
    };
    filteredInterviews.forEach((interview) => {
      grouped[interview.status].push(interview);
    });
    return grouped;
  }, [filteredInterviews]);

  const openModal = (interview?: Interview) => {
    if (interview) {
      setEditingInterview(interview);
      const dateTime = parseISO(interview.scheduledDate);
      setFormData({
        applicationId: interview.applicationId,
        scheduledDate: format(dateTime, 'yyyy-MM-dd'),
        scheduledTime: format(dateTime, 'HH:mm'),
        duration: interview.duration || 60,
        location: interview.location || '',
        status: interview.status,
        whatWentWell: interview.whatWentWell || '',
        whatWentWrong: interview.whatWentWrong || '',
        notes: interview.notes || '',
      });
    } else {
      setEditingInterview(null);
      setFormData({
        applicationId: state.applications[0]?.id || '',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '',
        duration: 60,
        location: '',
        status: 'scheduled',
        whatWentWell: '',
        whatWentWrong: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInterview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const scheduledDate = `${formData.scheduledDate}T${formData.scheduledTime || '09:00'}:00`;

    const interviewData = {
      applicationId: formData.applicationId,
      scheduledDate,
      duration: formData.duration,
      location: formData.location || undefined,
      status: formData.status,
      whatWentWell: formData.whatWentWell || undefined,
      whatWentWrong: formData.whatWentWrong || undefined,
      notes: formData.notes || undefined,
    };

    if (editingInterview) {
      dispatch({
        type: 'UPDATE_INTERVIEW',
        payload: {
          ...editingInterview,
          ...interviewData,
        },
      });
    } else {
      dispatch({
        type: 'ADD_INTERVIEW',
        payload: interviewData,
      });
    }

    closeModal();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Usuń rozmowę', message: 'Czy na pewno chcesz usunąć tę rozmowę?', confirmLabel: 'Usuń', variant: 'danger' });
    if (ok) {
      dispatch({ type: 'DELETE_INTERVIEW', payload: id });
    }
  };

  const handleStatusChange = (interview: Interview, newStatus: InterviewStatus) => {
    dispatch({
      type: 'UPDATE_INTERVIEW',
      payload: {
        ...interview,
        status: newStatus,
      },
    });
  };

  // Drag & drop handlers - używamy dataTransfer.setData dla niezawodności
  const handleDragStart = (e: React.DragEvent, interview: Interview) => {
    setDraggedInterview(interview);
    e.dataTransfer.setData('application/json', JSON.stringify(interview));
    e.dataTransfer.setData('text/plain', interview.id);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => {
      target.style.opacity = '0.5';
    });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedInterview(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, status: InterviewStatus) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: InterviewStatus) => {
    e.preventDefault();
    e.stopPropagation();

    const interviewId = e.dataTransfer.getData('text/plain');
    const interviewToMove = draggedInterview || state.interviews.find(i => i.id === interviewId);

    if (interviewToMove && interviewToMove.status !== newStatus) {
      handleStatusChange(interviewToMove, newStatus);
    }
    setDraggedInterview(null);
    setDragOverStatus(null);
  };

  // Komponent karty rozmowy
  const InterviewCard = ({ interview, compact = false, draggable = false }: { interview: Interview; compact?: boolean; draggable?: boolean }) => {
    const app = state.applications.find((a) => a.id === interview.applicationId);
    const interviewDate = parseISO(interview.scheduledDate);
    const isExpanded = expandedId === interview.id;
    const isTodayInterview = isToday(interviewDate) && interview.status === 'scheduled';

    const handleExpandClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleExpand(interview.id);
    };

    const cardContent = (
      <Card className={`hover:shadow-md transition-shadow ${isTodayInterview ? 'ring-2 ring-warning-400 bg-warning-500/10' : ''}`}>
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
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-white ${compact ? 'text-sm' : 'text-lg'} truncate`}>
                    {app?.companyName || 'Nieznana firma'}
                  </h3>
                  {isTodayInterview && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-warning-500 text-slate-900 uppercase">
                      Dziś
                    </span>
                  )}
                </div>
                <p className={`text-slate-300 ${compact ? 'text-xs' : 'text-sm'} mb-1 truncate`}>
                  {app?.position}
                </p>
                <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} text-slate-400`}>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(interviewDate, 'd MMM', { locale: pl })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(interviewDate, 'HH:mm')}
                  </span>
                </div>
                {!compact && (
                  <div className="mt-2">
                    <Badge variant={getInterviewStatusBadgeVariant(interview.status)}>
                      {getInterviewStatusLabel(interview.status)}
                    </Badge>
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
          </div>

          {/* Rozwinięte szczegóły */}
          {isExpanded && (
            <div className="px-3 pb-3 border-t border-dark-600">
              {/* Szybka zmiana statusu */}
              <div className="mt-3 mb-3">
                <p className="text-xs text-slate-400 mb-2">Zmień status:</p>
                <div className="flex flex-wrap gap-1">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(interview, opt.value as InterviewStatus);
                      }}
                      className={`px-2 py-1 text-xs transition-colors cursor-pointer ${
                        interview.status === opt.value
                          ? 'bg-primary-500 text-slate-900'
                          : 'bg-dark-700 text-slate-300 hover:bg-dark-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Szczegóły */}
              <div className="space-y-2 text-xs">
                {interview.duration && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    Czas trwania: {interview.duration} min
                  </div>
                )}

                {interview.location && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <a
                      href={interview.location.startsWith('http') ? interview.location : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={interview.location.startsWith('http') ? 'text-primary-400 hover:underline' : ''}
                    >
                      {interview.location.startsWith('http') ? 'Link do spotkania' : interview.location}
                    </a>
                  </div>
                )}

                {interview.whatWentWell && (
                  <div className="text-slate-400 bg-success-500/10 p-2 mt-2">
                    <span className="text-success-400 font-medium">Co poszło dobrze:</span>
                    <p className="mt-1 whitespace-pre-wrap">{interview.whatWentWell}</p>
                  </div>
                )}

                {interview.whatWentWrong && (
                  <div className="text-slate-400 bg-warning-500/10 p-2 mt-2">
                    <span className="text-warning-400 font-medium">Co mogło pójść lepiej:</span>
                    <p className="mt-1 whitespace-pre-wrap">{interview.whatWentWrong}</p>
                  </div>
                )}

                {interview.notes && (
                  <div className="text-slate-400 whitespace-pre-wrap bg-dark-700/50 p-2 mt-2">
                    {interview.notes}
                  </div>
                )}
              </div>

              {/* Akcje */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-600">
                {interview.location && interview.location.startsWith('http') && (
                  <a
                    href={interview.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-primary-400 hover:bg-dark-700 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Otwórz link
                  </a>
                )}
                <div className="flex-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(interview);
                  }}
                  className="p-1.5 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(interview.id);
                  }}
                  className="p-1.5 text-slate-500 hover:text-danger-400 hover:bg-danger-500/10 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
          onDragStart={(e) => handleDragStart(e, interview)}
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
          icon={MessageSquare}
          title="Rozmowy kwalifikacyjne"
          description="Śledź swoje rozmowy i wyciągaj wnioski"
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
                <Button onClick={() => openModal()} disabled={state.applications.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nowa rozmowa
                </Button>
              </div>
            </>
          }
        />
      </div>

      {state.applications.length === 0 && (
        <div className="bg-warning-500/10 border border-warning-500/30 p-4 text-warning-300">
          Najpierw dodaj aplikację, żeby móc dodać rozmowę kwalifikacyjną.
        </div>
      )}

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
        <div className="sm:hidden">
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
                  onClick={() => toggleStatusFilter(opt.value as InterviewStatus)}
                  className={`px-3 py-1 text-xs transition-colors cursor-pointer ${
                    statusFilters.includes(opt.value as InterviewStatus)
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
              onClick={() => toggleStatusFilter(opt.value as InterviewStatus)}
              className={`px-3 py-1 text-xs transition-colors cursor-pointer ${
                statusFilters.includes(opt.value as InterviewStatus)
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
          {filteredInterviews.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Brak rozmów"
              description={
                searchQuery
                  ? 'Nie znaleziono rozmów pasujących do filtrów'
                  : 'Dodaj swoją pierwszą rozmowę kwalifikacyjną'
              }
              action={
                !searchQuery && state.applications.length > 0 ? (
                  <Button onClick={() => openModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj rozmowę
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4">
              {filteredInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Widok Kanban - rozciąga się na całą pozostałą wysokość */}
      {viewMode === 'kanban' && (() => {
        const hasFilters = statusFilters.length > 0 || searchQuery.length > 0;
        const visibleColumns = hasFilters
          ? kanbanColumns.filter(s => interviewsByStatus[s].length > 0)
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
                      <Badge variant={getInterviewStatusBadgeVariant(status)} size="sm">
                        {getInterviewStatusLabel(status)}
                      </Badge>
                      <span className="text-xs text-slate-500">({interviewsByStatus[status].length})</span>
                    </div>
                  </div>
                  <div
                    className={`flex-1 overflow-y-auto kanban-scroll space-y-3 min-h-[200px] p-2 transition-colors ${
                      dragOverStatus === status ? 'bg-primary-500/10 border-2 border-dashed border-primary-500/50' : 'border-2 border-transparent'
                    }`}
                  >
                    {interviewsByStatus[status].length === 0 && dragOverStatus !== status ? (
                      <div className={`flex flex-col gap-1 ${state.applications.length === 0 ? 'opacity-40' : ''}`}>
                        <div className="w-full py-6 border-2 border-dashed border-dark-600 flex items-center justify-center">
                          <span className="text-xs text-slate-500">Brak rozmów</span>
                        </div>
                        <button
                          onClick={() => state.applications.length > 0 ? openModal() : undefined}
                          disabled={state.applications.length === 0}
                          className="w-full py-2 flex items-center justify-center bg-primary-500 text-slate-900 hover:bg-primary-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : interviewsByStatus[status].length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-primary-500/50">
                        Upuść tutaj
                      </div>
                    ) : (
                      <>
                        {interviewsByStatus[status].map((interview) => (
                          <InterviewCard key={interview.id} interview={interview} compact draggable />
                        ))}
                        <button
                          onClick={() => state.applications.length > 0 ? openModal() : undefined}
                          disabled={state.applications.length === 0}
                          className="w-full mt-1 py-2 flex items-center justify-center bg-primary-500 text-slate-900 hover:bg-primary-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
        title={editingInterview ? 'Edytuj rozmowę' : 'Nowa rozmowa'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Aplikacja *"
            options={state.applications.map((app) => ({
              value: app.id,
              label: `${app.companyName} - ${app.position}`,
            }))}
            value={formData.applicationId}
            onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Status"
              options={statusOptions}
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as InterviewStatus })
              }
            />
            <div className="flex items-end gap-2">
              <Input
                label="Czas (min)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="flex-1"
              />
              <div className="p-3 bg-dark-700 text-primary-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Data *"
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              required
            />
            <Input
              label="Godzina"
              type="time"
              value={formData.scheduledTime}
              onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
            />
          </div>

          <Input
            label="Link do spotkania"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="https://meet.google.com/..."
          />

          <div className="border-t border-dark-600 pt-4">
            <h3 className="font-medium text-slate-100 mb-3">Po rozmowie (opcjonalne)</h3>

            <Textarea
              label="Co poszło dobrze?"
              value={formData.whatWentWell}
              onChange={(e) => setFormData({ ...formData, whatWentWell: e.target.value })}
            />

            <Textarea
              label="Co mogło pójść lepiej?"
              value={formData.whatWentWrong}
              onChange={(e) => setFormData({ ...formData, whatWentWrong: e.target.value })}
              className="mt-3"
            />

            <Textarea
              label="Notatki"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-3"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-dark-600">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Anuluj
            </Button>
            <Button type="submit">
              {editingInterview ? 'Zapisz zmiany' : 'Dodaj rozmowę'}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog />
    </div>
  );
}
