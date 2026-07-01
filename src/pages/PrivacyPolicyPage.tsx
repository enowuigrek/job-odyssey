import { LegalPageLayout, LegalSection, LegalList } from '../components/layout/LegalPageLayout';

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Polityka prywatności" updated="2026-07-01">
      <p className="text-sm text-slate-400 leading-relaxed bg-dark-800 p-4 border-l-2 border-primary-500">
        To jest wstępna wersja polityki prywatności, przygotowana jako punkt wyjścia. Przed
        uruchomieniem aplikacji dla szerszego grona użytkowników zalecana jest weryfikacja treści
        przez prawnika specjalizującego się w RODO.
      </p>

      <LegalSection title="§1 Administrator danych">
        <p>
          Administratorem danych osobowych przetwarzanych w związku z korzystaniem z Job Odyssey
          jest Łukasz Nowak, lukasznowak.dev, kontakt: kontakt@lukasznowak.dev.
        </p>
      </LegalSection>

      <LegalSection title="§2 Jakie dane przetwarzamy">
        <p>W związku z prowadzeniem konta przetwarzamy:</p>
        <LegalList
          items={[
            'dane rejestracyjne: adres e-mail, hasło (w formie zaszyfrowanej przez dostawcę usług uwierzytelniania),',
            'dane profilu kandydata: imię i nazwisko, lokalizacja, telefon, opisy zawodowe, doświadczenie, wykształcenie, technologie, certyfikaty (wraz z opcjonalnie wgranymi plikami),',
            'dane wprowadzane do aplikacji: aplikacje o pracę, rozmowy kwalifikacyjne, wersje CV, pytania rekrutacyjne i historie STAR,',
            'dane techniczne dotyczące śledzenia CV: znacznik czasu otwarcia linku w wysłanym CV, typ przeglądarki osoby klikającej (user agent) oraz adres strony, z której nastąpiło przekierowanie (referrer) - wyłącznie w celu poinformowania użytkownika o zainteresowaniu jego aplikacją,',
            'dane analityczne (wyłącznie za Twoją zgodą): zanonimizowane statystyki odwiedzin zbierane przez Google Analytics - patrz Polityka cookies.',
          ]}
        />
      </LegalSection>

      <LegalSection title="§3 Cele i podstawy prawne przetwarzania">
        <LegalList
          items={[
            <>
              Świadczenie usługi (prowadzenie konta, przechowywanie danych, generowanie CV) - art. 6
              ust. 1 lit. b RODO (wykonanie umowy).
            </>,
            <>
              Śledzenie otwarć linków w CV - art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes
              administratora oraz użytkownika w uzyskaniu informacji zwrotnej o wysłanej aplikacji).
            </>,
            <>
              Analiza ruchu na stronie (Google Analytics) - art. 6 ust. 1 lit. a RODO (Twoja zgoda
              wyrażona w banerze cookies). Możesz ją cofnąć w dowolnym momencie.
            </>,
            <>
              Kontakt w sprawach reklamacji i wsparcia - art. 6 ust. 1 lit. f RODO (prawnie
              uzasadniony interes w postaci obsługi zgłoszeń).
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="§4 Komu przekazujemy dane">
        <p>
          Dane przechowywane są w infrastrukturze dostawcy Supabase (baza danych, uwierzytelnianie,
          przechowywanie plików), który działa jako podmiot przetwarzający na zlecenie Administratora.
        </p>
        <p>
          Jeśli wyrazisz zgodę na cookies analityczne, zanonimizowane dane o ruchu na stronie trafiają
          też do Google LLC (Google Analytics), co może wiązać się z przekazaniem danych poza
          Europejski Obszar Gospodarczy. Szczegóły w Polityce cookies.
        </p>
        <p>
          Dane nie są sprzedawane ani udostępniane podmiotom trzecim w celach marketingowych.
        </p>
      </LegalSection>

      <LegalSection title="§5 Okres przechowywania">
        <p>
          Dane przechowywane są przez czas trwania konta w Aplikacji. Po usunięciu konta dane
          zostają trwale usunięte z bazy danych, z zastrzeżeniem sytuacji, w których dłuższe
          przechowywanie wynika z obowiązków prawnych ciążących na Administratorze.
        </p>
      </LegalSection>

      <LegalSection title="§6 Prawa użytkownika">
        <p>W związku z przetwarzaniem danych osobowych przysługuje Ci prawo do:</p>
        <LegalList
          items={[
            'dostępu do swoich danych,',
            'sprostowania danych,',
            'usunięcia danych (możliwe samodzielnie w ustawieniach konta),',
            'ograniczenia przetwarzania,',
            'przenoszenia danych,',
            'wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie,',
            'wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO).',
          ]}
        />
      </LegalSection>

      <LegalSection title="§7 Bezpieczeństwo danych">
        <p>
          Dostęp do danych każdego użytkownika jest odizolowany na poziomie bazy danych (Row Level
          Security) - żaden użytkownik nie ma technicznej możliwości odczytania danych innego konta.
          Połączenie z Aplikacją jest szyfrowane (HTTPS).
        </p>
      </LegalSection>

      <LegalSection title="§8 Dane osób trzecich">
        <p>
          Funkcja śledzenia linków w CV rejestruje moment otwarcia linku przez odbiorcę CV (np.
          rekrutera). Rejestrowane są wyłącznie dane techniczne niezbędne do działania funkcji, nie
          są one wykorzystywane do budowania profilu takiej osoby ani przekazywane dalej.
        </p>
      </LegalSection>

      <LegalSection title="§9 Zmiany polityki">
        <p>
          Administrator zastrzega sobie prawo do zmiany niniejszej polityki. O istotnych zmianach
          użytkownicy zostaną poinformowani drogą e-mailową lub komunikatem w Aplikacji.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
