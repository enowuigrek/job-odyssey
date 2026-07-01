# Agents / AI context

Kontekst biznesowy: ~/Documents/nowy-kontekst/projekty/job-odyssey.md
Właściciel: Łukasz Nowak (lukasznowak.dev)

## Stack

- **React 19** + **TypeScript ~5.9** + **Vite 7** + **Tailwind CSS 4**
- **Routing:** React Router v7 (`react-router-dom`)
- **Backend/auth:** Supabase (`@supabase/supabase-js`) — auth, baza danych, storage
- **CV generator:** `@react-pdf/renderer`, `pdf-lib`, `pdfjs-dist`, `docx`
- **State:** Context API + useReducer (`src/contexts/AppContext.tsx`)
- **Dane:** Supabase (profil, CV, aplikacje) + localStorage (linki, powiadomienia, draft CV)
- **Inne:** `date-fns`, `lucide-react`, `uuid`

> Uwaga: w repozytorium mogą być pozostałości kodu Electron (`electron/`, `src/types/electron.d.ts`, `src/utils/storage.ts`). To nieaktywne legacy — aplikacja działa wyłącznie w przeglądarce.

## Struktura folderów

```
src/
  components/
    cv/          # komponenty widoku i edytora CV
    layout/      # shell aplikacji, nawigacja
    tracking/    # widoki śledzenia kliknięć w linki
    ui/          # wspólne prymitywy UI (Badge, Button itp.)
  contexts/      # AppContext.tsx — główny stan aplikacji
  hooks/         # useProfile, useUserLinks, useCVLinkMappings, useClickNotifications
  lib/           # db.ts, supabase.ts, generateCV.ts, pdfTagging.ts, profileDb.ts
  pages/         # strony: Dashboard, Applications, Interviews, CV*, Profile, Links...
  templates/     # szablony CV
  types/         # index.ts — wszystkie typy (ApplicationStatus, InterviewStatus itp.)
  utils/         # storage.ts (legacy Electron detection — nieużywane)
supabase/
  functions/     # Edge Functions
  migrations/    # SQL migracje bazy danych
```

## Zmienne środowiskowe (bez wartości)

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_GA_MEASUREMENT_ID   # opcjonalne — Google Analytics, ładowany dopiero po zgodzie w banerze cookies
```

Plik `.env` w katalogu głównym (nie commitowany).

## Konwencje

- Komunikacja i etykiety UI po polsku; komentarze w kodzie po polsku
- Bez emoji w kodzie i komunikatach
- Statusy aplikacji (9): `saved → applied → interview → pending → success` / `rejected_no_interview` / `rejected_after_interview` / `offer_declined` / `withdrawn`
- Typy trzymane centralnie w `src/types/index.ts`
- Warianty Badge i etykiety statusów w `src/components/ui/Badge.tsx`

## Jak odpalić lokalnie

```bash
# Dev (przeglądarka)
npm run dev

# Sprawdzenie typów (szybkie, wystarczy do weryfikacji)
npx tsc --noEmit

# Build produkcyjny
npm run build
```

## DESIGN.md — system wizualny

Plik z tokenami designu i wytycznymi wizualnymi:
`~/Documents/nowy-kontekst/design/job-odyssey.md`

- Czytaj go PRZED każdą zmianą stylów, kolorów, typografii lub layoutu.
- Gdy Cowork zaktualizuje ten plik i poprosi o synchronizację — przepisz zmiany do odpowiednich plików CSS / Tailwind config / komponentów.
- Nowe komponenty buduj zgodnie z tokenami z tego pliku — nie dodawaj nowych wartości bez jednoczesnej aktualizacji DESIGN.md.
- Tokeny kolorów są w `src/index.css` w bloku `@theme`. Nie używaj surowych klas Tailwind (`green-*`, `red-*`, `yellow-*`, `gray-*`) — zawsze odpowiednik systemowy (`success-*`, `danger-*`, `warning-*`, `slate-*`).
- Hex tylko w `src/templates/cv/CVTemplate.tsx` (react-pdf nie obsługuje CSS vars) — wszędzie indziej zmienne.

## CONTENT.md — treści strony

Plik: `~/Documents/nowy-kontekst/content/job-odyssey.md`

- Zawiera gotowe teksty do wszystkich sekcji strony: Hero, Problem, Rozwiazanie, Jak to dziala, Dla kogo, CTA.
- **Czytaj przed kazda zmiana tekstow w komponentach.** Plik jest zrodlem prawdy dla copywritingu.
- Workflow: Cowork edytuje tresc w pliku → Lukasz zleca synchronizacje → Claude Code aktualizuje komponenty React.
- Zmiany w kodzie NIE wyprzedzaja zmian w pliku — najpierw plik, potem kod.

## Log zmian (najnowsze na górze)

- `f8e7197` Add "import from profile" functionality to CV editor
- `af74a34` Increase card vertical padding to py-2.5
- `9362f61` Unify card hover and add interview deep-link
- `6c70177` Tighten kanban card padding and fix interview modal
- `cd48627` Fix hover icons and status UX on cards
- `deae145` Refactor applications and interviews cards UX
- `5f72c30` Kanban: hover-reveal icons; Dashboard: clickable recent apps
- `7e2c9b4` CV editor: auto-fill from profile, clean up toolbar and bottom bar
- `a7ed607` Fix missing name field in useProfile default state
- `2d60336` Refactor profile to per-section sub-pages, add name field, clean up CV editor
- `d22ff29` Add Profil kandydata — master candidate profile feature
- `96fbd39` Pin RODO clause to bottom of CV page
- `04de2f6` Prevent orphan company headers across page breaks in CV
- `3d6e969` Fix draft save — persist CV name on edit mode
- `caea043` Add left teal border to education detail block in CV
