# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu
10xCards to aplikacja webowa umożliwiająca automatyczne generowanie i zarządzanie fiszkami edukacyjnymi z wykorzystaniem sztucznej inteligencji. Aplikacja ma na celu znaczące usprawnienie procesu nauki metodą spaced repetition poprzez eliminację czasochłonnego, ręcznego tworzenia fiszek. Produkt oferuje prosty, intuicyjny interfejs, który minimalizuje liczbę kliknięć potrzebnych do utworzenia wartościowych materiałów edukacyjnych. Główną przewagą konkurencyjną 10xCards jest wykorzystanie AI do automatycznego generowania wysokiej jakości fiszek na podstawie wprowadzonego tekstu.

## 2. Problem użytkownika
Manualne tworzenie wysokiej jakości fiszek jest czasochłonne i męczące, co zniechęca użytkowników do efektywnego korzystania z metody spaced repetition. Dodatkowo, początkujący użytkownicy często mają trudności z tworzeniem poprawnych fiszek, co obniża efektywność nauki. Kluczowe aspekty problemu:
- Duży nakład czasu potrzebny na utworzenie zestawu fiszek
- Trudność w formułowaniu odpowiednich pytań i odpowiedzi
- Zniechęcenie wynikające z pracochłonności procesu
- Niska efektywność samodzielnie tworzonych fiszek u początkujących użytkowników

## 3. Wymagania funkcjonalne
- Automatyczne generowanie fiszek przez AI na podstawie wprowadzonego tekstu (kopiuj-wklej)
- Możliwość ręcznego tworzenia, przeglądania, edytowania i usuwania fiszek
- Prosty system kont użytkowników z rejestracją, logowaniem oraz bezpiecznym dostępem do danych
- Integracja fiszek z gotowym algorytmem powtórek
- Sesje nauki z wykorzystaniem algorytmu powtórek
- Opcje personalizacji fiszek (tekst, kolory, odnośniki)
- Statystyki generowania i akceptacji fiszek
- Prosty, intuicyjny interfejs użytkownika z minimalną liczbą kliknięć
- Zarządzanie zestawami fiszek (grupowanie tematyczne)
- Ocena czytelności fiszek (np. według skali FOG)
- Eksport danych użytkownika zgodnie z wymogami RODO

1. Automatyczne generowanie fiszek:
   - Użytkownik wkleja dowolny tekst (np. fragment podręcznika).
   - Aplikacja wysyła tekst do modelu LLM za pośrednictwem API.
   - Model LLM proponuje zestaw fiszek (pytania i odpowiedzi).
   - Fiszki są przedstawiane użytkownikowi w formie listy z możliwością akceptacji, edycji lub odrzucenia.

2. Ręczne tworzenie i zarządzanie fiszkami:
   - Formularz do ręcznego tworzenia fiszek (przód i tył fiszki).
   - Opcje edycji i usuwania istniejących fiszek.
   - Ręczne tworzenie i wyświetlanie w ramach widoku listy "Moje fiszki"

3. Podstawowy system uwierzytelniania i kont użytkowników:
   - Rejestracja i logowanie.
   - Możliwość usunięcia konta i powiązanych fiszek na życzenie.

4. Integracja z algorytmem powtórek:
   - Zapewnienie mechanizmu przypisywania fiszek do harmonogramu powtórek (korzystanie z gotowego algorytmu).
   - Brak dodatkowych metadanych i zaawansowanych funkcji powiadomień w MVP.

5. Przechowywanie i skalowalność:
   - Dane o fiszkach i użytkownikach przechowywane w sposób zapewniający skalowalność i bezpieczeństwo.

6. Statystyki generowania fiszek:
   - Zbieranie informacji o tym, ile fiszek zostało wygenerowanych przez AI i ile z nich ostatecznie zaakceptowano.

7. Wymagania prawne i ograniczenia:
   - Dane osobowe użytkowników i fiszek przechowywane zgodnie z RODO.
   - Prawo do wglądu i usunięcia danych (konto wraz z fiszkami) na wniosek użytkownika.

## 4. Granice produktu
- Brak własnego, zaawansowanego algorytmu powtórek (korzystanie z gotowych rozwiązań, biblioteki open-source)
- Brak wsparcia dla importu różnych formatów dokumentów (PDF, DOCX, itp.)
- Brak funkcji współdzielenia zestawów fiszek między użytkownikami
- Brak integracji z zewnętrznymi platformami edukacyjnymi (w ramach MVP)
- Na początek brak aplikacji mobilnych – projekt ogranicza się do wersji web
- Brak zaawansowanych funkcji społecznościowych

