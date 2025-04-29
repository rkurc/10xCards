# Architektura UI dla 10xCards

## 1. Przegląd struktury UI

Architektura UI aplikacji 10xCards została zaprojektowana z myślą o intuicyjnym, zorientowanym na użytkownika doświadczeniu, skupionym wokół trzech głównych przepływów: generowania fiszek, zarządzania zestawami i nauki. Aplikacja wykorzystuje podejście oparte na komponentach z wyraźnym podziałem na widoki statyczne (renderowane przez Astro) oraz interaktywne wyspy React dla złożonej funkcjonalności.

Struktura UI opiera się na następujących kluczowych elementach:
- System autoryzacji jako warunkowy punkt wejścia
- Dashboard jako centralny hub nawigacyjny
- Dedykowane widoki funkcjonalne dla konkretnych zadań
- System powiadomień dla procesów asynchronicznych
- Komponenty UI zgodne z WCAG AA

Architektura wykorzystuje wzorzec Islands Architecture, minimalizując ilość JavaScript przesyłanego do przeglądarki, jednocześnie zapewniając bogate doświadczenie interaktywne w kluczowych elementach aplikacji.

## 2. Lista widoków

### 2.1 Auth View (Widok autoryzacji)
- **Ścieżka**: `/auth`
- **Główny cel**: Umożliwienie użytkownikom logowania lub rejestracji w systemie
- **Kluczowe informacje**: Formularze logowania i rejestracji, opcja resetowania hasła
- **Kluczowe komponenty**:
  - Formularz logowania
  - Formularz rejestracji
  - Link do resetowania hasła
- **UX i dostępność**:
  - Minimalna liczba pól wymaganych do rejestracji (email, hasło)
  - Wyraźne komunikaty walidacyjne
  - Zgodność z WCAG AA
  - Automatyczne przekierowanie dla zalogowanych użytkowników

### 2.2 Dashboard View (Widok główny)
- **Ścieżka**: `/dashboard`
- **Główny cel**: Centralny hub aplikacji z dostępem do wszystkich głównych funkcjonalności
- **Kluczowe informacje**: 
  - Zestawienie najnowszych zestawów fiszek
  - Skrót do generowania fiszek
  - Podstawowe statystyki użytkowania
- **Kluczowe komponenty**:
  - Karta "Generuj fiszki"
  - Lista ostatnich zestawów
  - Przyciski szybkiego dostępu
  - Pasek nawigacyjny
- **UX i dostępność**:
  - Wyraźne wizualnie przyciski akcji
  - Logiczny układ z priorytetyzacją najważniejszych funkcji
  - Adaptacja do różnych rozmiarów ekranu
  - Automatyczne przekierowanie do generowania dla nowych użytkowników

### 2.3 Text Input View (Wprowadzanie tekstu do generowania)
- **Ścieżka**: `/generate`
- **Główny cel**: Umożliwienie wprowadzenia tekstu do analizy i generowania fiszek
- **Kluczowe informacje**: 
  - Pole tekstowe z licznikiem znaków
  - Wybór parametrów generowania
  - Opcja wyboru istniejącego zestawu
- **Kluczowe komponenty**:
  - Duże pole tekstowe z walidacją
  - Selektor liczby fiszek
  - Dropdown wyboru zestawu
  - Przycisk "Generuj"
- **UX i dostępność**:
  - Walidacja w czasie rzeczywistym (min. 100, max. 10,000 znaków)
  - Wskaźniki stanu (ładowanie, błędy)
  - Inline errors dla problemów walidacyjnych
  - Przejrzyste etykiety pól

### 2.4 Card Review View (Przegląd wygenerowanych fiszek)
- **Ścieżka**: `/generate/review/{generation_id}`
- **Główny cel**: Umożliwienie przeglądu, edycji i akceptacji wygenerowanych fiszek oraz utworzenie nowego zestawu
- **Kluczowe informacje**: 
  - Lista wygenerowanych propozycji fiszek
  - Status generowania
  - Opcje edycji każdej fiszki
  - Formularz nazwy zestawu
- **Kluczowe komponenty**:
  - Lista kart z podglądem przód/tył
  - Kontrolki edycji dla każdej fiszki
  - Przyciski zaznaczania/odznaczania wszystkich
  - Modal finalizacji z formularzem nazwy zestawu
  - Przycisk "Finalizuj i utwórz zestaw"
  - Pasek postępu generowania
- **UX i dostępność**:
  - Możliwość przełączania widoku fiszki (przód/tył)
  - Wyraźne oznaczenia fiszek wybranych/odrzuconych
  - Inline edycja treści
  - Obowiązkowe pole nazwy zestawu przed finalizacją
  - Toast notifications dla zakończonych operacji

