import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getProfileBasics } from '../lib/profileDb';
import { useAuth } from './AuthContext';

/**
 * Samo imię/nazwisko i zdjęcie profilowe — osobno od useProfile() (który
 * ciągnie cały profil: doświadczenie, projekty, certyfikaty itd.), bo to
 * jedyne, czego potrzebuje globalny wskaźnik konta w rogu appki. ProfilePage
 * woła refresh() po zapisie zdjęcia/danych osobowych, żeby wskaźnik od razu
 * pokazał aktualne dane bez przeładowania strony.
 */
interface ProfileBasicsContextValue {
  name: string;
  photoUrl?: string;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const ProfileBasicsContext = createContext<ProfileBasicsContextValue | undefined>(undefined);

export function ProfileBasicsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setName('');
      setPhotoUrl(undefined);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const basics = await getProfileBasics(user.id);
      setName(basics.name);
      setPhotoUrl(basics.photo_url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  return (
    <ProfileBasicsContext.Provider value={{ name, photoUrl, isLoading, refresh: load }}>
      {children}
    </ProfileBasicsContext.Provider>
  );
}

export function useProfileBasics() {
  const ctx = useContext(ProfileBasicsContext);
  if (!ctx) throw new Error('useProfileBasics must be used within ProfileBasicsProvider');
  return ctx;
}