## 5. Historyjki użytkowników

### US-001
- Tytuł: Automatyczne generowanie fiszek
- Opis: Jako użytkownik chcę, aby system generował fiszki na podstawie wprowadzonego tekstu, abym mógł zaoszczędzić czas i wysiłek.
- Kryteria akceptacji:
  - Użytkownik może wkleić tekst do wyznaczonego pola
  - System generuje zestaw fiszek z pytaniami i odpowiedziami (przód i tył)
  - Fiszki generowane przez AI zawierają poprawne i sensowne pytania oraz odpowiedzi
  - Minimum 75% wygenerowanych fiszek musi być akceptowanych przez użytkownika
  - Proces generowania nie trwa dłużej niż 30 sekund dla standardowego tekstu

### US-002
- Tytuł: Ręczne tworzenie i edycja fiszek
- Opis: Jako użytkownik chcę mieć możliwość ręcznego tworzenia, przeglądania i edytowania fiszek, aby móc dostosować treść do swoich potrzeb.
- Kryteria akceptacji:
  - Interfejs umożliwia intuicyjne tworzenie nowych fiszek (przód i tył)
  - Użytkownik może łatwo dodać, zedytować lub usunąć fiszkę
  - Interfejs umożliwia intuicyjne zarządzanie fiszkami z minimalną liczbą kliknięć
  - Zmiany są zapisywane automatycznie

### US-003
- Tytuł: Rejestracja i logowanie użytkownika
- Opis: Jako nowy użytkownik chcę się zarejestrować i zalogować, aby móc bezpiecznie przechowywać swoje fiszki.
- Kryteria akceptacji:
  - Logowanie i rejestracja odbywają się na dedykowanych stronach.
  - Logowanie wymaga podania adresu email i hasła.
  - Rejestracja wymaga podania adresu email, hasła i potwierdzenia hasła.
  - Użytkownik MOŻE przejść wyłącznie do strony powitalnej bez zalogowania do systemu
  - Użytkownik NIE MOŻE korzystać z funkcji Kolekcji bez logowania się do systemu (US-001, US-009).
  - Użytkownik może logować się do systemu poprzez przycisk w prawym górnym rogu.
  - Użytkownik może się wylogować z systemu poprzez przycisk w prawym górnym rogu w głównym @Layout.astro.
  - Nie korzystamy z zewnętrznych serwisów logowania (np. Google, GitHub).
  - Odzyskiwanie hasła powinno być możliwe.

### US-004
- Tytuł: Sesja nauki z fiszkami
- Opis: Jako użytkownik chcę korzystać z sesji nauki, podczas której będą mi prezentowane fiszki zgodnie z algorytmem powtórek.
- Kryteria akceptacji:
  - System prezentuje fiszki w kolejności określonej przez algorytm powtórek
  - Użytkownik może oznaczyć stopień znajomości materiału (np. "zapamiętane", "częściowo zapamiętane", "niezapamiętane")
  - System dostosowuje kolejność i częstotliwość pojawiania się fiszek na podstawie odpowiedzi użytkownika
  - Użytkownik może przerwać i wznowić sesję nauki w dowolnym momencie
  - System pokazuje postęp sesji (np. liczba pozostałych fiszek, czas nauki)

### US-005
- Tytuł: Personalizacja fiszek
- Opis: Jako użytkownik chcę móc personalizować swoje fiszki, aby lepiej dopasować je do moich potrzeb.
- Kryteria akceptacji:
  - Użytkownik może modyfikować tekst pytań i odpowiedzi
  - Użytkownik może zmieniać kolory fiszek
  - Użytkownik może dodawać odnośniki do powiązanych fiszek
  - System zapisuje wszystkie zmiany personalizacyjne

### US-006
- Tytuł: Akceptacja lub odrzucenie wygenerowanych fiszek
- Opis: Jako użytkownik chcę móc akceptować, modyfikować lub odrzucać fiszki wygenerowane przez AI, aby mieć kontrolę nad jakością materiałów.
- Kryteria akceptacji:
  - Interfejs umożliwia łatwe zaakceptowanie, modyfikację lub odrzucenie każdej fiszki
  - System zapisuje decyzje użytkownika
  - Odrzucone fiszki są usuwane z zestawu
  - Zmodyfikowane fiszki zastępują oryginalne propozycje AI

