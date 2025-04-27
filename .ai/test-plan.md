## Plan testów dla projektu 10xCards

### 1. Wprowadzenie i cele testowania

#### Wprowadzenie
Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji 10xCards, platformy do tworzenia i nauki fiszek wspomaganej przez sztuczną inteligencję. Plan obejmuje strategie, zakresy, typy testów oraz procedury niezbędne do zapewnienia wysokiej jakości produktu przed jego wdrożeniem i w trakcie rozwoju.

#### Cele testowania
1. **Zapewnienie niezawodności aplikacji** - potwierdzenie, że wszystkie funkcjonalności działają zgodnie z wymaganiami
2. **Weryfikacja bezpieczeństwa** - sprawdzenie zabezpieczeń związanych z autentykacją i przetwarzaniem danych
3. **Walidacja wydajności** - zapewnienie optymalnego działania pod różnym obciążeniem
4. **Potwierdzenie jakości generowanych treści przez AI** - weryfikacja przydatności i poprawności fiszek tworzonych przez sztuczną inteligencję
5. **Weryfikacja użyteczności i dostępności** - zapewnienie intuicyjnego i dostępnego interfejsu dla różnych grup użytkowników
6. **Zapewnienie zgodności z przepisami** - weryfikacja zgodności z RODO i innymi regulacjami

### 2. Zakres testów

#### Funkcjonalności objęte testami
1. **System autentykacji i zarządzania kontami**
   - Rejestracja użytkowników
   - Logowanie
   - Odzyskiwanie hasła
   - Zarządzanie profilem
   - Wylogowywanie

2. **System generowania fiszek z pomocą AI**
   - Przetwarzanie wprowadzanego tekstu
   - Generowanie propozycji fiszek
   - Edycja i akceptacja wygenerowanych fiszek
   - Statystyki generacji

3. **Zarządzanie zestawami fiszek**
   - Tworzenie zestawów
   - Dodawanie/usuwanie fiszek
   - Edycja zestawów
   - Organizowanie i kategoryzowanie zestawów

4. **System nauki**
   - Algorytm powtórek interwałowych
   - Sesje nauki
   - Śledzenie postępu
   - Statystyki nauki

5. **Personalizacja i customizacja**
   - Dostosowywanie wyglądu fiszek
   - Ustawienia użytkownika
   - Preferencje nauki

#### Funkcjonalności wyłączone z testów
1. Zewnętrzne API OpenRouter.ai (będzie mockowane)
2. Procesy związane z płatnościami (nie są częścią MVP)
3. Import dokumentów w formatach PDF/DOCX
4. Integracje z zewnętrznymi platformami edukacyjnymi
5. Aplikacje mobilne (tylko wersja webowa)

### 3. Typy testów do przeprowadzenia

#### Testy jednostkowe
1. **Zakres**: Funkcje i komponenty frontendowe, usługi backendowe, walidatory danych
2. **Narzędzia**: Vitest dla komponentów React, Node.js test runner dla usług
3. **Metryka pokrycia**: Minimum 75% pokrycia kodu dla krytycznych komponentów

#### Testy integracyjne
1. **Zakres**: Interakcje między komponentami, integracja z Supabase, przepływ danych między warstwami
2. **Narzędzia**: Testing Library dla React, Supertest dla API, Supabase Local Emulator dla backendu
3. **Podejście**: Testowanie przepływów danych od UI do bazy danych i z powrotem

#### Testy end-to-end
1. **Zakres**: Pełne przepływy użytkownika od rejestracji do zaawansowanej nauki
2. **Narzędzia**: Cypress lub Playwright
3. **Scenariusze**: Główne ścieżki użytkownika symulujące rzeczywiste interakcje

#### Testy wydajnościowe
1. **Zakres**: Czas odpowiedzi API, wydajność operacji bazodanowych, renderowanie UI
2. **Narzędzia**: Lighthouse, k6 dla testów obciążeniowych API
3. **Metryki**: Czas ładowania < 2s, interaktywność < 3s, TBT < 300ms

#### Testy bezpieczeństwa
1. **Zakres**: Autentykacja, autoryzacja, walidacja danych, podatności OWASP Top 10
2. **Narzędzia**: OWASP ZAP, testy penetracyjne, statyczna analiza kodu
3. **Podejście**: Automatyczne skanowanie + manualne testy scenariuszowe

#### Testy dostępności
1. **Zakres**: Zgodność z WCAG 2.1 na poziomie AA
2. **Narzędzia**: Axe, Pa11y
3. **Podejście**: Automatyczne testy + manualna weryfikacja dla złożonych komponentów

#### Testy wizualne
1. **Zakres**: UI komponentów, responsywność, zgodność z design systemem
2. **Narzędzia**: Storybook, Percy lub podobne
3. **Podejście**: Snapshot testing + wizualne regresje

