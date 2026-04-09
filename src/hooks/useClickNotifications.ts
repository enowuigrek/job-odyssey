import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRecentClicksForUser } from '../lib/db';

const STORAGE_KEY = 'job-odyssey-last-seen-click';
const POLL_INTERVAL = 30_000; // 30 sekund

export interface ClickNotification {
  id: string;
  clickedAt: string;
  label: string;
  applicationId: string;
  token: string;
}

export function useClickNotifications(onNewClicks?: (applicationIds: string[]) => void) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ClickNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenAt, setLastSeenAt] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? new Date(0).toISOString();
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevNotifIdsRef = useRef<Set<string>>(new Set());

  const fetchClicks = useCallback(async () => {
    if (!user) return;
    const recent = await getRecentClicksForUser(user.id, 20);
    setNotifications(recent);

    const unread = recent.filter(n => n.clickedAt > lastSeenAt).length;
    setUnreadCount(unread);

    // Wykryj nowe kliknięcia (których nie było przy poprzednim fetch)
    if (onNewClicks) {
      const newClicks = recent.filter(n => !prevNotifIdsRef.current.has(n.id));
      if (newClicks.length > 0) {
        const appIds = [...new Set(newClicks.map(n => n.applicationId).filter(Boolean))];
        onNewClicks(appIds);
      }
    }
    prevNotifIdsRef.current = new Set(recent.map(n => n.id));
  }, [user, lastSeenAt, onNewClicks]);

  useEffect(() => {
    fetchClicks();
    intervalRef.current = setInterval(fetchClicks, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchClicks]);

  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('job-odyssey-dismissed-clicks');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  });

  const visibleNotifications = notifications.filter(n => !dismissed.has(n.id));

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, now);
    setLastSeenAt(now);
    setUnreadCount(0);
  }, []);

  const dismissOne = useCallback((id: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('job-odyssey-dismissed-clicks', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    const ids = notifications.map(n => n.id);
    setDismissed(prev => {
      const next = new Set([...prev, ...ids]);
      localStorage.setItem('job-odyssey-dismissed-clicks', JSON.stringify([...next]));
      return next;
    });
    markAllRead();
  }, [notifications, markAllRead]);

  return { notifications: visibleNotifications, unreadCount, markAllRead, dismissOne, dismissAll, refetch: fetchClicks };
}