### 2.5 Card Set List View (Lista zestawów fiszek)
- **Ścieżka**: `/sets`
- **Główny cel**: Prezentacja i zarządzanie wszystkimi zestawami fiszek użytkownika
- **Kluczowe informacje**: 
  - Lista zestawów z podstawowymi metadanymi
  - Opcje sortowania i filtrowania
  - Szybkie akcje dla zestawów
- **Kluczowe komponenty**:
  - Grid/lista zestawów
  - Opcje sortowania i filtrowania
  - Przycisk tworzenia nowego zestawu
  - Menu akcji dla każdego zestawu
- **UX i dostępność**:
  - Przełączanie między widokiem siatki i listy
  - Wskaźniki liczby fiszek w każdym zestawie
  - Dostępne z klawiatury menu akcji
  - Lekkie animacje dla interakcji

### 2.6 Card Set Detail View (Szczegóły zestawu fiszek)
- **Ścieżka**: `/sets/{set_id}`
- **Główny cel**: Szczegółowy widok konkretnego zestawu wraz z jego fiszkami
- **Kluczowe informacje**: 
  - Dane zestawu (nazwa, opis)
  - Lista fiszek w zestawie
  - Opcje zarządzania zestawem
- **Kluczowe komponenty**:
  - Nagłówek z metadanymi zestawu
  - Lista fiszek z podglądem
  - Modal edycji zestawu
  - Przycisk "Dodaj fiszkę"
  - Przycisk "Generuj fiszki do tego zestawu"
- **UX i dostępność**:
  - Paginacja dla dużych zestawów
  - Filtrowanie fiszek w zestawie
  - Dostępność z klawiatury
  - Kontekstowe menu akcji dla każdej fiszki

### 2.7 Card Detail/Edit Modal (Modal edycji fiszki)
- **Ścieżka**: Modal (nie jest osobnym URL)
- **Główny cel**: Edycja pojedynczej fiszki z pełną funkcjonalnością
- **Kluczowe informacje**: 
  - Pełna treść fiszki (przód/tył)
  - Opcje personalizacji
  - Ocena czytelności
- **Kluczowe komponenty**:
  - Formularze edycji treści
  - Opcje personalizacji (kolory, rozmiar tekstu)
  - Wskaźnik czytelności
  - Przyciski zapisu/anulowania
- **UX i dostępność**:
  - Podgląd na żywo zmian
  - Walidacja w czasie rzeczywistym
  - Trap focus w modalu dla dostępności
  - Wyraźne przyciski akcji

### 2.8 User Profile View (Profil użytkownika)
- **Ścieżka**: `/profile`
- **Główny cel**: Zarządzanie profilem użytkownika i ustawieniami aplikacji
- **Kluczowe informacje**: 
  - Dane użytkownika
  - Ustawienia aplikacji
  - Opcje eksportu/usunięcia danych
- **Kluczowe komponenty**:
  - Formularz edycji profilu
  - Sekcja ustawień aplikacji
  - Opcje eksportu danych (RODO)
  - Opcja usunięcia konta
- **UX i dostępność**:
  - Grupowanie powiązanych ustawień
  - Wyraźne ostrzeżenia dla nieodwracalnych akcji
  - Potwierdzenia dla krytycznych operacji
  - Zgodność z WCAG AA

### 2.9 Statistics Dashboard (Panel statystyk)
- **Ścieżka**: `/statistics`
- **Główny cel**: Prezentacja statystyk generowania i efektywności nauki
- **Kluczowe informacje**: 
  - Statystyki generowania fiszek
  - Wskaźniki akceptacji/modyfikacji
  - Historia aktywności
- **Kluczowe komponenty**:
  - Wykresy i wizualizacje statystyk
  - Filtry czasowe danych
  - Karty kluczowych metryk
- **UX i dostępność**:
  - Przejrzyste wizualizacje danych
  - Alternatywne przedstawienia danych (tabele dla wykresów)
  - Filtry czasowe łatwe w użyciu
  - Opisy wykresów

## 3. Mapa podróży użytkownika

### Przepływ autoryzacji
1. Użytkownik wchodzi na stronę aplikacji
2. Jeśli nie jest zalogowany, zostaje przekierowany na `/auth`
3. Użytkownik loguje się lub rejestruje
4. Po udanej autoryzacji, użytkownik trafia na dashboard
5. Jeśli użytkownik nie ma jeszcze fiszek, zostaje automatycznie przekierowany do widoku generowania