#### Testy zgodności z przeglądarkami
1. **Zakres**: Główne przeglądarki (Chrome, Firefox, Safari, Edge)
2. **Narzędzia**: BrowserStack lub podobne
3. **Pokrycie**: Ostatnie 2 wersje głównych przeglądarek

#### Testy AI i generacji treści
1. **Zakres**: Jakość generowanych fiszek, odporność na złośliwe prompty, zgodność z wytycznymi
2. **Narzędzia**: Własne narzędzia do oceny jakości, testy automatyczne i manualne
3. **Podejście**: Testowanie z różnorodnymi zestawami danych wejściowych i ocena wyników

### 4. Scenariusze testowe dla kluczowych funkcjonalności

#### Autentykacja i zarządzanie kontem
1. **Rejestracja użytkownika**
   - Rejestracja z poprawnymi danymi
   - Próba rejestracji z już istniejącym emailem
   - Walidacja wymaganych pól
   - Weryfikacja wiadomości potwierdzającej
   - Rejestracja z niepoprawnym formatem danych

2. **Logowanie użytkownika**
   - Logowanie z poprawnymi danymi
   - Próba logowania z nieprawidłowymi danymi
   - Logowanie z zablokowanym kontem
   - Funkcjonalność "zapamiętaj mnie"
   - Mechanizm blokady po zbyt wielu nieudanych próbach

3. **Odzyskiwanie hasła**
   - Żądanie resetowania dla istniejącego konta
   - Żądanie resetowania dla nieistniejącego konta
   - Ustawienie nowego hasła z poprawnym tokenem
   - Próba z wygasłym tokenem
   - Walidacja nowego hasła

#### Generowanie fiszek przez AI
1. **Generacja fiszek z tekstu**
   - Generacja z krótkim tekstem (< 1000 znaków)
   - Generacja z długim tekstem (> 5000 znaków)
   - Generacja z tekstem w różnych językach
   - Generacja z tekstem zawierającym specjalistyczną terminologię
   - Weryfikacja czasu generacji i responsywności interfejsu

2. **Edycja i zarządzanie wygenerowanymi fiszkami**
   - Akceptacja wszystkich wygenerowanych fiszek
   - Akceptacja wybranych fiszek
   - Edycja fiszki przed akceptacją
   - Odrzucenie wszystkich fiszek
   - Generacja nowego zestawu po odrzuceniu

3. **Statystyki generacji**
   - Weryfikacja licznika wygenerowanych fiszek
   - Weryfikacja licznika zaakceptowanych fiszek
   - Weryfikacja licznika edytowanych fiszek
   - Poprawność statystyk po usunięciu zestawu

#### Zarządzanie zestawami fiszek
1. **Tworzenie i edycja zestawów**
   - Tworzenie nowego pustego zestawu
   - Dodawanie fiszek do zestawu
   - Usuwanie fiszek z zestawu
   - Zmiana nazwy i opisu zestawu
   - Usuwanie całego zestawu

2. **Organizacja zestawów**
   - Sortowanie zestawów według różnych kryteriów
   - Filtrowanie zestawów
   - Wyszukiwanie zestawów po nazwie/opisie
   - Paginacja przy dużej liczbie zestawów

#### System nauki
1. **Sesje nauki z algorytmem powtórek**
   - Inicjacja sesji nauki dla nowego zestawu
   - Weryfikacja kolejności fiszek zgodnie z algorytmem
   - Oznaczanie fiszek jako "nauczone" w różnych stopniach
   - Poprawność terminów powtórek
   - Kontynuacja nauki po przerwie w sesji

2. **Śledzenie postępu**
   - Wyświetlanie aktualnego stanu nauki dla zestawu
   - Aktualizacja statystyk po sesji nauki
   - Wyświetlanie długoterminowych statystyk
   - Resetowanie postępu dla wybranych fiszek lub zestawów

#### Personalizacja
1. **Dostosowywanie fiszek**
   - Zmiana kolorów fiszki
   - Dodawanie odnośników do fiszki
   - Zmiana formatowania tekstu
   - Zapisywanie i aplikowanie ustawień

2. **Preferencje użytkownika**
   - Zmiana ustawień językowych
   - Zmiana ustawień powiadomień
   - Dostosowanie algorytmu powtórek
   - Przełączanie trybów jasnego/ciemnego

### 5. Środowisko testowe

#### Środowisko deweloperskie
1. **Konfiguracja**: Lokalne środowisko deweloperskie z emulowanymi usługami Supabase
2. **Cel**: Testy jednostkowe i podstawowe testy integracyjne
3. **Dostęp**: Dostępne dla wszystkich deweloperów

