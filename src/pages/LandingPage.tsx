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
    description: 'Wiesz dokładnie, kiedy rekruter otworzył Twoje CV i które linki kliknął — LinkedIn, GitHub, portfolio.',
  },
  {
    icon: FileOutput,
    title: 'Generator CV',
    description: 'Wygeneruj CV dopasowane do konkretnej oferty i zapisz je w swojej bazie wersji.',
  },
  {
    icon: Briefcase,
    title: 'CRM rekrutacyjny',
    description: 'Śledź status każdej aplikacji, planuj rozmowy i zbieraj notatki w jednym miejscu.',
  },
];

export function LandingPage({ onLoginClick, onRegisterClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-dark-900">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
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

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="px-4 pt-12 pb-16 md:px-8 md:pt-20 md:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-medium text-primary-400 uppercase tracking-widest mb-4">
            Tracker aplikacji rekrutacyjnych
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-100 leading-tight">
            Koniec wysyłania CV w próżnię.
          </h2>
          <p className="text-slate-400 text-base md:text-lg mt-5 max-w-xl mx-auto">
            Job Odyssey generuje CV z otagowanymi linkami i pokazuje dokładnie,
            kto je otworzył, kiedy i co kliknął. Żadnych domysłów — tylko dane.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button variant="primary" size="lg" onClick={onRegisterClick}>
              Załóż darmowe konto
            </Button>
            <p className="text-xs text-slate-500">Zajmie mniej niż minutę.</p>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="px-4 pb-16 md:px-8 md:pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-dark-800 p-6">
              <Icon className="w-6 h-6 text-primary-400 mb-4" />
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-2">
                {title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
      <section className="px-4 pb-16 md:px-8 md:pb-24">
        <div className="max-w-3xl mx-auto text-center border-t border-dark-700 pt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-100">
            Gotowy, żeby przestać zgadywać?
          </h2>
          <p className="text-slate-400 mt-3">
            Zbudowane podczas własnych poszukiwań pracy — teraz dostępne dla każdego.
          </p>
          <div className="mt-6">
            <Button variant="primary" size="lg" onClick={onRegisterClick}>
              Załóż darmowe konto
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-4 py-6 md:px-8 border-t border-dark-700">
        <p className="text-xs text-slate-500 text-center">© 2026 Job Odyssey</p>
      </footer>
    </div>
  );
}
