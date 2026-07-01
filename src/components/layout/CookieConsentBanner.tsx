import { Link } from 'react-router-dom';
import { Button } from '../ui';
import { useCookieConsent } from '../../hooks/useCookieConsent';
import { useAuth } from '../../contexts/AuthContext';

export function CookieConsentBanner() {
  const { user } = useAuth();
  const { consent, accept, reject } = useCookieConsent();

  // Zalogowana część appki ma własne stałe paski u dołu (mobile nav, pasek zapisu CV) —
  // do tego momentu każdy widział już baner na stronie publicznej.
  if (user || consent !== null) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-dark-800 border-t border-dark-600 px-4 py-4 md:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-300">
          Używamy plików cookies, żeby zrozumieć, jak korzystacie z Job Odyssey. Szczegóły znajdziesz w{' '}
          <Link to="/polityka-cookies" className="text-primary-400 hover:text-primary-300 transition-colors">
            Polityce cookies
          </Link>.
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={reject}>
            Odrzuć
          </Button>
          <Button variant="primary" size="sm" onClick={accept}>
            Akceptuj
          </Button>
        </div>
      </div>
    </div>
  );
}
