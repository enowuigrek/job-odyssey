import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Star, Trash2, Edit, Tag, Upload, Download, FolderOpen, PenLine } from 'lucide-react';

import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { getCVDataById } from '../lib/generateCV';
import {
  Button,
  Input,
  Card,
  CardBody,
  Badge,
  Modal,
  EmptyState,
  Textarea,
  PageHeader,
  useConfirm,
} from '../components/ui';
import { CV } from '../types';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { openDataFolder } from '../utils/storage';
import { uploadCVFile, getCVFileUrl, deleteCVFileFromStorage } from '../lib/db';
export function CVPage() {
  const { state, dispatch, isElectronApp } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCV, setEditingCV] = useState<CV | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  // Listen for FAB click from Layout
  const openModalFab = useCallback(() => openModal(), []);
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === '/cv') openModalFab();
    };
    window.addEventListener('fab-click', handler);
    return () => window.removeEventListener('fab-click', handler);
  }, [openModalFab]);

  const [formData, setFormData] = useState({
    name: '',
    targetPosition: '',
    keywords: '',
    notes: '',
    isDefault: false,
  });

  const filteredCVs = useMemo(() => {
    return state.cvs
      .filter((cv) => {
        const matchesSearch =
          cv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cv.targetPosition?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cv.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch;
      })
      .sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [state.cvs, searchQuery]);

  const openModal = (cv?: CV) => {
    if (cv) {
      setEditingCV(cv);
      setFormData({
        name: cv.name,
        targetPosition: cv.targetPosition || '',
        keywords: cv.keywords?.join(', ') || '',
        notes: cv.notes || '',
        isDefault: cv.isDefault,
      });
      setUploadingFile(null);
    } else {
      setEditingCV(null);
      setFormData({
        name: '',
        targetPosition: '',
        keywords: '',
        notes: '',
        isDefault: state.cvs.length === 0,
      });
      setUploadingFile(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCV(null);
    setUploadingFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(file);
      if (!formData.name) {
        setFormData({ ...formData, name: file.name.replace(/\.[^.]+$/, '') });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError(null);

    // Plik wymagany przy nowym CV
    if (!editingCV && !uploadingFile) {
      setFormError('Dodaj plik CV (PDF, DOC, DOCX) — bez pliku nie ma co śledzić.');
      return;
    }

    setIsUploading(true);

    let fileName: string | undefined = editingCV?.fileName;

    let newCvId: string | undefined;

    if (uploadingFile && user) {
      // Użyj timestamp jako unikalnej nazwy — sanityzuj (brak spacji i polskich znaków)
      const safeName = uploadingFile.name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // usuń polskie znaki
        .replace(/\s+/g, '_')                              // spacje → podkreślniki
        .replace(/[^a-zA-Z0-9._-]/g, '');                 // tylko bezpieczne znaki
      const uniqueFileName = `${Date.now()}_${safeName}`;

      // Usuń stary plik jeśli zastępujemy
      if (editingCV?.fileName) {
        await deleteCVFileFromStorage(editingCV.fileName);
      }

      const arrayBuffer = await uploadingFile.arrayBuffer();
      const result = await uploadCVFile(user.id, 'files', uniqueFileName, new Blob([arrayBuffer], { type: uploadingFile.type }));
      if (!result || result.error) {
        setFormError(`Błąd przy upload pliku: ${result?.error ?? 'nieznany błąd'}. Sprawdź konsolę (F12).`);
        setIsUploading(false);
        return;
      }
      fileName = result.path;
    }

    const cvData = {
      name: formData.name,
      targetPosition: formData.targetPosition || undefined,
      keywords: formData.keywords
        ? formData.keywords.split(',').map((k) => k.trim().toLowerCase())
        : undefined,
      notes: formData.notes || undefined,
      isDefault: formData.isDefault,
      fileName,
    };

    // Placeholder approach — nie potrzeba wykrywania linków przy uploadzie.
    // Użytkownik wstawia placeholder URL-e ręcznie w CV.

    if (editingCV) {
      dispatch({ type: 'UPDATE_CV', payload: { ...editingCV, ...cvData } });
    } else {
      dispatch({ type: 'ADD_CV', payload: cvData });
    }

    if (formData.isDefault) {
      state.cvs.forEach((cv) => {
        if (cv.isDefault && cv.id !== editingCV?.id) {
          dispatch({ type: 'UPDATE_CV', payload: { ...cv, isDefault: false } });
        }
      });
    }

    closeModal();
    setIsUploading(false);
  };

  const handleDelete = async (id: string) => {
    const cv = state.cvs.find(c => c.id === id);
    const ok = await confirm({
      title: 'Usuń CV',
      message: 'Czy na pewno chcesz usunąć to CV?',
      confirmLabel: 'Usuń',
      variant: 'danger',
    });
    if (!ok) return;
    if (cv?.fileName && !isElectronApp) {
      await deleteCVFileFromStorage(cv.fileName);
    }
    dispatch({ type: 'DELETE_CV', payload: id });
  };

  const handleDownloadCV = async (cv: CV) => {
    if (!cv.fileName) {
      console.warn('Plik CV niedostępny');
      return;
    }

    if (isElectronApp) {
      // Electron: stare zachowanie
      const { loadCVFile } = await import('../utils/storage');
      const result = await loadCVFile(cv.fileName);
      if (!result.success || !result.data) {
        console.error(`Błąd przy pobieraniu pliku: ${result.error}`);
        return;
      }
      const link = document.createElement('a');
      link.href = result.data;
      link.download = cv.fileName.split('/').pop() ?? cv.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Web: Supabase Storage signed URL
      const url = await getCVFileUrl(cv.fileName);
      if (!url) {
        console.error('Nie można pobrać pliku.');
        return;
      }
      const link = document.createElement('a');
      link.href = url;
      link.download = cv.fileName.split('/').pop() ?? cv.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSetDefault = (cv: CV) => {
    state.cvs.forEach((otherCv) => {
      if (otherCv.isDefault && otherCv.id !== cv.id) {
        dispatch({ type: 'UPDATE_CV', payload: { ...otherCv, isDefault: false } });
      }
    });
    dispatch({ type: 'UPDATE_CV', payload: { ...cv, isDefault: true } });
  };

  const getUsageCount = (cvId: string) => {
    return state.applications.filter((app) => app.cvId === cvId).length;
  };

  const hasFileSupport = isElectronApp || !!user;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={FileText}
        title="Baza CV"
        description="Zarządzaj wersjami CV dostosowanymi do różnych stanowisk"
        actions={
          <>
            {isElectronApp && (
              <Button variant="secondary" onClick={() => openDataFolder()}>
                <FolderOpen className="w-4 h-4 mr-2" />
                Otwórz folder
              </Button>
            )}
            <div className="hidden md:block">
              <Button onClick={() => openModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Nowe CV
              </Button>
            </div>
          </>
        }
      />

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Szukaj po nazwie, stanowisku lub słowach kluczowych..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-dark-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* CV List */}
      {filteredCVs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Brak CV"
          description={
            searchQuery
              ? 'Nie znaleziono CV pasujących do wyszukiwania'
              : 'Dodaj swoje pierwsze CV'
          }
          action={
            !searchQuery ? (
              <Button onClick={() => openModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj CV
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCVs.map((cv) => (
            <Card key={cv.id} className="hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-100">{cv.name}</h3>
                    {cv.targetPosition && (
                      <p className="text-sm text-slate-400">{cv.targetPosition}</p>
                    )}
                  </div>
                  {cv.isDefault && (
                    <Badge variant="success" size="sm">
                      <Star className="w-3 h-3 mr-1" />
                      Domyślne
                    </Badge>
                  )}
                </div>

                {cv.keywords && cv.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {cv.keywords.slice(0, 5).map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 text-xs bg-dark-700 text-slate-400"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {keyword}
                      </span>
                    ))}
                    {cv.keywords.length > 5 && (
                      <span className="text-xs text-slate-500">+{cv.keywords.length - 5} więcej</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
                  <span>Użyte w {getUsageCount(cv.id)} aplikacjach</span>
                  <span>{format(parseISO(cv.updatedAt), 'd MMM yyyy', { locale: pl })}</span>
                </div>

                {cv.fileName && (
                  <p className="text-xs text-slate-500 mb-3 truncate">
                    {cv.fileName.split('/').pop()}
                  </p>
                )}

                {cv.notes && (
                  <p className="text-sm text-slate-400 line-clamp-2 mb-3">{cv.notes}</p>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-dark-700">
                  {!cv.isDefault && (
                    <button
                      onClick={() => handleSetDefault(cv)}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm text-slate-400 hover:bg-dark-700 transition-colors cursor-pointer"
                    >
                      <Star className="w-4 h-4" />
                      Domyślne
                    </button>
                  )}
                  {getCVDataById(cv.id) && (
                    <button
                      onClick={() => navigate(`/cv-editor?edit=${cv.id}`)}
                      className="p-1.5 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 transition-colors cursor-pointer"
                      title="Edytuj treść"
                    >
                      <PenLine className="w-4 h-4" />
                    </button>
                  )}
                  {cv.fileName && (
                    <button
                      onClick={() => handleDownloadCV(cv)}
                      className="p-1.5 text-slate-500 hover:text-success-400 hover:bg-success-500/10 transition-colors cursor-pointer"
                      title="Pobierz plik"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openModal(cv)}
                    className="p-1.5 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 transition-colors cursor-pointer"
                    title="Edytuj metadane"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cv.id)}
                    className="p-1.5 text-slate-500 hover:text-danger-400 hover:bg-danger-500/10 transition-colors cursor-pointer"
                    title="Usuń"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCV ? 'Edytuj CV' : 'Nowe CV'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File upload */}
          {hasFileSupport && (
            <div className="bg-dark-700/50 p-4 text-center">
              {uploadingFile ? (
                <div className="flex items-center justify-center gap-2 text-success-400">
                  <FileText className="w-5 h-5" />
                  <span>{uploadingFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setUploadingFile(null)}
                    className="text-slate-400 hover:text-danger-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : editingCV?.fileName ? (
                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <FileText className="w-5 h-5" />
                  <span>Aktualny plik: {editingCV.fileName.split('/').pop()}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-slate-400 hover:text-primary-400 transition-colors w-full"
                >
                  <Upload className="w-5 h-5" />
                  <span>Kliknij aby wybrać plik CV (PDF, DOC, DOCX)</span>
                </button>
              )}
              {!uploadingFile && editingCV?.fileName && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-sm text-primary-400 hover:text-primary-300"
                >
                  Zmień plik
                </button>
              )}
            </div>
          )}

          <Input
            label="Nazwa CV *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="np. CV Key Account Manager"
            required
          />

          <Input
            label="Docelowe stanowisko"
            value={formData.targetPosition}
            onChange={(e) => setFormData({ ...formData, targetPosition: e.target.value })}
            placeholder="np. Key Account Manager B2B"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Słowa kluczowe (dla ATS)
            </label>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="b2b, sprzedaż, crm, negocjacje (oddziel przecinkami)"
            />
            <p className="mt-1 text-xs text-slate-400">
              Dodaj słowa kluczowe z opisu stanowiska
            </p>
          </div>

          <Textarea
            label="Notatki"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Dodatkowe informacje o tym CV..."
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 text-primary-500 bg-dark-700 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-300">Ustaw jako domyślne CV</span>
          </label>

          {formError && (
            <p className="text-sm text-danger-400 bg-danger-500/10 px-3 py-2">{formError}</p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? 'Wysyłanie pliku...' : editingCV ? 'Zapisz zmiany' : 'Dodaj CV'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog />
    </div>
  );
}
