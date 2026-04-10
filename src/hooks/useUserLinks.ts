import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type LinkType = 'linkedin' | 'github' | 'project' | 'other';

export interface UserLink {
  id: string;
  label: string;
  url: string;
  type: LinkType;
}

function storageKey(userId: string) {
  return `job-odyssey-user-links-${userId}`;
}

export function useUserLinks() {
  const { user } = useAuth();
  const [links, setLinks] = useState<UserLink[]>([]);

  useEffect(() => {
    if (!user) { setLinks([]); return; }
    try {
      const raw = localStorage.getItem(storageKey(user.id));
      setLinks(raw ? JSON.parse(raw) : []);
    } catch {
      setLinks([]);
    }
  }, [user]);

  const save = useCallback((updated: UserLink[]) => {
    if (!user) return;
    localStorage.setItem(storageKey(user.id), JSON.stringify(updated));
    setLinks(updated);
  }, [user]);

  const ensureHttps = (url: string) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  };

  const addLink = useCallback((link: Omit<UserLink, 'id'>) => {
    save([...links, { ...link, url: ensureHttps(link.url), id: crypto.randomUUID() }]);
  }, [links, save]);

  const updateLink = useCallback((id: string, patch: Partial<Omit<UserLink, 'id'>>) => {
    save(links.map(l => l.id === id ? { ...l, ...patch, url: patch.url ? ensureHttps(patch.url) : l.url } : l));
  }, [links, save]);

  const removeLink = useCallback((id: string) => {
    save(links.filter(l => l.id !== id));
  }, [links, save]);

  return { links, addLink, updateLink, removeLink };
}
