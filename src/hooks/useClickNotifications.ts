import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRecentClicksForUser, markAllClicksRead, dismissClick, dismissAllClicks } from '../lib/db';

const POLL_INTERVAL = 30_000; // 30 sekund

export interface ClickNotification {
  id: string;
  clickedAt: string;
  label: string;
  applicationId: string;
  token: string;
  readAt: string | null;
}

export function useClickNotifications(onNewClicks?: (applicationIds: string[]) => void) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ClickNotification[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevNotifIdsRef = useRef<Set<string>>(new Set());
  // Strażnicy przed wyścigiem fetch/mutacja: odpowiedź na fetch rozpoczęty
  // PRZED oznaczeniem/usunięciem nie może przywrócić starej listy
  const epochRef = useRef(0);
  const mutatingRef = useRef(false);

  const fetchClicks = useCallback(async () => {
    if (!user || mutatingRef.current) return;
    const epoch = epochRef.current;
    const recent = await getRecentClicksForUser(user.id, 20);
    if (epoch !== epochRef.current || mutatingRef.current) return; // w międzyczasie była mutacja
    const mapped = recent.map(n => ({ ...n, readAt: n.readAt ?? null }));
    setNotifications(mapped);

    // Wykryj nowe kliknięcia (których nie było przy poprzednim fetch)
    if (onNewClicks) {
      const newClicks = mapped.filter(n => !prevNotifIdsRef.current.has(n.id));
      if (newClicks.length > 0) {
        const appIds = [...new Set(newClicks.map(n => n.applicationId).filter(Boolean))];
        onNewClicks(appIds);
      }
    }
    prevNotifIdsRef.current = new Set(mapped.map(n => n.id));
  }, [user, onNewClicks]);

  useEffect(() => {
    fetchClicks();
    intervalRef.current = setInterval(fetchClicks, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchClicks]);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const runMutation = useCallback(async (mutation: () => Promise<void>) => {
    epochRef.current += 1;
    mutatingRef.current = true;
    try {
      await mutation();
    } finally {
      mutatingRef.current = false;
    }
  }, []);

  const markAllRead = useCallback(() => {
    if (!user) return;
    setNotifications(prev => prev.map(n => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    runMutation(() => markAllClicksRead(user.id));
  }, [user, runMutation]);

  const dismissOne = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    runMutation(() => dismissClick(id));
  }, [runMutation]);

  const dismissAll = useCallback(() => {
    if (!user) return;
    setNotifications([]);
    runMutation(() => dismissAllClicks(user.id));
  }, [user, runMutation]);

  return { notifications, unreadCount, markAllRead, dismissOne, dismissAll, refetch: fetchClicks };
}
