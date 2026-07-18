import { useState, useEffect } from 'react';
import {
  Database,
  Sun,
  Moon,
  Palette,
  User,
  KeyRound,
  Mail,
  Trash2,
  CheckCircle,
  AlertCircle,
  Link2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from '../contexts/UserSettingsContext';
import { supabase } from '../lib/supabase';
import { upsertUserSettings, deleteAllUserStorageFiles } from '../lib/db';
import { translateAuthError } from '../lib/authErrors';
import { ensureHttps } from '../lib/trackUrl';
import { Card, CardBody, CardHeader, PageHeader, Input, Button, Modal } from '../components/ui';
import { TRIAL_CV_LIMIT, TRIAL_APPLICATION_LIMIT } from '../lib/planLimits';

function StatusMsg({ type, text }: { type: 'ok' | 'err'; text: string }) {
  return (
    <p className={`flex items-center gap-2 text-sm mt-2 ${type === 'ok' ? 'text-success-400' : 'text-danger-400'}`}>
      {type === 'ok' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {text}
    </p>
  );
}

export function SettingsPage() {
  const { state } = useApp();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { plan, trackingDomain: settingsTrackingDomain, redeemCode, refresh: refreshSettings } = useUserSettings();

  // Change password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Change email
  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Tracking domain — pole edycji seedowane z kontekstu, po zapisie odświeżamy kontekst
  const [trackingDomain, setTrackingDomain] = useState('');
  const [domainMsg, setDomainMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [domainLoading, setDomainLoading] = useState(false);

  useEffect(() => {
    setTrackingDomain(settingsTrackingDomain ?? '');
  }, [settingsTrackingDomain]);

  const handleSaveDomain = async () => {
    if (!user) return;
    setDomainMsg(null);

    const trimmed = trackingDomain.trim();
    let normalized: string | undefined;
    if (trimmed) {
      try {
        normalized = ensureHttps(trimmed).replace(/\/+$/, '');
        new URL(normalized); // rzuca dla niepoprawnego URL-a
      } catch {
        setDomainMsg({ type: 'err', text: 'Podaj poprawny adres, np. https://twojadomena.pl/r' });
        return;
      }
    }

    setDomainLoading(true);
    await upsertUserSettings(user.id, { trackingDomain: normalized });
    await refreshSettings();
    setDomainLoading(false);
    setDomainMsg({ type: 'ok', text: normalized ? 'Domena zapisana.' : 'Domena usunięta — wracamy do domyślnych linków.' });
  };

  // Kod dostępu (odblokowanie pełnej wersji)
  const [accessCode, setAccessCode] = useState('');
  const [codeMsg, setCodeMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);

  const handleRedeemCode = async () => {
    if (!accessCode.trim()) return;
    setCodeLoading(true);
    setCodeMsg(null);
    const error = await redeemCode(accessCode.trim());
    setCodeLoading(false);
    if (error) {
      setCodeMsg({ type: 'err', text: error });
    } else {
      setCodeMsg({ type: 'ok', text: 'Kod przyjęty — masz teraz pełną wersję.' });
      setAccessCode('');
    }
  };

  const stats = {
    applications: state.applications.length,
    interviews: state.interviews.length,
    cvs: state.cvs.length,
    questions: state.questions.length,
    stories: state.stories.length,
  };
  const totalItems = Object.values(stats).reduce((a, b) => a + b, 0);

  const handleChangePassword = async () => {
    setPasswordMsg(null);
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'err', text: 'Hasło musi mieć co najmniej 6 znaków.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: 'Hasła nie są identyczne.' });
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      setPasswordMsg({ type: 'err', text: translateAuthError(error) ?? 'Wystąpił błąd.' });
    } else {
      setPasswordMsg({ type: 'ok', text: 'Hasło zostało zmienione.' });
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleChangeEmail = async () => {
    setEmailMsg(null);
    if (!newEmail.includes('@')) {
      setEmailMsg({ type: 'err', text: 'Podaj prawidłowy adres email.' });
      return;
    }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailLoading(false);
    if (error) {
      setEmailMsg({ type: 'err', text: translateAuthError(error) ?? 'Wystąpił błąd.' });
    } else {
      setEmailMsg({ type: 'ok', text: 'Link potwierdzający wysłany na nowy adres email.' });
      setNewEmail('');
    }
  };

  // Usuwanie konta — dodatkowe potwierdzenie wpisaniem słowa (zbyt łatwo
  // kliknąć przycisk niechcący), a po sukcesie ekran informacyjny ZANIM
  // signOut() przełączy appkę na LandingPage (SettingsPage inaczej znika
  // z ekranu w tej samej klatce, w której user zobaczyłby komunikat)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [accountDeleted, setAccountDeleted] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'USUŃ') return;
    if (!user) return;

    setDeleteLoading(true);
    setDeleteError(null);
    // Pliki w Storage kasujemy PRZED usunięciem konta — po skasowaniu
    // sesja przestaje być ważna, a Storage API wymaga uwierzytelnienia
    await deleteAllUserStorageFiles(user.id);
    const { error } = await supabase.rpc('delete_user');
    setDeleteLoading(false);

    if (error) {
      setDeleteError('Nie udało się usunąć konta. Spróbuj ponownie lub napisz do nas.');
      console.error('delete_user RPC failed:', error.message);
    } else {
      setShowDeleteModal(false);
      setAccountDeleted(true);
    }
  };

  if (accountDeleted) {
    return (
      <div className="fixed inset-0 z-50 bg-dark-900 flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-success-400 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-100">Konto zostało usunięte</h2>
          <p className="text-sm text-slate-400">
            Wszystkie Twoje dane — aplikacje, rozmowy, CV i profil — zostały trwale skasowane.
            Dziękujemy, że korzystałeś z Job Odyssey.
          </p>
          <Button onClick={() => signOut()}>Wróć do strony głównej</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        icon={Palette}
        title="Ustawienia"
        description="Zarządzaj danymi i konfiguracją aplikacji"
      />

      {/* Account */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-100">Konto</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">

          {/* Current email info */}
          <p className="text-sm text-slate-400">
            Zalogowany jako: <span className="text-slate-200">{user?.email}</span>
          </p>

          {/* Change password */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Zmień hasło</span>
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Nowe hasło (min. 6 znaków)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Powtórz nowe hasło"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
              />
              {passwordMsg && <StatusMsg {...passwordMsg} />}
              <div className="pt-1">
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !newPassword}
                  size="sm"
                >
                  {passwordLoading ? 'Zapisuję...' : 'Zmień hasło'}
                </Button>
              </div>
            </div>
          </div>

          {/* Change email */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">Zmień email</span>
            </div>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Nowy adres email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChangeEmail()}
              />
              {emailMsg && <StatusMsg {...emailMsg} />}
              <div className="pt-1">
                <Button
                  onClick={handleChangeEmail}
                  disabled={emailLoading || !newEmail}
                  size="sm"
                >
                  {emailLoading ? 'Wysyłam...' : 'Zmień email'}
                </Button>
              </div>
            </div>
          </div>

          {/* Delete account */}
          <div className="pt-2 border-t border-dark-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-300">Usuń konto</p>
                <p className="text-xs text-slate-500 mt-0.5">Trwale usuwa konto i wszystkie dane</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(null); }}
                className="self-start sm:self-auto"
              >
                <Trash2 className="w-4 h-4" />
                Usuń konto
              </Button>
            </div>
          </div>

        </CardBody>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Usuń konto"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            Ta operacja jest nieodwracalna. Wszystkie Twoje dane — aplikacje, rozmowy, CV, profil
            kandydata i linki śledzące — zostaną trwale usunięte.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Wpisz <span className="font-semibold text-danger-400">USUŃ</span>, żeby potwierdzić
            </label>
            <Input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="USUŃ"
              autoFocus
            />
          </div>
          {deleteError && <StatusMsg type="err" text={deleteError} />}
          <div className="flex justify-end gap-3 pt-2 border-t border-dark-700">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Anuluj
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText.trim().toUpperCase() !== 'USUŃ' || deleteLoading}
            >
              {deleteLoading ? 'Usuwam...' : 'Usuń konto na zawsze'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-100">Plan</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Aktualny plan:</span>
            {plan === 'full' ? (
              <span className="px-2 py-0.5 text-xs font-medium bg-success-500/20 text-success-400">Pełny</span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium bg-warning-500/20 text-warning-400">Wersja próbna</span>
            )}
          </div>
          {plan === 'trial' && (
            <p className="text-sm text-slate-400">
              W wersji próbnej możesz mieć do {TRIAL_CV_LIMIT} CV w Bazie CV i {TRIAL_APPLICATION_LIMIT} aplikacji.
              Rozmowy, pytania i historie bez limitu. Masz kod dostępu? Wpisz go poniżej, żeby odblokować pełną wersję.
            </p>
          )}
          {plan === 'full' && (
            <p className="text-sm text-slate-400">Masz pełny dostęp, bez limitów.</p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end pt-1">
            <div className="flex-1">
              <Input
                placeholder="Kod dostępu"
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRedeemCode()}
              />
            </div>
            <Button onClick={handleRedeemCode} disabled={codeLoading || !accessCode.trim()} size="sm">
              {codeLoading ? 'Sprawdzam...' : 'Aktywuj kod'}
            </Button>
          </div>
          {codeMsg && <StatusMsg {...codeMsg} />}
        </CardBody>
      </Card>

      {/* Tracking domain */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-100">Domena linków śledzących</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-slate-400">
            Domyślnie linki w Twoich CV prowadzą przez długi, techniczny adres. Podpinając własną
            domenę (np. <span className="text-slate-300">https://twojadomena.pl/r</span>), linki
            będą krótsze i bardziej wiarygodne dla rekrutera.
          </p>
          <p className="text-sm text-slate-400">
            Wymaga przekierowania po stronie Twojej domeny: ścieżka <code className="text-slate-300">/r/*</code>{' '}
            musi przekierowywać (302) do{' '}
            <code className="text-slate-300 break-all">
              {(import.meta.env.VITE_SUPABASE_URL as string)}/functions/v1/track?t=:token
            </code>
            . Na Netlify to reguła w <code className="text-slate-300">netlify.toml</code> lub pliku{' '}
            <code className="text-slate-300">_redirects</code>.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-end pt-1">
            <div className="flex-1">
              <Input
                placeholder="https://twojadomena.pl/r"
                value={trackingDomain}
                onChange={e => setTrackingDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveDomain()}
              />
            </div>
            <Button onClick={handleSaveDomain} disabled={domainLoading} size="sm">
              {domainLoading ? 'Zapisuję...' : 'Zapisz domenę'}
            </Button>
          </div>
          {domainMsg && <StatusMsg {...domainMsg} />}
        </CardBody>
      </Card>

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
              <p className="text-3xl font-bold text-slate-100">{stats.applications}</p>
              <p className="text-sm text-slate-400">Aplikacji</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-100">{stats.interviews}</p>
              <p className="text-sm text-slate-400">Rozmów</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-100">{stats.cvs}</p>
              <p className="text-sm text-slate-400">CV</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-100">{stats.questions}</p>
              <p className="text-sm text-slate-400">Pytań</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-100">{stats.stories}</p>
              <p className="text-sm text-slate-400">Historii</p>
            </div>
          </div>
          <p className="text-center text-sm text-slate-400 mt-4">
            Łącznie: {totalItems} elementów
          </p>
        </CardBody>
      </Card>

      {/* About */}
      <Card>
        <CardBody className="text-center">
          <h3 className="text-xl font-semibold text-slate-100 mb-2">Job Odyssey</h3>
          <p className="text-base text-slate-400 mb-4">
            Twój osobisty asystent w poszukiwaniu pracy
          </p>
          <p className="text-sm text-slate-500 mb-3">
            Dane przechowywane w chmurze z bezpiecznym uwierzytelnianiem.
            <br />
            Dostęp tylko dla zalogowanych użytkowników.
          </p>
          <p className="text-sm text-slate-500">
            Stworzone przez{' '}
            <a
              href="https://lukasznowak.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              lukasznowak.dev
            </a>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
