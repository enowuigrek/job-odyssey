import { Link } from 'react-router-dom';
import { MousePointerClick, FileOutput, Briefcase } from 'lucide-react';
import { Button } from '../components/ui';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const FEATURES = [
  {
    icon: MousePointerClick,
    title: 'Śledzenie kliknięć',
    description: 'Wiesz dokładnie, kiedy rekruter otworzył Twoje CV i które linki kliknął - LinkedIn, GitHub, portfolio.',
  },
  {
    icon: FileOutput,
    title: 'Generator CV',
    description: 'Wygeneruj CV dopasowane do konkretnej oferty, w formacie, który bez problemu odczytają systemy rekrutacyjne. Zapisz je w swojej bazie wersji.',
  },
  {
    icon: Briefcase,
    title: 'CRM rekrutacyjny',
    description: 'Śledź status każdej aplikacji, planuj rozmowy i zbieraj notatki w jednym miejscu.',
  },
];

export function LandingPage({ onLoginClick, onRegisterClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* ── Delikatny glow w tle ────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary-500/10 blur-[140px]" />
      </div>

      <div className="relative">
        {/* ── Top bar ───────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-4 py-5 md:px-8">
          <h1 className="text-xl font-bold text-white tracking-wide uppercase">Job Odyssey</h1>
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="sm" onClick={onLoginClick}>
              Zaloguj się
            </Button>
            <Button variant="primary" size="sm" onClick={onRegisterClick}>
              Załóż konto
            </Button>
          </div>
        </header>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="px-4 pt-12 pb-16 md:px-8 md:pt-20 md:pb-24">
          <div className="max-w-3xl mx-auto text-center">
            <p className="animate-fade-in-up text-xs font-medium text-primary-400 uppercase tracking-widest mb-4">
              Tracker aplikacji rekrutacyjnych
            </p>
            <h2 className="animate-fade-in-up [animation-delay:80ms] text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 leading-tight">
              Koniec wysyłania CV w próżnię.
            </h2>
            <p className="animate-fade-in-up [animation-delay:160ms] text-slate-400 text-base md:text-lg mt-5 max-w-xl mx-auto">
              Job Odyssey generuje CV z otagowanymi linkami i pokazuje dokładnie,
              kto je otworzył, kiedy i co kliknął. Żadnych domysłów - tylko dane.
            </p>
            <div className="animate-fade-in-up [animation-delay:240ms] mt-8">
              <Button variant="primary" size="lg" onClick={onRegisterClick}>
                Załóż konto
              </Button>
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section className="px-4 pb-16 md:px-8 md:pb-24">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-dark-800 p-6 transition-all hover:bg-dark-700 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
              >
                <Icon className="w-6 h-6 text-primary-400 mb-4" />
                <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-2">
                  {title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="px-4 py-6 md:px-8 border-t border-dark-700">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs text-slate-500">© 2026 Job Odyssey</p>
            <div className="flex items-center gap-4">
              <Link to="/regulamin" className="text-xs text-slate-500 hover:text-primary-400 transition-colors">
                Regulamin
              </Link>
              <Link to="/polityka-prywatnosci" className="text-xs text-slate-500 hover:text-primary-400 transition-colors">
                Polityka prywatności
              </Link>
              <Link to="/polityka-cookies" className="text-xs text-slate-500 hover:text-primary-400 transition-colors">
                Polityka cookies
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
