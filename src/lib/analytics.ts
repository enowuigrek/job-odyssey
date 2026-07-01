const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let loaded = false;

/** Injects Google Analytics (gtag.js) — only call after the user has accepted cookies. */
export function loadAnalytics(): void {
  if (loaded || !GA_ID) return;
  loaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).dataLayer = (window as any).dataLayer || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function gtag(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });
}

export function isAnalyticsConfigured(): boolean {
  return !!GA_ID;
}
