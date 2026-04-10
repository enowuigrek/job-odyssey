import {
  Database,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card, CardBody, CardHeader, PageHeader } from '../components/ui';

export function SettingsPage() {
  const { state } = useApp();
  const { theme, setTheme } = useTheme();
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
      <PageHeader
        icon={Palette}
        title="Ustawienia"
        description="Zarządzaj danymi i konfiguracją aplikacji"
      />

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

      {/* About */}
      <Card>
        <CardBody className="text-center">
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Job Odyssey</h3>
          <p className="text-sm text-slate-400 mb-4">
            Twój osobisty asystent w poszukiwaniu pracy
          </p>
          <p className="text-xs text-slate-500 mb-3">
            Dane przechowywane w chmurze z bezpiecznym uwierzytelnianiem.
            <br />
            Dostęp tylko dla zalogowanych użytkowników.
          </p>
          <p className="text-xs text-slate-600">
            Stworzone przez{' '}
            <a
              href="https://lukasznowak.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Łukasz Nowak
            </a>
          </p>
        </CardBody>
      </Card>

    </div>
  );
}
