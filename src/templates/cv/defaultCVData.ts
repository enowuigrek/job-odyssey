import { CVData } from './types';

export const defaultCVData: CVData = {
  name: 'ŁUKASZ NOWAK',
  subtitle: 'Frontend Developer | React | AI-Assisted Development',
  contact: {
    location: 'Częstochowa/Warszawa',
    phone: '509 266 079',
    email: 'thelukasznowak85@gmail.com',
    links: [
      { label: 'LinkedIn', url: 'https://linkedin.com/in/the-lukasz-nowak85' },
      { label: 'GitHub', url: 'https://github.com/enowuigrek' },
      { label: 'Portfolio', url: 'https://lukasznowak.dev' },
    ],
  },
  profile: `Frontend developer budujący produkcyjne aplikacje React metodą AI-assisted development. 4 działające projekty — od headless e-commerce (Shopify GraphQL, Zustand, Tailwind) przez voice-first PWA z pipeline'em AI (Whisper → GPT → TTS) po autorskie narzędzia analityczne z Firebase i Google Maps API. Pracuję z Claude Code i OpenAI API jako codziennymi narzędziami — od planowania architektury, przez implementację, po deployment.\n10+ lat doświadczenia B2B (Key Account Management, x-kom) daje mi perspektywę produktową i biznesową — rozumiem potrzeby użytkownika, priorytetyzuję skutecznie i dostarczam wartość, nie tylko kod.`,
  approach: `Buduję oprogramowanie z AI, nie obok niego. Modele językowe (Claude Code, GPT) to moje codzienne narzędzia — planuję architekturę w dialogu z AI, implementuję iteracyjnie i uczę się nowych technologii w kontekście realnych projektów. Zarządzam projektem, podejmuję decyzje architektoniczne i dostarczam działające produkty. Każdy z moich projektów to efekt tego podejścia — wdrożony i działający produkcyjnie.`,
  technologies: [
    {
      category: 'Frontend:',
      items: 'React, JavaScript ES6+, Next.js (podstawy), HTML5, CSS3, Tailwind CSS, Sass/SCSS, Zustand, Redux, React Router, Vite, Framer Motion',
    },
    {
      category: 'Backend / Integracje:',
      items: 'Shopify Storefront API (GraphQL), REST API, Firebase (Firestore real-time), Netlify Functions & Edge Functions, Node.js, Express',
    },
    {
      category: 'AI / Tooling:',
      items: 'Claude Code (codzienne narzędzie), OpenAI API (GPT-4o-mini, Whisper, TTS), Anthropic API, prompt engineering, integracja AI w aplikacjach webowych',
    },
    {
      category: 'Analityka i SEO:',
      items: 'Google Analytics 4 (custom events, e-commerce tracking, Consent Mode v2), JSON-LD structured data, Open Graph, generowanie sitemap',
    },
    {
      category: 'Narzędzia:',
      items: 'Git, GitHub, Figma, Netlify, Railway, VS Code, PWA (Service Worker, Manifest), Electron',
    },
  ],
  projects: [
    {
      name: 'STRZYKAWA — HEADLESS E-COMMERCE',
      tagline: 'Sklep internetowy dla lokalnej palarni kawy — zbudowany od zera jako headless Shopify na React.',
      description: `Pełny przepływ zakupowy: katalog z filtrowaniem (kraj, obróbka, profil palenia), 14+ meta pól produktowych, warianty wagowe, wybór formy i mielenia, koszyk z lazy creation i real-time sync z Shopify, kody rabatowe. Checkout z trzema metodami dostawy (kurier, Paczkomat InPost z Geowidget, odbiór osobisty). Pełny system kont klientów (rejestracja, logowanie, reset hasła, aktywacja, profil, historia zamówień). GA4 z custom behavioral events (widoczność nut smakowych ≥2s w viewport, wybór metody parzenia, kliknięcia w niedostępne produkty). SEO: dynamiczne meta tagi, JSON-LD (LocalBusiness, Product, BreadcrumbList), sitemap, product feed pod Google Shopping, Edge Functions do OG tagów. Architektura Atomic Design.`,
      stack: 'Stack: React, Vite, Tailwind CSS, Zustand, Shopify Storefront API (GraphQL), InPost Geowidget, GA4, Netlify (Edge Functions, Forms)',
      note: 'Zbudowany metodą AI-assisted development (Claude Code)',
      links: [
        { label: 'Strzykawa', url: 'https://strzykawa.com' },
        { label: 'Strzykawa GitHub', url: 'https://github.com/enowuigrek/strzykawa' },
      ],
    },
    {
      name: 'PERIA — VOICE-FIRST PWA',
      tagline: 'Aplikacja mobilna (PWA) do przechwytywania myśli głosem — bez pisania, bez organizowania.',
      description: `Mówisz swobodnie, AI (Whisper + GPT-4o-mini) transkrybuje i automatycznie rozbija wypowiedź na notatki, checklisty (z rozróżnieniem zakupów od zadań) i wydarzenia z datami. Prompt engineering z systemem priorytetów i parsowaniem dat względnych ("jutro", "w piątek o 15"). Real-time wizualizacja głosu (Web Audio API, analiza FFT w zakresie mowy 80Hz–3kHz). Eksport jednym kliknięciem do natywnych aplikacji (Kalendarz przez .ics, Notatki przez Share API). TTS — po przetworzeniu apka potwierdza głosem co zapisała (OpenAI TTS + smart caching). Offline-ready (Service Worker), localStorage, zero logowania. Aktywny rozwój — planowana wersja komercyjna w React Native.`,
      stack: 'Stack: React 19, Vite, SCSS Modules, OpenAI API (Whisper + GPT-4o-mini + TTS), Web Audio API, PWA',
      note: 'Architektura i implementacja z Claude Code + OpenAI API',
      links: [
        { label: 'Peria', url: 'https://lukasznowak.dev/projekt/peria' },
        { label: 'Peria GitHub', url: 'https://github.com/enowuigrek/peria' },
      ],
    },
    {
      name: 'JAKMYŚLISZ? — URBAN DATA COLLECTION TOOL',
      tagline: 'Autorski projekt łączący street art z technologią — naklejki z kodami QR w przestrzeni miejskiej.',
      description: `9+ aktywnych pytań, projekt rośnie. Mieszkańcy skanują, odpowiadają anonimowo i od razu widzą wyniki w wykresach z procentami plus losową ciekawostkę. Przy pytaniach lokalnych (najlepsza kawa, miejsce na randkę) odpowiedzi to realne lokale z Google Places API — z przyciskami nawigacji do Google Maps. Odpowiedzi otwarte normalizowane przez AI (Claude API). Panel admina: dashboard z KPI (skany, odpowiedzi, konwersja, powroty), wykresy trendów, generator naklejek QR (pojedyncze + arkusze A3), dynamiczne OG meta tagi (Edge Functions). Całość od koncepcji, przez design naklejek, development, deployment, aż po dystrybucję w terenie — one-man project.`,
      stack: 'Stack: React, Vite, SCSS, Firebase (Firestore real-time), Netlify Functions & Edge Functions, Anthropic API, Google Places API, Recharts',
      note: 'Vibe coding: od koncepcji do deploy\'u z AI',
      links: [
        { label: 'JakMyślisz', url: 'https://jakmyslisz.com/demo' },
        { label: 'JakMyślisz GitHub', url: 'https://github.com/enowuigrek/jakmyslisz' },
      ],
    },
    {
      name: 'X-TOOL — NARZĘDZIE WEWNĘTRZNE (X-KOM)',
      tagline: 'Narzędzie webowe zbudowane z własnej inicjatywy, automatyzujące codzienne zadania zespołu B2B (~15 osób).',
      description: `Główna funkcja: parser SKU — wklej cały mail od klienta, wielopoziomowa logika regex wyciąga numery produktów z linków, oznaczeń i tekstu, eliminując ręczne kopiowanie (z kilku minut do sekund). Generator linków do ERP (Microsoft Dynamics) — zamiast kilku kliknięć i ładowań, jedno pole i gotowy deep link. Dekoder maili z formularzy kontaktowych — zamiana nieczytelnego formatu jednowierszowego na sformatowany tekst. Projekt powstał jako odpowiedź na realne nieefektywności w procesie — wciąż używany przez byłych współpracowników.`,
      stack: 'Stack: JavaScript ES6+, HTML5, Sass/SCSS, Regex',
      links: [
        { label: 'X-Tool GitHub', url: 'https://github.com/enowuigrek/x-tool' },
      ],
    },
  ],
  experience: [
    {
      company: 'FREELANCE WEB DEVELOPER',
      companyLink: { label: 'Portfolio', url: 'https://lukasznowak.dev' },
      roles: [
        {
          title: 'lukasznowak.dev | 2025 – obecnie',
          years: '',
          bullets: [
            'Budowa sklepów e-commerce i aplikacji webowych metodą AI-assisted development (React, Shopify headless, Node.js)',
            'Codzienna praca z Claude Code i OpenAI API — od planowania architektury, przez implementację, po deployment i analitykę',
            'Samodzielne prowadzenie projektów end-to-end: od analizy potrzeb, przez development, po deployment i SEO',
          ],
        },
      ],
    },
    {
      company: 'X-KOM',
      roles: [
        {
          title: 'Senior Business Account Manager | 2022 – 2025',
          years: '',
          bullets: [
            'Zarządzanie portfelem kluczowych klientów B2B (Key Account Management) i budowanie długofalowych relacji',
            'Consultative selling — analiza potrzeb klientów i dobór rozwiązań dopasowanych do celów biznesowych',
            'Prowadzenie negocjacji handlowych z decydentami; zarządzanie pipeline\'em i raportowanie w CRM',
            'Inicjowanie i budowa wewnętrznego narzędzia (X-Tool) automatyzującego manualne procesy — adoptowane przez cały zespół B2B (~15 osób), skrócenie przygotowania ofert z minut do sekund; wciąż używane po moim odejściu',
          ],
        },
        {
          title: 'Ekspert ds. Obsługi Klienta Kluczowego | 2018 – 2022',
          years: '',
          bullets: [
            'Kompleksowa obsługa i rozwój strategicznych klientów B2B',
            'Procesy sprzedażowe oparte na analizie potrzeb i budowaniu zaufania',
          ],
        },
        {
          title: 'Starszy Opiekun Klienta Kluczowego | 2016 – 2018',
          years: '',
          bullets: [
            'Wsparcie przed- i posprzedażowe klientów biznesowych; zarządzanie reklamacjami',
          ],
        },
        {
          title: 'Starszy Specjalista ds. Sprzedaży Internetowej | 2012 – 2016',
          years: '',
          bullets: [
            'Realizacja celów sprzedażowych B2C i doradztwo produktowe',
          ],
        },
      ],
    },
    {
      company: 'CCIG',
      roles: [
        {
          title: 'Konsultant Telefoniczny | 2010 – 2011',
          years: '',
          bullets: [],
        },
      ],
    },
    {
      company: 'ENIRO (PANORAMA FIRM)',
      roles: [
        {
          title: 'Handlowiec B2B | 2010',
          years: '',
          bullets: [],
        },
      ],
    },
  ],
  education: [
    {
      school: 'POLITECHNIKA CZĘSTOCHOWSKA',
      degree: 'Zarządzanie — Zarządzanie Zasobami Ludzkimi',
      years: '2009 – 2011',
    },
    {
      school: 'SZKOŁA POLICEALNA „SIGMA"',
      degree: 'Organizacja Reklamy',
      years: '2007 – 2009',
    },
  ],
  interests: 'Kawa speciality • Pizza neapolitańska • Piwowarstwo domowe • Hip-hop / rap • Skateboarding • Rower • Psychologia społeczna • Filozofia',
  rodo: 'Wyrażam zgodę na przetwarzanie moich danych osobowych dla potrzeb niezbędnych do realizacji procesu rekrutacji.',
};