### US-007
- Tytuł: Przeglądanie statystyk generowania
- Opis: Jako użytkownik chcę mieć dostęp do statystyk dotyczących generowania fiszek, aby monitorować efektywność procesu.
- Kryteria akceptacji:
  - System zbiera dane o liczbie wygenerowanych fiszek
  - System śledzi wskaźnik akceptacji fiszek
  - Użytkownik ma dostęp do prostego dashboardu ze statystykami
  - Statystyki są aktualizowane w czasie rzeczywistym

### US-008
- Tytuł: Ocena czytelności fiszek
- Opis: Jako użytkownik chcę, aby system oceniał czytelność moich fiszek, co pomoże mi tworzyć lepsze materiały edukacyjne.
- Kryteria akceptacji:
  - System analizuje tekst fiszek pod kątem czytelności
  - System prezentuje ocenę czytelności (np. wg skali FOG)
  - Użytkownik otrzymuje sugestie dotyczące poprawy czytelności
  - Ocena czytelności jest widoczna przy przeglądaniu fiszek

### US-009
- Tytuł: Zarządzanie zestawami fiszek
- Opis: Jako użytkownik chcę móc organizować fiszki w zestawy tematyczne, aby efektywniej zarządzać materiałem do nauki.
- Kryteria akceptacji:
  - Użytkownik może tworzyć, edytować i usuwać zestawy fiszek
  - Użytkownik może przypisywać fiszki do jednego lub wielu zestawów
  - System umożliwia filtrowanie i wyszukiwanie fiszek według zestawów
  - Zestawy są widoczne w interfejsie użytkownika w sposób przejrzysty i intuicyjny

### US-010
- Tytuł: Obsługa błędów generowania fiszek
- Opis: Jako użytkownik chcę otrzymywać czytelne komunikaty w przypadku błędów podczas generowania fiszek przez AI, abym mógł podjąć odpowiednie działania.
- Kryteria akceptacji:
  - System wyświetla przyjazne dla użytkownika komunikaty w przypadku wystąpienia błędów
  - W przypadku niepowodzenia generowania, użytkownik otrzymuje sugestie alternatywnych działań
  - System automatycznie rejestruje błędy dla celów diagnostycznych
  - Użytkownik może ponowić próbę generowania bez utraty wprowadzonego tekstu

### US-011
- Tytuł: Zarządzanie danymi osobowymi
- Opis: Jako użytkownik chcę mieć kontrolę nad swoimi danymi osobowymi, aby chronić swoją prywatność zgodnie z przepisami RODO.
- Kryteria akceptacji:
  - Użytkownik może przeglądać wszystkie przechowywane dane związane z jego kontem
  - Użytkownik może eksportować swoje fiszki w prostym formacie
  - Użytkownik może usunąć swoje konto wraz ze wszystkimi powiązanymi danymi
  - System potwierdza skuteczne usunięcie wszystkich danych użytkownika po zamknięciu konta

### US-012
- Tytuł: Ustawienia konta i preferencje użytkownika
- Opis: Jako użytkownik chcę móc dostosować ustawienia konta i preferencje nauki, aby dostosować aplikację do moich potrzeb.
- Kryteria akceptacji:
  - Użytkownik może zmienić podstawowe dane konta (email, hasło)
  - Użytkownik może ustawić preferowane opcje wyświetlania fiszek (np. domyślne kolory)
  - Użytkownik może określić domyślną długość sesji nauki
  - Użytkownik może włączyć/wyłączyć powiadomienia o nadchodzących sesjach powtórek
  - System zapisuje i stosuje preferencje użytkownika we wszystkich częściach aplikacji

## 6. Metryki sukcesu
- Minimum 75% akceptacja fiszek generowanych przez AI
- Co najmniej 75% fiszek w systemie tworzonych z wykorzystaniem opcji automatycznych
- Ocena czytelności fiszek według skali FOG na poziomie odpowiednim dla docelowej grupy użytkowników
- Średni czas tworzenia zestawu 10 fiszek nie przekracza 5 minut
- Pozytywny feedback użytkowników dotyczący intuicyjności interfejsu (min. 80% zadowolonych użytkowników)
- Średni czas potrzebny na modyfikację wygenerowanej fiszki nie przekracza 30 sekund
- Retencja użytkowników: minimum 60% użytkowników powraca do aplikacji w ciągu tygodnia
- Liczba utworzonych zestawów fiszek przez użytkownika (średnio co najmniej 3 zestawy na aktywnego użytkownika)
- Średnia długość sesji nauki: co najmniej 10 minut
- Procent ukończonych sesji nauki: minimum 70%
