import { useCallback, useEffect, useState } from 'react';
import { loadAnalytics } from '../lib/analytics';

export type CookieConsent = 'accepted' | 'rejected';

const STORAGE_KEY = 'jo-cookie-consent';

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(
    () => (localStorage.getItem(STORAGE_KEY) as CookieConsent | null)
  );

  useEffect(() => {
    if (consent === 'accepted') loadAnalytics();
  }, [consent]);

  const accept = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setConsent('accepted');
  }, []);

  const reject = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    setConsent('rejected');
  }, []);

  return { consent, accept, reject };
}
