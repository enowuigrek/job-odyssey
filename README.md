# Job Odyssey

Osobisty tracker kariery -- aplikacja desktopowa i webowa do zarządzania procesem rekrutacji. Śledź aplikacje o pracę, rozmowy kwalifikacyjne, wersje CV, pytania rekrutacyjne i historie STAR w jednym miejscu.

Wszystkie dane przechowywane są lokalnie na Twoim urządzeniu. Nic nie trafia na żadne serwery.

## Funkcjonalności

- **Dashboard** -- statystyki, nadchodzące rozmowy, wykresy statusów
- **Aplikacje** -- widok listy i Kanban z drag & drop, filtrowanie, zmiana statusów
- **Rozmowy kwalifikacyjne** -- planowanie, notatki po rozmowie, powiązanie z aplikacjami
- **Baza CV** -- przechowywanie wielu wersji CV, tagowanie słowami kluczowymi (ATS)
- **Pytania rekrutacyjne** -- baza pytań z kategoriami, poziomem trudności i własnymi odpowiedziami
- **Historie STAR** -- biblioteka historii w formacie Situation-Task-Action-Result
- **Eksport/Import** -- backup danych do JSON
- **Ciemny i jasny motyw** -- z persystencją wyboru

## Stack technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Frontend | React 19, TypeScript, React Router 7 |
| Styling | Tailwind CSS 4 |
| Desktop | Electron 40 |
| Build | Vite 7 |
| Ikony | Lucide React |
| Daty | date-fns |

## Wymagania

- Node.js >= 18
- npm >= 9

## Uruchomienie

### Przeglądarka (tryb deweloperski)

```bash
npm install
npm run dev
```

Aplikacja dostępna pod `http://localhost:5173`.

### Electron (tryb deweloperski)

```bash
npm install
npm run electron:dev
```

### Budowanie

```bash
# Web
npm run build

# Electron -- macOS
npm run electron:build:mac

# Electron -- Windows
npm run electron:build:win

# Electron -- macOS + Windows
npm run electron:build:all
```

Artefakty budowania Electron trafiają do katalogu `release/`.

## Struktura projektu

```
src/
  App.tsx                 # Routing (HashRouter)
  main.tsx                # Punkt wejścia React
  index.css               # Tailwind + system motywów

  pages/                  # Strony aplikacji
    DashboardPage.tsx
    ApplicationsPage.tsx
    InterviewsPage.tsx
    CVPage.tsx
    QuestionsPage.tsx
    StoriesPage.tsx
    SettingsPage.tsx

  components/
    ui/                   # Komponenty bazowe (Button, Card, Modal, Badge, ...)
    layout/               # Layout i Sidebar

  contexts/
    AppContext.tsx         # Globalny stan (useReducer + auto-zapis)
    ThemeContext.tsx       # Ciemny/jasny motyw

  types/                  # Definicje TypeScript
  utils/
    storage.ts            # Warstwa persystencji (localStorage / Electron IPC)

electron/
  main.cjs                # Proces główny Electron
  preload.cjs             # Preload script (contextBridge)
```

## Przechowywanie danych

- **Przeglądarka**: `localStorage` (klucz `job-odyssey-data`)
- **Electron**: `~/Documents/JobOdyssey/data.json`, pliki CV w `~/Documents/JobOdyssey/cv-files/`

## Skrypty

| Komenda | Opis |
|---------|------|
| `npm run dev` | Serwer deweloperski Vite |
| `npm run build` | Kompilacja TypeScript + build Vite |
| `npm run lint` | ESLint |
| `npm run preview` | Podgląd zbudowanej wersji |
| `npm run electron:dev` | Vite + Electron równolegle |
| `npm run electron:build:mac` | Build macOS |
| `npm run electron:build:win` | Build Windows |
| `npm run electron:build:all` | Build macOS + Windows |

## Licencja

Projekt prywatny. Copyright 2026 enowuigrek.
