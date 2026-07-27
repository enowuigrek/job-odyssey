import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { translateAuthError } from '../../lib/authErrors';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';

// Formularz nowego hasła po wejściu z linku resetującego —
// Supabase zalogował użytkownika sesją recovery (event PASSWORD_RECOVERY w AuthContext)
export function PasswordRecoveryModal() {
  const { passwordRecovery, clearPasswordRecovery } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!passwordRecovery) return null;

  const handleSave = async () => {
    setMsg(null);
    if (newPassword.length < 6) {
      setMsg({ type: 'err', text: 'Hasło musi mieć co najmniej 6 znaków.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'err', text: 'Hasła nie są identyczne.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      setMsg({ type: 'err', text: translateAuthError(error) ?? 'Wystąpił błąd. Spróbuj ponownie.' });
    } else {
      setMsg({ type: 'ok', text: 'Hasło zostało zmienione.' });
      setDone(true);
    }
  };

  return (
    <Modal isOpen onClose={clearPasswordRecovery} title="Ustaw nowe hasło" size="sm">
      <div className="space-y-3">
        <p className="text-sm text-slate-400">
          Zalogowaliśmy Cię przez link resetujący. Ustaw teraz nowe hasło do konta.
        </p>

        {!done && (
          <>
            <Input
              type="password"
              placeholder="Nowe hasło (min. 6 znaków)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoFocus
            />
            <Input
              type="password"
              placeholder="Powtórz nowe hasło"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </>
        )}

        {msg && (
          <p className={`flex items-center gap-2 text-sm ${msg.type === 'ok' ? 'text-success-400' : 'text-danger-400'}`}>
            {msg.type === 'ok'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {msg.text}
          </p>
        )}

        <div className="pt-1">
          {done ? (
            <Button onClick={clearPasswordRecovery} size="sm">Zamknij</Button>
          ) : (
            <Button onClick={handleSave} disabled={loading || !newPassword} size="sm">
              {loading ? 'Zapisuję...' : 'Zapisz hasło'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
