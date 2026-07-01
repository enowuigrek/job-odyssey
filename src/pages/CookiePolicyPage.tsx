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
          zarówno cookies, jak i mechanizm <span className="text-slate-200">localStorage</span> przeglądarki -
          technologię o podobnym charakterze, służącą do zapamiętywania danych lokalnie na Twoim
          urządzeniu.
        </p>
      </LegalSection>

      <LegalSection title="§2 Cookies niezbędne (funkcjonalne)">
        <p>Bez zgody, ponieważ są konieczne do działania Aplikacji:</p>
        <LegalList
          items={[
            'token uwierzytelniający (utrzymanie zalogowanej sesji),',
            'wybrany motyw kolorystyczny (jasny / ciemny),',
            'lokalnie zapisane linki do śledzenia i szkice tworzonego CV - żeby nie stracić pracy w razie odświeżenia strony,',
            'informacja, które powiadomienia o kliknięciach w CV zostały już przez Ciebie przejrzane,',
            'Twój wybór dotyczący zgody na cookies analityczne (opisane niżej).',
          ]}
        />
        <p>
          Wszystkie te dane są przypisane do Twojego konta i niedostępne dla innych użytkowników
          korzystających z tej samej przeglądarki.
        </p>
      </LegalSection>

      <LegalSection title="§3 Cookies analityczne (za zgodą)">
        <p>
          Za Twoją zgodą wykorzystujemy Google Analytics do analizy ruchu na stronie (np. liczba
          odwiedzin, popularne podstrony, ogólna lokalizacja geograficzna). Google Analytics
          zapisuje pliki cookies i przekazuje zanonimizowane dane (skrócony adres IP) do Google.
        </p>
        <p>
          Dane te są przetwarzane przez Google LLC, co może wiązać się z przekazaniem danych poza
          Europejski Obszar Gospodarczy. Szczegóły:{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            polityka prywatności Google
          </a>.
        </p>
        <p>
          Nie korzystamy z cookies reklamowych ani z narzędzi profilujących w celach
          marketingowych (np. Meta Pixel).
        </p>
      </LegalSection>

      <LegalSection title="§4 Zarządzanie zgodą">
        <p>
          Przy pierwszej wizycie możesz zaakceptować lub odrzucić cookies analityczne w banerze na
          dole ekranu. Jeśli odrzucisz, Google Analytics nie zostanie w ogóle załadowany. Swój
          wybór możesz w każdej chwili zmienić, czyszcząc dane lokalne przeglądarki dla tej strony
          (baner pojawi się ponownie).
        </p>
        <p>
          Możesz też w każdej chwili usunąć dane zapisane lokalnie w przeglądarce z poziomu jej
          ustawień (np. „Wyczyść dane przeglądania"). Zwróć uwagę, że usunięcie tych danych może
          wylogować Cię z Aplikacji lub spowodować utratę niezapisanego szkicu CV.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
