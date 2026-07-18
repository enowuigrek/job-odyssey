import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getUserSettings, redeemAccessCode, UserPlan } from '../lib/db';
import { setUserTrackBase } from '../lib/trackUrl';
import { useAuth } from './AuthContext';

/**
 * Ustawienia usera reaktywne dla UI (plan wersji próbnej, domena śledzenia)
 * — osobno od AppContext, bo to pojedynczy wiersz konfiguracji, nie
 * kolekcja synchronizowana przez diffAndSync. Jedyne miejsce ładujące
 * user_settings (SettingsPage.tsx i limity triala czytają stąd, nie robią
 * własnych zapytań).
 */
interface UserSettingsContextValue {
  plan: UserPlan;
  trackingDomain?: string;
  isLoading: boolean;
  /** null = sukces (plan zaktualizowany), string = komunikat błędu po polsku */
  redeemCode: (code: string) => Promise<string | null>;
  refresh: () => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<UserPlan>('trial');
  const [trackingDomain, setTrackingDomain] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setPlan('trial');
      setTrackingDomain(undefined);
      setUserTrackBase(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const settings = await getUserSettings(user.id);
    setPlan(settings.plan);
    setTrackingDomain(settings.trackingDomain);
    setUserTrackBase(settings.trackingDomain);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const redeemCode = useCallback(async (code: string) => {
    const { plan: newPlan, error } = await redeemAccessCode(code);
    if (error) return error;
    if (newPlan) setPlan(newPlan);
    return null;
  }, []);

  return (
    <UserSettingsContext.Provider value={{ plan, trackingDomain, isLoading, redeemCode, refresh: load }}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error('useUserSettings must be used within UserSettingsProvider');
  return ctx;
}