### Przepływ generowania fiszek
1. Użytkownik wybiera opcję "Generuj fiszki" z dashboardu
2. Użytkownik wprowadza tekst i opcjonalne parametry w `/generate`
3. Po kliknięciu "Generuj" system rozpoczyna proces generowania
4. Użytkownik widzi pasek postępu
5. Po zakończeniu generowania użytkownik jest przenoszony do `/generate/review/{generation_id}`
6. Użytkownik przegląda, edytuje i zaznacza fiszki do zaakceptowania
7. Po kliknięciu "Finalizuj i utwórz zestaw" pojawia się modal z polem nazwy zestawu
8. Po zatwierdzeniu nazwy system tworzy nowy zestaw z wybranymi fiszkami
9. Użytkownik jest przekierowywany do widoku nowo utworzonego zestawu

### Przepływ zarządzania zestawami
1. Użytkownik przechodzi do `/sets` z menu nawigacyjnego
2. Użytkownik przegląda listę swoich zestawów
3. Użytkownik może:
   - Utworzyć nowy zestaw
   - Przejść do szczegółów istniejącego zestawu
   - Edytować nazwę/opis zestawu
   - Usunąć zestaw
4. W widoku szczegółowym zestawu użytkownik może:
   - Przeglądać fiszki w zestawie
   - Dodawać nowe fiszki
   - Edytować istniejące fiszki
   - Usuwać fiszki
   - Generować nowe fiszki do tego zestawu

## 4. Układ i struktura nawigacji

### Główna struktura nawigacji
- **Sticky Navigation Bar** (na górze ekranu)
  - Logo/Nazwa aplikacji (link do dashboardu)
  - Elementy nawigacji głównej:
    - Dashboard
    - Generuj fiszki
    - Moje zestawy
    - Statystyki
  - Dropdown profilu użytkownika:
    - Profil
    - Ustawienia
    - Wyloguj

- **Breadcrumbs** (pod główną nawigacją)
  - Pokazują ścieżkę od dashboardu do bieżącego widoku
  - Umożliwiają szybką nawigację do widoków nadrzędnych

- **Context Navigation** (w zależności od widoku)
  - W widoku zestawu: Tabs do przełączania między fiszkami, statystykami zestawu itp.
  - W widoku generowania: Steps indicator pokazujący etap procesu

### Hierarchia nawigacji
1. **Poziom główny**: Dashboard, Generowanie, Zestawy, Statystyki
2. **Poziom szczegółowy**: 
   - Szczegóły zestawu
   - Przegląd wygenerowanych fiszek
3. **Poziom modali i overlayów**:
   - Edycja fiszki
   - Edycja zestawu
   - Potwierdzenia akcji

### Dostosowanie do urządzeń mobilnych
- Na urządzeniach mobilnych główna nawigacja zwija się do hamburger menu
- Responsywny układ komponentów dostosowujący się do szerokości ekranu
- Uproszczone layouty na mniejszych ekranach

## 5. Kluczowe komponenty

### Komponenty autoryzacji
- **AuthForm** - Uniwersalny komponent formularza autoryzacji z przełączaniem między logowaniem, rejestracją i resetowaniem hasła
- **ProtectedRoute** - Wrapper chroniący dostęp do stron wymagających autoryzacji

### Komponenty zarządzania fiszkami
- **FlashcardComponent** - Uniwersalny komponent fiszki z możliwością odwracania (przód/tył)
- **FlashcardEditor** - Komponent do edycji treści fiszki z podglądem na żywo
- **FlashcardGrid/List** - Komponenty do wyświetlania kolekcji fiszek w różnych układach

### Komponenty zestawów
- **CardSetCard** - Reprezentacja zestawu w widoku listy/siatki
- **CardSetHeader** - Nagłówek szczegółów zestawu z metadanymi i akcjami
- **SetSelector** - Dropdown do wyboru zestawu

### Komponenty generowania fiszek
- **TextInput** - Rozbudowane pole tekstowe z licznikiem znaków i walidacją
- **GenerationProgressIndicator** - Wskaźnik postępu generowania
- **GeneratedCardsList** - Lista wygenerowanych fiszek z kontrolkami akceptacji/odrzucenia
- **SetNameForm** - Formularz do nazwania zestawu podczas finalizacji generowania

### Komponenty interfejsu użytkownika
- **NavigationBar** - Główny pasek nawigacyjny
- **Breadcrumbs** - Ścieżka nawigacyjna
- **ActionButton** - Ujednolicony przycisk akcji
- **Modal** - Dostępny komponent modalu
- **Toast** - System powiadomień nieblokujących
- **LoadingIndicator** - Wskaźniki ładowania (spinner, skeleton)

### Komponenty statystyk
- **StatCard** - Karta pojedynczej metryki statystycznej
- **Chart** - Wykres statystyk z dostępną alternatywą tekstową

### Komponenty obsługi błędów
- **ErrorBoundary** - Komponent przechwytujący błędy React
- **FormErrorMessage** - Ujednolicony format komunikatów błędów formularzy
- **EmptyState** - Widok pustego stanu (brak danych)
