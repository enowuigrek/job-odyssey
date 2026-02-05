import { useState, useMemo, useRef } from 'react';
import { Plus, FileText, Star, Trash2, Edit, Tag, Upload, Download, FolderOpen } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  Button,
  Input,
  Card,
  CardBody,
  Badge,
  Modal,
  EmptyState,
  Textarea,
} from '../components/ui';
import { CV } from '../types';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import { saveCVFile, loadCVFile, deleteCVFile, openDataFolder, openCVFile } from '../utils/storage';

export function CVPage() {
  const { state, dispatch, isElectronApp } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCV, setEditingCV] = useState<CV | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Default CV first, then by update date
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
      // Auto-fill name if empty
      if (!formData.name) {
        setFormData({ ...formData, name: file.name.replace(/\.[^.]+$/, '') });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let fileName: string | undefined;

    // Handle file upload if in Electron mode and file selected
    if (isElectronApp && uploadingFile) {
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(uploadingFile);
      });

      // Zachowaj oryginalną nazwę pliku
      fileName = uploadingFile.name;

      const result = await saveCVFile(fileName, fileData);
      if (!result.success) {
        alert(`Błąd przy zapisie pliku: ${result.error}`);
        return;
      }
    }

    const cvData = {
      name: formData.name,
      targetPosition: formData.targetPosition || undefined,
      keywords: formData.keywords
        ? formData.keywords.split(',').map((k) => k.trim().toLowerCase())
        : undefined,
      notes: formData.notes || undefined,
      isDefault: formData.isDefault,
      fileName: fileName || editingCV?.fileName,
    };

    if (editingCV) {
      dispatch({
        type: 'UPDATE_CV',
        payload: {
          ...editingCV,
          ...cvData,
        },
      });
    } else {
      dispatch({
        type: 'ADD_CV',
        payload: cvData,
      });
    }

    // If this CV is set as default, remove default from others
    if (formData.isDefault) {
      state.cvs.forEach((cv) => {
        if (cv.isDefault && cv.id !== editingCV?.id) {
          dispatch({
            type: 'UPDATE_CV',
            payload: {
              ...cv,
              isDefault: false,
            },
          });
        }
      });
    }

    closeModal();
  };

  const handleDelete = async (id: string) => {
    const cv = state.cvs.find(c => c.id === id);
    if (confirm('Czy na pewno chcesz usunąć to CV?')) {
      // Delete file if exists
      if (isElectronApp && cv?.fileName) {
        await deleteCVFile(cv.fileName);
      }
      dispatch({ type: 'DELETE_CV', payload: id });
    }
  };

  const handleDownloadCV = async (cv: CV) => {
    if (!isElectronApp || !cv.fileName) {
      alert('Plik CV niedostępny');
      return;
    }

    const result = await loadCVFile(cv.fileName);
    if (!result.success || !result.data) {
      alert(`Błąd przy pobieraniu pliku: ${result.error}`);
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = result.data;
    link.download = cv.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSetDefault = (cv: CV) => {
    // Remove default from all others
    state.cvs.forEach((otherCv) => {
      if (otherCv.isDefault && otherCv.id !== cv.id) {
        dispatch({
          type: 'UPDATE_CV',
          payload: {
            ...otherCv,
            isDefault: false,
          },
        });
      }
    });
    // Set this one as default
    dispatch({
      type: 'UPDATE_CV',
      payload: {
        ...cv,
        isDefault: true,
      },
    });
  };

  const handleOpenCV = async (cv: CV) => {
    if (!isElectronApp || !cv.fileName) {
      alert('Otwieranie plików dostępne tylko w trybie Electron');
      return;
    }

    const result = await openCVFile(cv.fileName);
    if (!result.success) {
      alert(`Błąd przy otwieraniu pliku: ${result.error}`);
    }
  };

  const getUsageCount = (cvId: string) => {
    return state.applications.filter((app) => app.cvId === cvId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Baza CV</h1>
          <p className="text-slate-400 mt-1">
            Zarządzaj wersjami CV dostosowanymi do różnych stanowisk
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isElectronApp && (
            <Button variant="secondary" onClick={() => openDataFolder()}>
              <FolderOpen className="w-4 h-4 mr-2" />
              Otwórz folder
            </Button>
          )}
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nowe CV
          </Button>
        </div>
      </div>


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
                    {cv.fileName && isElectronApp ? (
                      <button
                        onClick={() => handleOpenCV(cv)}
                        className="font-semibold text-slate-100 hover:text-primary-400 transition-colors cursor-pointer text-left"
                      >
                        {cv.name}
                      </button>
                    ) : (
                      <h3 className="font-semibold text-slate-100">{cv.name}</h3>
                    )}
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
                      <span className="text-xs text-slate-500">
                        +{cv.keywords.length - 5} więcej
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
                  <span>Użyte w {getUsageCount(cv.id)} aplikacjach</span>
                  <span>
                    {format(parseISO(cv.updatedAt), 'd MMM yyyy', { locale: pl })}
                  </span>
                </div>

                {cv.fileName && (
                  <p className="text-xs text-slate-500 mb-3 truncate">{cv.fileName}</p>
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
                  {cv.fileName && isElectronApp && (
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
                    title="Edytuj"
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
          {/* File upload section - only in Electron */}
          {isElectronApp && (
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
                  <span>Aktualny plik: {editingCV.fileName}</span>
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
              {!uploadingFile && !editingCV?.fileName && (
                <p className="text-xs text-slate-500 mt-2">
                  Plik zostanie zapisany w folderze JobOdyssey w Dokumentach
                </p>
              )}
              {(editingCV?.fileName && !uploadingFile) && (
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
            placeholder="np. CV Frontend Developer Senior"
            required
          />

          <Input
            label="Docelowe stanowisko"
            value={formData.targetPosition}
            onChange={(e) => setFormData({ ...formData, targetPosition: e.target.value })}
            placeholder="np. Senior Frontend Developer"
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Słowa kluczowe (dla ATS)
            </label>
            <Input
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="react, typescript, nextjs, tailwind (oddziel przecinkami)"
            />
            <p className="mt-1 text-xs text-slate-400">
              Dodaj słowa kluczowe z opisu stanowiska, aby zwiększyć szanse przejścia przez ATS
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

          <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Anuluj
            </Button>
            <Button type="submit">{editingCV ? 'Zapisz zmiany' : 'Dodaj CV'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
