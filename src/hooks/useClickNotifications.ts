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

    // Przy KAŻDYM odpytaniu zgłaszamy applicationId wszystkich klików z ostatnich 20 —
    // nie tylko "nowych" względem poprzedniego fetcha ani nieprzeczytanych. Wcześniejsza
    // wersja porównywała z zapamiętanym w pamięci zestawem ID: jeśli ta konkretna zakładka
    // przegapiła jeden cykl (zakładka w tle, uśpiony komputer, wyścig przy remouncie) albo
    // user zdążył otworzyć dzwonek (co ustawia readAt) zanim aktualizacja statusu zdążyła
    // się odpalić, kliknięcie nigdy już nie zostawało uznane za "nowe" i status aplikacji
    // zostawał na zawsze nieprzestawiony na "CV przeglądane" — zgłoszony bug, kliknięcie
    // sprzed 3h wciąż wisiało w "Wysłana". handleNewClicks w stronach i sidebarze jest
    // idempotentny (aktualizuje status tylko gdy wciąż jest "applied"/"saved"), więc
    // zgłaszanie tego samego id co 30s jest nieszkodliwe — a jest samonaprawcze, bo
    // próbuje ponownie przy każdym odpytaniu aż faktycznie się uda.
    if (onNewClicks) {
      const appIds = [...new Set(mapped.map(n => n.applicationId).filter(Boolean))];
      if (appIds.length > 0) {
        onNewClicks(appIds);
      }
    }
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