#### Środowisko testowe
1. **Konfiguracja**: Środowisko na DigitalOcean z oddzielną instancją Supabase
2. **Cel**: Zaawansowane testy integracyjne, testy wydajnościowe, testy e2e
3. **Odświeżanie danych**: Codzienne resetowanie danych lub na żądanie
4. **Dostęp**: Zespół QA, deweloperzy

#### Środowisko staging
1. **Konfiguracja**: Konfiguracja identyczna z produkcyjną, ale z ograniczonym dostępem
2. **Cel**: Testy UAT, testy regresyjne, testy wydajnościowe
3. **Odświeżanie danych**: Tygodniowa kopia danych produkcyjnych (zanonimizowane)
4. **Dostęp**: Zespół QA, liderzy zespołów, interesariusze

#### Wymagania dla środowisk testowych
1. **Sprzętowe**: 4 vCPU, 8GB RAM, 100GB SSD dla każdej instancji
2. **Sieciowe**: Stabilne połączenie z przepustowością min. 100Mbps
3. **Oprogramowanie**: Node.js v22.14.0, Docker, PostgreSQL 15
4. **Narzędzia monitorujące**: Grafana, Prometheus dla zbierania metryk podczas testów

### 6. Narzędzia do testowania

#### Testowanie frontendowe
1. **Vitest** - szybki framework do testów jednostkowych
2. **React Testing Library** - testy komponentów React 
3. **Storybook** - testowanie izolowanych komponentów UI
4. **Percy** lub **Chromatic** - testy wizualne i regresyjne
5. **Axe** - testy dostępności

#### Testowanie backendowe
1. **Supertest** - testowanie endpointów API
2. **Supabase CLI** - lokalna instancja Supabase do testów
3. **PostgreSQL client** - bezpośrednie testowanie bazy danych
4. **MSW (Mock Service Worker)** - mockowanie odpowiedzi API

#### Testowanie end-to-end
1. **Playwright** lub **Cypress** - automatyzacja testów e2e
2. **BrowserStack** - testy na różnych przeglądarkach i urządzeniach

#### Testowanie wydajnościowe
1. **Lighthouse** - audyty stron i aplikacji webowych
2. **k6** - testy obciążeniowe API
3. **WebPageTest** - zaawansowana analiza wydajności

#### Testowanie bezpieczeństwa
1. **OWASP ZAP** - automatyczne skanowanie podatności
2. **SonarQube** - statyczna analiza kodu
3. **Snyk** - skanowanie zależności

#### Zarządzanie testami
1. **GitHub Actions** - automatyzacja i CI/CD
2. **Allure** lub **TestRail** - raportowanie wyników testów
3. **JIRA** - śledzenie błędów i zadań testowych

### 7. Harmonogram testów

#### Testowanie podczas developmentu (ciągłe)
1. **Testy jednostkowe**: Wykonywane przez deweloperów przy każdej zmianie kodu
2. **Podstawowe testy integracyjne**: Wykonywane przy pull requestach
3. **Testy statyczne**: Analiza kodu przy każdym commit (ESLint, TypeScript)

#### Testowanie przy wydaniu wersji (sprint 2-tygodniowy)
1. **Tydzień 1**:
   - Dni 1-3: Testy funkcjonalne nowych funkcjonalności
   - Dni 4-5: Testy integracyjne i end-to-end
   - Dni 6-7: Pierwsza runda poprawek

2. **Tydzień 2**:
   - Dni 1-2: Testy regresyjne
   - Dzień 3: Testy wydajnościowe
   - Dzień 4: Testy bezpieczeństwa
   - Dzień 5: Finalna walidacja przed wydaniem
   - Dni 6-7: Wsparcie po wydaniu i monitoring

#### Testowanie okresowe (co kwartał)
1. **Kompleksowe testy bezpieczeństwa**: Pełna analiza bezpieczeństwa i podatności
2. **Zaawansowane testy wydajnościowe**: Testy skalowalności i wytrzymałości
3. **Audyt dostępności**: Pełna weryfikacja WCAG

### 8. Kryteria akceptacji testów

#### Kryteria funkcjonalne
1. **Pokrycie testami**: Min. 75% pokrycia kodu testami
2. **Testy krytycznych ścieżek**: 100% powodzenia
3. **Testy regresyjne**: 100% powodzenia

#### Kryteria wydajnościowe
1. **Czas ładowania strony**: < 2s dla pierwszego contenful paint
2. **Czas generacji fiszek**: < 10s dla standardowego tekstu (do 5000 znaków)
3. **Czas odpowiedzi API**: < 500ms dla 95% requestów
4. **Wskaźnik Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1

#### Kryteria bezpieczeństwa
1. **Podatności krytyczne**: Zero
2. **Podatności wysokiego ryzyka**: Zero
3. **Podatności średniego ryzyka**: Zaadresowane z planem naprawy
4. **Zgodność z OWASP Top 10**: Pełna

