import { useState, FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui';

interface LoginPageProps {
  initialMode?: 'login' | 'register';
  onBack?: () => void;
}

type Mode = 'login' | 'register' | 'reset';

export function LoginPage({ initialMode = 'login', onBack }: LoginPageProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else if (mode === 'register') {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setInfo('Sprawdź skrzynkę email — wyślemy link potwierdzający.');
      }
    } else {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error);
      } else {
        setInfo('Wysłaliśmy link do zresetowania hasła. Sprawdź skrzynkę email.');
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary-400 transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Strona główna
          </button>
        )}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Job Odyssey</h1>
        </div>

        <div className="bg-dark-800 p-6 border border-dark-700">
          {mode === 'reset' ? (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary-400 transition-colors mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Wróć do logowania
            </button>
          ) : (
            <div className="flex mb-6 bg-dark-700 p-1">
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                  mode === 'login' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Logowanie
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                  mode === 'register' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rejestracja
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'reset' && (
              <p className="text-sm text-slate-400">
                Podaj adres email konta — wyślemy link do ustawienia nowego hasła.
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-dark-900 text-white placeholder-slate-500 border border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="ty@email.com"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Hasło</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 bg-dark-900 text-white placeholder-slate-500 border border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="min. 6 znaków"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-danger-400 bg-danger-500/10 px-3 py-2">{error}</p>
            )}
            {info && (
              <p className="text-sm text-success-400 bg-success-500/10 px-3 py-2">{info}</p>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? 'Proszę czekać...'
                : mode === 'login'
                  ? 'Zaloguj się'
                  : mode === 'register'
                    ? 'Zarejestruj się'
                    : 'Wyślij link resetujący'}
            </Button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="block mx-auto text-sm text-slate-400 hover:text-primary-400 transition-colors cursor-pointer"
              >
                Nie pamiętam hasła
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
