# Plan testów jednostkowych dla projektu 10xCards

## Wprowadzenie

Na podstawie analizy dokumentacji projektowej (`prd.md`), planu testów (`test-plan.md`) oraz konfiguracji środowiska testowego (`test-env-setup.md`), dokument ten określa, które elementy komponentu dashboardu oraz powiązanej funkcjonalności należy objąć testami jednostkowymi. Dla każdego elementu przedstawiono uzasadnienie oraz propozycję podejścia testowego.

## Komponenty wymagające testów jednostkowych

### 1. Komponent DashboardContent

**Dlaczego testować?**
- Jest kluczowym komponentem interfejsu użytkownika, z którym użytkownik wchodzi w interakcję po zalogowaniu
- Zawiera logikę warunkowego wyświetlania zawartości w zależności od stanu uwierzytelnienia
- Wykorzystuje React Context (AuthContext) do zarządzania stanem użytkownika
- Zawiera obsługę błędów z wykorzystaniem ErrorBoundary
- Wykorzystuje Suspense do obsługi stanu ładowania

**Co testować?**
- **Renderowanie z poprawnym kontekstem użytkownika** - weryfikacja czy wszystkie elementy UI są poprawnie wyświetlane gdy użytkownik jest zalogowany
- **Wyświetlanie danych użytkownika** - sprawdzenie czy imię użytkownika jest poprawnie wyświetlane w powitaniu
- **Poprawność linków nawigacyjnych** - weryfikacja czy karty akcji zawierają właściwe linki do różnych sekcji aplikacji
- **Obsługa stanu ładowania** - sprawdzenie czy komponent LoadingFallback jest używany podczas ładowania danych
- **Obsługa błędów** - weryfikacja czy ErrorBoundary prawidłowo przechwytuje i wyświetla błędy

**Przykładowe podejście do testów:**
```jsx
// Test renderowania podstawowego widoku
it('renders welcome message with user name', () => {
  // Arrange
  render(<DashboardContent />, { wrapper: AuthContext.Provider });
  // Assert
  expect(screen.getByText(/Witaj, Test User!/i)).toBeInTheDocument();
});

// Test linków nawigacyjnych
it('renders navigation cards with correct links', () => {
  // Arrange
  render(<DashboardContent />, { wrapper: AuthContext.Provider });
  // Assert
  expect(screen.getByRole('link', { name: /Rozpocznij generowanie/i }))
    .toHaveAttribute('href', '/generate');
});
```

### 2. Klasa ErrorBoundary

**Dlaczego testować?**
- Obsługuje krytyczne przypadki błędów, które mogą wystąpić w aplikacji
- Jest używana w wielu miejscach w aplikacji, w tym w DashboardContent
- Poprawne działanie jest kluczowe dla doświadczenia użytkownika w przypadku awarii

**Co testować?**
- Przechwytywanie błędów i wyświetlanie komponentu zastępczego
- Poprawne renderowanie informacji o błędzie
- Resetowanie stanu po ustąpieniu błędu

### 3. Komponenty AuthContext/Provider

**Dlaczego testować?**
- Zarządzają kluczowym stanem aplikacji (stan uwierzytelnienia)
- Są używane w większości komponentów, w tym w DashboardContent
- Zapewniają dostęp do danych użytkownika i funkcji uwierzytelniania

**Co testować?**
- Inicjalizacja kontekstu z poprawnymi wartościami
- Obsługa zmiany stanu uwierzytelnienia
- Udostępnianie poprawnych metod (login, logout)
- Obsługa błędów uwierzytelniania

### 4. Komponenty kart akcji (Card)

**Dlaczego testować?**
- Są wielokrotnie wykorzystywane w DashboardContent
- Reprezentują kluczowe funkcjonalności aplikacji (generowanie fiszek, nauka, zestawy)
- Zawierają linki nawigacyjne, które muszą być poprawne

**Co testować?**
- Poprawne renderowanie tytułów i opisów
- Właściwe działanie przycisków i linków
- Odpowiednie style i klasy CSS

## Podejście do testów jednostkowych

### Grupowanie testów

Testy powinny być zorganizowane w logiczne grupy za pomocą bloków `describe` dla lepszej czytelności i organizacji:

```jsx
describe('DashboardContent', () => {
  describe('when user is authenticated', () => {
    // testy dla zalogowanego użytkownika
  });
  
  describe('when loading data', () => {
    // testy dla stanu ładowania
  });
  
  describe('when error occurs', () => {
    // testy dla obsługi błędów
  });
});
```

### Mocki i stuby

Należy stosować mocki dla zależności zewnętrznych:

1. **AuthContext** - mockowanie kontekstu uwierzytelniania dla różnych stanów (zalogowany, niezalogowany, ładowanie, błąd)
2. **Suspense i Suspense Fallback** - symulowanie stanów ładowania
3. **ErrorBoundary** - symulowanie różnych scenariuszy błędów

### Pokrycie testami

Zgodnie z dokumentem `test-plan.md`, należy dążyć do pokrycia testami jednostkowymi na poziomie przynajmniej 75% dla krytycznych komponentów. W przypadku DashboardContent należy przetestować:

- 100% ścieżek renderowania
- 100% przypadków obsługi błędów
- 100% wariantów interakcji użytkownika

## Priorytety testowania

### Wysoki priorytet
1. Podstawowe renderowanie DashboardContent z danymi użytkownika
2. Testy linków nawigacyjnych do głównych funkcji (generowanie, nauka, zestawy)
3. Obsługa błędów i przypadków brzegowych

### Średni priorytet
1. Testy różnych stanów komponentu (ładowanie, sukces, błąd)
2. Testy dostępności (a11y) dla elementów interfejsu

### Niski priorytet
1. Testy stylowania i wyglądu wizualnego (lepiej objąć testami e2e/snapshot)
2. Testy edge case'ów, które są mało prawdopodobne w normalnym użytkowaniu

## Podsumowanie

Testy jednostkowe komponentu DashboardContent i powiązanych elementów są kluczowe dla zapewnienia niezawodnego działania aplikacji 10xCards. Koncentrując się na testowaniu logiki renderowania, przepływu danych i obsługi błędów, możemy zwiększyć pewność, że ten centralny element interfejsu użytkownika działa zgodnie z oczekiwaniami.

Testy powinny być pisane zgodnie z zasadą AAA (Arrange-Act-Assert) i wykorzystywać React Testing Library do testowania komponentów z perspektywy użytkownika, skupiając się na funkcjonalności, a nie na szczegółach implementacji.
