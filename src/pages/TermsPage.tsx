import { LegalPageLayout, LegalSection, LegalList } from '../components/layout/LegalPageLayout';

export function TermsPage() {
  return (
    <LegalPageLayout title="Regulamin" updated="2026-07-01">
      <p className="text-sm text-slate-400 leading-relaxed bg-dark-800 p-4 border-l-2 border-primary-500">
        To jest wstępna wersja regulaminu, przygotowana jako punkt wyjścia. Przed uruchomieniem
        aplikacji dla szerszego grona użytkowników zalecana jest weryfikacja treści przez prawnika.
      </p>

      <LegalSection title="§1 Postanowienia ogólne">
        <p>
          Niniejszy regulamin określa zasady korzystania z aplikacji Job Odyssey (dalej: „Aplikacja"),
          dostępnej pod adresem [UZUPEŁNIĆ: adres domeny].
        </p>
        <p>
          Administratorem Aplikacji jest Łukasz Nowak, prowadzący działalność pod marką
          lukasznowak.dev, kontakt: kontakt@lukasznowak.dev (dalej: „Administrator").
        </p>
        <p>
          Korzystanie z Aplikacji oznacza akceptację niniejszego regulaminu w całości.
        </p>
      </LegalSection>

      <LegalSection title="§2 Czym jest Job Odyssey">
        <p>
          Job Odyssey to narzędzie do zarządzania procesem poszukiwania pracy: śledzenia aplikacji
          o pracę, rozmów kwalifikacyjnych, generowania i przechowywania wersji CV oraz śledzenia,
          czy i kiedy wysłane CV zostało otwarte.
        </p>
        <p>
          Aplikacja nie pośredniczy w rekrutacji, nie gwarantuje znalezienia pracy ani odpowiedzi od
          pracodawców i nie jest agencją zatrudnienia.
        </p>
      </LegalSection>

      <LegalSection title="§3 Konto użytkownika">
        <LegalList
          items={[
            'Założenie konta wymaga podania adresu e-mail i hasła oraz jego potwierdzenia.',
            'Użytkownik jest odpowiedzialny za zachowanie poufności danych logowania.',
            'Jedno konto może być używane wyłącznie przez jedną osobę fizyczną.',
            'Użytkownik może w każdej chwili usunąć konto z poziomu ustawień aplikacji.',
          ]}
        />
      </LegalSection>

      <LegalSection title="§4 Zasady korzystania">
        <p>Użytkownik zobowiązuje się do:</p>
        <LegalList
          items={[
            'podawania prawdziwych danych podczas rejestracji,',
            'niewykorzystywania Aplikacji do celów niezgodnych z prawem, w tym do śledzenia osób bez podstawy prawnej,',
            'nieudostępniania linków śledzących w sposób wprowadzający w błąd (np. ukrywania faktu śledzenia w sposób sprzeczny z przepisami o ochronie danych osobowych),',
            'nienaruszania praw osób trzecich, w tym praw autorskich do treści wgrywanych do Aplikacji (np. plików certyfikatów).',
          ]}
        />
      </LegalSection>

      <LegalSection title="§5 Dane i treści użytkownika">
        <p>
          Wszystkie dane wprowadzone przez użytkownika (profil, treści CV, notatki, historie STAR)
          pozostają jego własnością. Administrator przetwarza je wyłącznie w celu świadczenia usługi,
          zgodnie z Polityką Prywatności.
        </p>
        <p>
          Za treść i poprawność danych zamieszczanych w CV oraz innych dokumentach odpowiada
          wyłącznie użytkownik.
        </p>
      </LegalSection>

      <LegalSection title="§6 Odpłatność">
        <p>
          Na dzień publikacji niniejszego regulaminu Aplikacja jest dostępna nieodpłatnie.
          Administrator zastrzega sobie prawo do wprowadzenia w przyszłości płatnych planów lub
          funkcji - o czym użytkownicy zostaną poinformowani z odpowiednim wyprzedzeniem, a zmiana
          nie obejmie danych już wprowadzonych do Aplikacji.
        </p>
      </LegalSection>

      <LegalSection title="§7 Odpowiedzialność">
        <p>
          Aplikacja dostarczana jest w formule „tak jak jest" (as is). Administrator dokłada
          starań, aby działała poprawnie i nieprzerwanie, ale nie gwarantuje braku przerw
          technicznych, błędów czy utraty danych, i nie ponosi odpowiedzialności za szkody wynikłe
          z korzystania z Aplikacji w zakresie dopuszczalnym przez prawo.
        </p>
        <p>
          Administrator nie ponosi odpowiedzialności za decyzje rekrutacyjne pracodawców ani za
          skutki wynikające z treści przygotowanych przez użytkownika CV.
        </p>
      </LegalSection>

      <LegalSection title="§8 Rozwiązanie umowy">
        <p>
          Użytkownik może zrezygnować z korzystania z Aplikacji w dowolnym momencie, usuwając konto
          w ustawieniach. Usunięcie konta jest nieodwracalne i skutkuje trwałym usunięciem
          powiązanych danych, zgodnie z Polityką Prywatności.
        </p>
        <p>
          Administrator może zawiesić lub usunąć konto użytkownika w przypadku rażącego naruszenia
          niniejszego regulaminu.
        </p>
      </LegalSection>

      <LegalSection title="§9 Reklamacje">
        <p>
          Reklamacje dotyczące działania Aplikacji można zgłaszać na adres: kontakt@lukasznowak.dev.
          Administrator rozpatrzy reklamację w terminie 14 dni od jej otrzymania.
        </p>
      </LegalSection>

      <LegalSection title="§10 Postanowienia końcowe">
        <p>
          Administrator zastrzega sobie prawo do zmiany regulaminu. O istotnych zmianach użytkownicy
          zostaną poinformowani drogą e-mailową lub komunikatem w Aplikacji.
        </p>
        <p>
          W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy prawa
          polskiego.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
