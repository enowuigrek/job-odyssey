import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setInfo('Sprawdź skrzynkę email — wyślemy link potwierdzający.');
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Job Odyssey</h1>
          <p className="text-slate-400 mt-2">Twój osobisty CRM do rekrutacji</p>
        </div>

        <div className="bg-dark-800 p-6 border border-dark-700">
          <div className="flex mb-6 bg-dark-700 p-1">
            <button
              onClick={() => { setMode('login'); setError(null); setInfo(null); }}
              className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Logowanie
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); setInfo(null); }}
              className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                mode === 'register' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rejestracja
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-dark-700 text-slate-100 placeholder-slate-500 border border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="ty@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Hasło</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 bg-dark-700 text-slate-100 placeholder-slate-500 border border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="min. 6 znaków"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2">{error}</p>
            )}
            {info && (
              <p className="text-sm text-green-400 bg-green-400/10 px-3 py-2">{info}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {isSubmitting ? 'Proszę czekać...' : mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
