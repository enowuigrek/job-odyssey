import { LegalPageLayout, LegalSection, LegalList } from '../components/layout/LegalPageLayout';

export function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Polityka cookies" updated="2026-07-01">
      <p className="text-sm text-slate-400 leading-relaxed bg-dark-800 p-4 border-l-2 border-primary-500">
        To jest wstępna wersja polityki cookies, przygotowana jako punkt wyjścia. Przed uruchomieniem
        aplikacji dla szerszego grona użytkowników zalecana jest weryfikacja treści przez prawnika.
      </p>

      <LegalSection title="§1 Co to są cookies i podobne technologie">
        <p>
          Cookies to małe pliki tekstowe zapisywane w przeglądarce. Job Odyssey wykorzystuje
          głównie mechanizm <span className="text-slate-200">localStorage</span> przeglądarki - technologię o
          podobnym charakterze do cookies, służącą do zapamiętywania danych lokalnie na Twoim
          urządzeniu.
        </p>
      </LegalSection>

      <LegalSection title="§2 Jakich technologii używamy">
        <p>Wykorzystujemy wyłącznie technologie niezbędne do działania Aplikacji:</p>
        <LegalList
          items={[
            'token uwierzytelniający (utrzymanie zalogowanej sesji),',
            'wybrany motyw kolorystyczny (jasny / ciemny),',
            'lokalnie zapisane linki do śledzenia i szkice tworzonego CV - żeby nie stracić pracy w razie odświeżenia strony,',
            'informacja, które powiadomienia o kliknięciach w CV zostały już przez Ciebie przejrzane.',
          ]}
        />
        <p>
          Wszystkie te dane są przypisane do Twojego konta i niedostępne dla innych użytkowników
          korzystających z tej samej przeglądarki.
        </p>
      </LegalSection>

      <LegalSection title="§3 Czego nie używamy">
        <p>
          Job Odyssey nie korzysta z plików cookies reklamowych ani analitycznych podmiotów
          trzecich (np. Google Analytics, Meta Pixel). Nie profilujemy użytkowników w celach
          marketingowych.
        </p>
      </LegalSection>

      <LegalSection title="§4 Zarządzanie danymi lokalnymi">
        <p>
          Możesz w każdej chwili usunąć dane zapisane lokalnie w przeglądarce z poziomu jej ustawień
          (np. „Wyczyść dane przeglądania"). Zwróć uwagę, że usunięcie tych danych może wylogować
          Cię z Aplikacji lub spowodować utratę niezapisanego szkicu CV.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