#### Kryteria dostępności
1. **Zgodność z WCAG 2.1 AA**: 95% wymagań spełnionych
2. **Testy na czytnikach ekranowych**: Wszystkie krytyczne funkcje działające

#### Kryteria jakości generowanych treści AI
1. **Jakość wygenerowanych fiszek**: 75% akceptowalnych bez edycji
2. **Czas generacji**: 95% generacji zakończonych w czasie < 15s
3. **Odporność na złośliwe prompty**: 100% odrzuconych lub bezpiecznie obsłużonych

### 9. Role i odpowiedzialności w procesie testowania

#### Kierownik ds. jakości (QA Lead)
1. Opracowanie i aktualizacja strategii testów
2. Koordynacja wszystkich działań związanych z testowaniem
3. Raportowanie statusu testów interesariuszom
4. Zarządzanie zasobami testowymi

#### Inżynierowie QA
1. Projektowanie przypadków testowych
2. Wykonywanie testów manualnych
3. Tworzenie i utrzymywanie testów automatycznych
4. Raportowanie i śledzenie defektów

#### Deweloperzy
1. Tworzenie i utrzymywanie testów jednostkowych
2. Przeprowadzanie code review z perspektywy testowalności
3. Współpraca przy naprawianiu zgłoszonych defektów
4. Wsparcie w tworzeniu mockowych serwisów

#### Specjaliści ds. użyteczności
1. Projektowanie i wykonywanie testów użyteczności
2. Analiza doświadczeń użytkownika
3. Przeprowadzanie testów dostępności
4. Rekomendacje ulepszeń UX/UI

#### Specjaliści ds. bezpieczeństwa
1. Wykonywanie testów bezpieczeństwa
2. Analiza podatności i zagrożeń
3. Rekomendacje dotyczące poprawy bezpieczeństwa
4. Weryfikacja zgodności z RODO

#### Product Owner
1. Definiowanie kryteriów akceptacji
2. Weryfikacja zgodności z wymaganiami biznesowymi
3. Priorytetyzacja defektów
4. Akceptacja końcowa przed wydaniem

### 10. Procedury raportowania błędów

#### Klasyfikacja defektów
1. **Krytyczne**: Uniemożliwiają korzystanie z kluczowych funkcji, powodują utratę danych lub naruszają bezpieczeństwo
2. **Wysokie**: Poważnie utrudniają korzystanie z funkcji, ale istnieje obejście problemu
3. **Średnie**: Powodują niedogodności, ale nie zakłócają głównych funkcji
4. **Niskie**: Drobne problemy kosmetyczne lub sugestie ulepszeń

#### Proces zgłaszania defektów
1. **Rejestracja**: Defekt zostaje zarejestrowany w systemie JIRA z odpowiednią kategorią i priorytetem
2. **Opis**: Szczegółowy opis zawierający:
   - Kroki do odtworzenia
   - Faktyczny rezultat
   - Oczekiwany rezultat
   - Środowisko testowe
   - Zrzuty ekranu/nagrania
3. **Triaging**: QA Lead weryfikuje i potwierdza defekt, przypisuje priorytet
4. **Przydzielenie**: Defekt zostaje przydzielony do odpowiedniego dewelopera
5. **Naprawa**: Developer naprawia defekt i oznacza go jako "gotowy do testów"
6. **Weryfikacja**: QA weryfikuje naprawę i zmienia status na "zamknięty" lub "otwarty ponownie"
7. **Zamknięcie**: Defekt zostaje ostatecznie zamknięty po weryfikacji

#### SLA dla naprawy defektów
1. **Defekty krytyczne**: Naprawa w ciągu 24 godzin
2. **Defekty wysokie**: Naprawa w ciągu 3 dni roboczych
3. **Defekty średnie**: Naprawa w ciągu 7 dni roboczych lub zaplanowanie do przyszłego sprintu
4. **Defekty niskie**: Naprawa według uznania i dostępności zasobów

#### Raportowanie statusu
1. **Codzienne podsumowanie**: Raport ze statusem otwartych defektów krytycznych i wysokich
2. **Tygodniowe podsumowanie**: Kompleksowy raport zawierający:
   - Liczbę nowych/zamkniętych/ponownie otwartych defektów
   - Rozkład defektów według priorytetu i komponentu
   - Trend defektów w czasie
   - Metryki jakości (pokrycie testami, % zaliczonych testów)
3. **Raport przedwydaniowy**: Szczegółowa analiza wszystkich defektów, ryzyk i rekomendacji

#### Procedura eskalacji
1. Defekty krytyczne są natychmiast eskalowane do QA Lead i kierownika projektu
2. Jeśli defekt krytyczny nie jest rozwiązywany zgodnie z SLA, następuje eskalacja do wyższego kierownictwa
3. Konflikty dotyczące klasyfikacji defektów są rozwiązywane przez QA Lead, kierownika projektu i Product Ownera