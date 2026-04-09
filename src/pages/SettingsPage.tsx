import { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Database,
  FileJson,
  Sun,
  Moon,
  Palette,
  Link,
  Plus,
  Edit2,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Card, CardBody, CardHeader } from '../components/ui';
import { exportData, importData, clearAllData } from '../utils/storage';
import { useUserLinks, UserLink, LinkType } from '../hooks/useUserLinks';

export function SettingsPage() {
  const { state, dispatch } = useApp();
  const { theme, setTheme } = useTheme();
  const { links: userLinks, addLink, updateLink, removeLink } = useUserLinks();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newLink, setNewLink] = useState<{ label: string; url: string; type: LinkType }>({ label: '', url: '', type: 'other' });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-odyssey-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: 'Dane zostały wyeksportowane!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const importedData = await importData(content);

      if (importedData) {
        dispatch({ type: 'IMPORT_DATA', payload: importedData });
        setMessage({ type: 'success', text: 'Dane zostały zaimportowane!' });
      } else {
        setMessage({ type: 'error', text: 'Błąd importu. Sprawdź format pliku.' });
      }
      setTimeout(() => setMessage(null), 3000);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    if (
      confirm(
        'Czy na pewno chcesz usunąć WSZYSTKIE dane? Ta operacja jest nieodwracalna!'
      )
    ) {
      if (
        confirm(
          'To jest ostatnie ostrzeżenie. Wszystkie aplikacje, rozmowy, CV, pytania i historie zostaną usunięte. Kontynuować?'
        )
      ) {
        await clearAllData();
        dispatch({ type: 'CLEAR_ALL' });
        setMessage({ type: 'success', text: 'Wszystkie dane zostały usunięte.' });
        setTimeout(() => setMessage(null), 3000);
      }
    }
  };

  const stats = {
    applications: state.applications.length,
    interviews: state.interviews.length,
    cvs: state.cvs.length,
    questions: state.questions.length,
    stories: state.stories.length,
  };

  const totalItems =
    stats.applications + stats.interviews + stats.cvs + stats.questions + stats.stories;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Ustawienia</h1>
        <p className="text-slate-400 mt-1">Zarządzaj danymi i konfiguracją aplikacji</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 border-0 ${
            message.type === 'success'
              ? 'bg-success-500/10 text-success-300 border border-green-200'
              : 'bg-danger-500/10 text-danger-300 border border-danger-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Data Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-100">Statystyki danych</h2>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-100">{stats.applications}</p>
              <p className="text-sm text-slate-400">Aplikacji</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{stats.interviews}</p>
              <p className="text-sm text-slate-400">Rozmów</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{stats.cvs}</p>
              <p className="text-sm text-slate-400">CV</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{stats.questions}</p>
              <p className="text-sm text-slate-400">Pytań</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{stats.stories}</p>
              <p className="text-sm text-slate-400">Historii</p>
            </div>
          </div>
          <p className="text-center text-sm text-slate-400 mt-4">
            Łącznie: {totalItems} elementów
          </p>
        </CardBody>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-100">Wygląd</h2>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-slate-400 mb-4">
            Wybierz motyw kolorystyczny aplikacji
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-3 p-4 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-primary-500/20 ring-2 ring-primary-500'
                  : 'bg-dark-700 hover:bg-dark-600'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="font-medium">Ciemny</span>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-3 p-4 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-primary-500/20 ring-2 ring-primary-500'
                  : 'bg-dark-700 hover:bg-dark-600'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="font-medium">Jasny</span>
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Export/Import */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-100">Eksport i import danych</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-slate-400">
            Eksportuj swoje dane do pliku JSON, aby utworzyć kopię zapasową lub przenieść dane
            na inne urządzenie.
          </p>

          <div className="flex gap-4">
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Eksportuj dane
            </Button>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importuj dane
              </Button>
            </div>
          </div>

          <div className="bg-warning-500/10 border border-warning-500/30 border-0 p-3 text-sm text-warning-300">
            <strong>Uwaga:</strong> Import zastąpi wszystkie obecne dane. Zalecamy najpierw
            wyeksportować bieżące dane jako kopię zapasową.
          </div>
        </CardBody>
      </Card>

      {/* Danger Zone */}
      <div className="bg-danger-500/20 p-1">
        <Card>
          <CardHeader className="bg-danger-500/20">
            <div className="flex items-center gap-2 text-danger-400">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="font-semibold">Strefa niebezpieczna</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-slate-300">
              Usunięcie wszystkich danych jest nieodwracalne. Upewnij się, że masz kopię zapasową
              przed wykonaniem tej operacji.
            </p>

            <Button variant="danger" onClick={handleClearAll}>
              <Trash2 className="w-4 h-4 mr-2" />
              Usuń wszystkie dane
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* About */}
      <Card>
        <CardBody className="text-center">
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Job Odyssey</h3>
          <p className="text-sm text-slate-400 mb-4">
            Twój osobisty asystent w poszukiwaniu pracy
          </p>
          <p className="text-xs text-slate-500 mb-3">
            Wszystkie dane są przechowywane lokalnie.
            <br />
            Twoje dane nigdy nie opuszczają Twojego urządzenia.
          </p>
          <p className="text-xs text-slate-600">
            Stworzone przez <span className="text-primary-400">enowuigrek</span>
          </p>
        </CardBody>
      </Card>

      {/* Moje linki domyślne */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-slate-100">Moje linki domyślne</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Zapisz swoje linki raz — będą automatycznie podpowiadane przy generowaniu śledzonego CV.
          </p>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {/* Istniejące linki */}
            {userLinks.map(link => (
              <div key={link.id} className="bg-dark-700/50 p-3 rounded">
                {editingLinkId === link.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={link.type}
                        onChange={e => updateLink(link.id, { type: e.target.value as LinkType })}
                        className="px-2 py-1.5 bg-dark-600 text-slate-200 text-sm rounded border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        <option value="linkedin">LinkedIn</option>
                        <option value="github">GitHub</option>
                        <option value="project">Projekt</option>
                        <option value="other">Inne</option>
                      </select>
                      <input
                        type="text"
                        value={link.label}
                        onChange={e => updateLink(link.id, { label: e.target.value })}
                        className="flex-1 px-2 py-1.5 bg-dark-600 text-slate-200 text-sm rounded border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Nazwa"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={link.url}
                        onChange={e => updateLink(link.id, { url: e.target.value })}
                        className="flex-1 px-2 py-1.5 bg-dark-600 text-slate-200 text-sm rounded border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="https://..."
                      />
                      <Button variant="secondary" onClick={() => setEditingLinkId(null)}>Gotowe</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 bg-dark-600 text-slate-400 rounded">
                          {link.type}
                        </span>
                        <span className="text-sm font-medium text-slate-200">{link.label}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingLinkId(link.id)}
                        className="p-1.5 text-slate-500 hover:text-primary-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeLink(link.id)}
                        className="p-1.5 text-slate-500 hover:text-danger-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Dodaj nowy link */}
            <div className="bg-dark-700/30 p-3 rounded border border-dashed border-dark-600 space-y-2">
              <p className="text-xs text-slate-500">Dodaj link</p>
              <div className="flex gap-2">
                <select
                  value={newLink.type}
                  onChange={e => setNewLink({ ...newLink, type: e.target.value as LinkType, label: e.target.value === 'linkedin' ? 'LinkedIn' : e.target.value === 'github' ? 'GitHub' : newLink.label })}
                  className="px-2 py-1.5 bg-dark-600 text-slate-200 text-sm rounded border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="github">GitHub</option>
                  <option value="project">Projekt</option>
                  <option value="other">Inne</option>
                </select>
                <input
                  type="text"
                  value={newLink.label}
                  onChange={e => setNewLink({ ...newLink, label: e.target.value })}
                  placeholder="Nazwa (np. Portfolio)"
                  className="flex-1 px-2 py-1.5 bg-dark-600 text-slate-200 text-sm rounded border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newLink.url}
                  onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-2 py-1.5 bg-dark-600 text-slate-200 text-sm rounded border border-dark-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <Button
                  onClick={() => {
                    if (newLink.label.trim() && newLink.url.trim()) {
                      addLink(newLink);
                      setNewLink({ label: '', url: '', type: 'other' });
                    }
                  }}
                  disabled={!newLink.label.trim() || !newLink.url.trim()}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Dodaj
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
