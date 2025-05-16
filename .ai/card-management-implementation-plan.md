# API Endpoints Implementation Plan: Card Set Management

## 1. Przegląd punktów końcowych

Ten plan implementacji obejmuje zestaw powiązanych ze sobą endpointów, które pozwalają użytkownikom na zarządzanie zestawami fiszek:

1. **GET /api/card-sets**: Pobieranie wszystkich zestawów fiszek użytkownika z obsługą paginacji
2. **POST /api/card-sets**: Tworzenie nowego zestawu fiszek
3. **GET /api/card-sets/{id}**: Pobieranie konkretnego zestawu fiszek wraz z powiązanymi fiszkami
4. **PUT /api/card-sets/{id}**: Aktualizacja istniejącego zestawu fiszek
5. **DELETE /api/card-sets/{id}**: Usunięcie zestawu fiszek (usunięcie miękkie)
6. **POST /api/card-sets/{id}/cards**: Dodawanie fiszek do zestawu
7. **DELETE /api/card-sets/{id}/cards/{card_id}**: Usuwanie fiszki z zestawu

Te endpointy umożliwiają kompletne zarządzanie zestawami fiszek, pozwalając użytkownikom na organizowanie swoich materiałów edukacyjnych w logiczne kolekcje.

## 2. Szczegóły żądań

### 2.1 GET /api/card-sets

- **Metoda HTTP**: GET
- **Wzorzec URL**: `/api/card-sets`
- **Parametry zapytania**: 
  - `page` (opcjonalny): Numer strony dla paginacji (domyślnie: 1)
  - `limit` (opcjonalny): Liczba elementów na stronę (domyślnie: 10)
- **Nagłówki zapytania**:
  - `Authorization`: Token JWT do uwierzytelniania użytkownika
- **Body zapytania**: Brak

### 2.2 POST /api/card-sets

- **Metoda HTTP**: POST
- **Wzorzec URL**: `/api/card-sets`
- **Parametry zapytania**: Brak
- **Nagłówki zapytania**:
  - `Authorization`: Token JWT do uwierzytelniania użytkownika
  - `Content-Type`: application/json
- **Body zapytania**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```

### 2.3 GET /api/card-sets/{id}

- **Metoda HTTP**: GET
- **Wzorzec URL**: `/api/card-sets/{id}`
- **Parametry ścieżki**:
  - `id` (wymagany): UUID zestawu fiszek
- **Parametry zapytania**:
  - `page` (opcjonalny): Numer strony dla paginacji fiszek (domyślnie: 1)
  - `limit` (opcjonalny): Liczba fiszek na stronę (domyślnie: 10)
- **Nagłówki zapytania**:
  - `Authorization`: Token JWT do uwierzytelniania użytkownika
- **Body zapytania**: Brak

### 2.4 PUT /api/card-sets/{id}

- **Metoda HTTP**: PUT
- **Wzorzec URL**: `/api/card-sets/{id}`
- **Parametry ścieżki**:
  - `id` (wymagany): UUID zestawu fiszek
- **Parametry zapytania**: Brak
- **Nagłówki zapytania**:
  - `Authorization`: Token JWT do uwierzytelniania użytkownika
  - `Content-Type`: application/json
- **Body zapytania**:
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```

### 2.5 DELETE /api/card-sets/{id}

- **Metoda HTTP**: DELETE
- **Wzorzec URL**: `/api/card-sets/{id}`
- **Parametry ścieżki**:
  - `id` (wymagany): UUID zestawu fiszek
- **Parametry zapytania**: Brak
- **Nagłówki zapytania**:
  - `Authorization`: Token JWT do uwierzytelniania użytkownika
- **Body zapytania**: Brak

### 2.6 POST /api/card-sets/{id}/cards

- **Metoda HTTP**: POST
- **Wzorzec URL**: `/api/card-sets/{id}/cards`
- **Parametry ścieżki**:
  - `id` (wymagany): UUID zestawu fiszek
- **Parametry zapytania**: Brak
- **Nagłówki zapytania**:
  - `Authorization`: Token JWT do uwierzytelniania użytkownika
  - `Content-Type`: application/json
- **Body zapytania**:
  ```json
  {
    "card_ids": ["uuid"]
  }
  ```

### 2.7 DELETE /api/card-sets/{id}/cards/{card_id}

- **Metoda HTTP**: DELETE
- **Wzorzec URL**: `/api/card-sets/{id}/cards/{card_id}`
- **Parametry ścieżki**:
  - `id` (wymagany): UUID zestawu fiszek
  - `card_id` (wymagany): UUID fiszki
- **Parametry zapytania**: Brak
- **Nagłówki zapytania**:
  - `Authorization`: Token JWT do uwierzytelniania użytkownika
- **Body zapytania**: Brak

## 3. Wykorzystywane typy

Do implementacji endpointów zarządzania zestawami fiszek potrzebne będą następujące typy, które są już zdefiniowane w `src/types.ts`:

- **CardSetDTO**: Reprezentuje zestaw fiszek zwracany przez API
- **CardSetWithCardCount**: Rozszerzenie CardSetDTO o liczbę fiszek w zestawie
- **CardSetCreateCommand**: Komenda do tworzenia nowego zestawu fiszek
- **CardSetUpdateCommand**: Komenda do aktualizacji istniejącego zestawu fiszek
- **CardSetListResponse**: Paginowana odpowiedź dla endpointu listy zestawów fiszek
- **CardSetWithCardsDTO**: Reprezentuje zestaw fiszek wraz z jego fiszkami
- **CardToSetAddCommand**: Komenda do dodawania fiszek do zestawu
- **CardToSetAddResponse**: Odpowiedź po dodaniu fiszek do zestawu
- **CardDTO**: Reprezentuje fiszkę zwracaną przez API
- **PaginationInfo**: Wspólna struktura informacji o paginacji

Dodatkowo, dla implementacji dostępu do bazy danych wymagane będą typy z wygenerowanego pliku `src/db/database.types.ts`.

## 4. Szczegóły odpowiedzi

### 4.1 GET /api/card-sets

- **Odpowiedź sukcesu** (200 OK):
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "card_count": "number",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "pages": "number"
    }
  }
  ```
- **Odpowiedzi błędów**:
  - 400 Bad Request: Nieprawidłowe parametry
  - 401 Unauthorized: Użytkownik nie jest uwierzytelniony

### 4.2 POST /api/card-sets

- **Odpowiedź sukcesu** (201 Created): Kompletny obiekt CardSetDTO
- **Odpowiedzi błędów**:
  - 400 Bad Request: Nieprawidłowe dane wejściowe (np. nazwa przekracza limit długości)
  - 401 Unauthorized: Użytkownik nie jest uwierzytelniony

### 4.3 GET /api/card-sets/{id}

- **Odpowiedź sukcesu** (200 OK):
  ```json
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "cards": {
      "data": [
        {
          "id": "uuid",
          "front_content": "string",
          "back_content": "string",
          "source_type": "ai|ai_edited|manual",
          "readability_score": "number",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ],
      "pagination": {
        "total": "number",
        "page": "number",
        "limit": "number",
        "pages": "number"
      }
    }
  }
  ```
- **Odpowiedzi błędów**:
  - 401 Unauthorized: Użytkownik nie jest uwierzytelniony
  - 404 Not Found: Zestaw fiszek nie istnieje lub nie należy do użytkownika

### 4.4 PUT /api/card-sets/{id}

- **Odpowiedź sukcesu** (200 OK): Zaktualizowany obiekt CardSetDTO
- **Odpowiedzi błędów**:
  - 400 Bad Request: Nieprawidłowe dane wejściowe
  - 401 Unauthorized: Użytkownik nie jest uwierzytelniony
  - 404 Not Found: Zestaw fiszek nie istnieje lub nie należy do użytkownika

### 4.5 DELETE /api/card-sets/{id}

- **Odpowiedź sukcesu** (204 No Content): Brak treści
- **Odpowiedzi błędów**:
  - 401 Unauthorized: Użytkownik nie jest uwierzytelniony
  - 404 Not Found: Zestaw fiszek nie istnieje lub nie należy do użytkownika

### 4.6 POST /api/card-sets/{id}/cards

- **Odpowiedź sukcesu** (200 OK):
  ```json
  {
    "added_count": "number"
  }
  ```
- **Odpowiedzi błędów**:
  - 400 Bad Request: Nieprawidłowe dane wejściowe (np. brak identyfikatorów fiszek)
  - 401 Unauthorized: Użytkownik nie jest uwierzytelniony
  - 404 Not Found: Zestaw fiszek nie istnieje lub nie należy do użytkownika

### 4.7 DELETE /api/card-sets/{id}/cards/{card_id}

- **Odpowiedź sukcesu** (204 No Content): Brak treści
- **Odpowiedzi błędów**:
  - 401 Unauthorized: Użytkownik nie jest uwierzytelniony
  - 404 Not Found: Zestaw fiszek lub fiszka nie istnieje lub nie należy do użytkownika

## 5. Przepływ danych

### 5.1 GET /api/card-sets

1. Pobranie UUID użytkownika z żądania (nagłówek lub sesja)
2. Walidacja parametrów zapytania (page, limit)
3. Pobranie danych z bazy:
   - Wykonanie zapytania do tabeli `card_sets`, filtrując po `user_id` i `is_deleted = false`
   - Wykonanie zapytania agregującego do tabeli `cards_to_sets`, aby policzyć liczbę fiszek w każdym zestawie
4. Transformacja danych do odpowiedniego formatu odpowiedzi
5. Zwrócenie danych z informacjami o paginacji

### 5.2 POST /api/card-sets

1. Pobranie UUID użytkownika z żądania (nagłówek lub sesja)
2. Walidacja danych wejściowych (name, description)
3. Utworzenie nowego rekordu w tabeli `card_sets`
4. Zwrócenie utworzonego zestawu fiszek

### 5.3 GET /api/card-sets/{id}

1. Pobranie UUID użytkownika z żądania (nagłówek lub sesja)
2. Walidacja parametru id jako prawidłowego UUID
3. Walidacja parametrów zapytania (page, limit)
4. Pobranie danych z bazy:
   - Pobranie zestawu fiszek z tabeli `card_sets`
   - Weryfikacja, że zestaw należy do użytkownika i nie jest usunięty
   - Pobranie powiązanych fiszek poprzez złączenie tabel `cards_to_sets` i `cards`
5. Transformacja danych do odpowiedniego formatu odpowiedzi
6. Zwrócenie zestawu fiszek wraz z fiszkami i informacjami o paginacji

### 5.4 PUT /api/card-sets/{id}

1. Pobranie UUID użytkownika z żądania (nagłówek lub sesja)
2. Walidacja parametru id jako prawidłowego UUID
3. Walidacja danych wejściowych (name, description)
4. Aktualizacja rekordu w tabeli `card_sets`:
   - Weryfikacja, że zestaw należy do użytkownika i nie jest usunięty
   - Aktualizacja pól name, description i updated_at
5. Zwrócenie zaktualizowanego zestawu fiszek

### 5.5 DELETE /api/card-sets/{id}

1. Pobranie UUID użytkownika z żądania (nagłówek lub sesja)
2. Walidacja parametru id jako prawidłowego UUID
3. Miękkie usunięcie zestawu fiszek w tabeli `card_sets`:
   - Weryfikacja, że zestaw należy do użytkownika i nie jest usunięty
   - Ustawienie flagi is_deleted na true i deleted_at na aktualną datę
4. Zwrócenie odpowiedzi 204 No Content

### 5.6 POST /api/card-sets/{id}/cards

1. Pobranie UUID użytkownika z żądania (nagłówek lub sesja)
2. Walidacja parametru id jako prawidłowego UUID
3. Walidacja danych wejściowych (card_ids jako tablica UUIDs)
4. Transakcja bazy danych:
   - Weryfikacja, że zestaw należy do użytkownika i nie jest usunięty
   - Weryfikacja, że wszystkie fiszki należą do użytkownika i nie są usunięte
   - Dodanie relacji do tabeli `cards_to_sets`, pomijając duplikaty
5. Zwrócenie liczby dodanych fiszek

### 5.7 DELETE /api/card-sets/{id}/cards/{card_id}

1. Pobranie UUID użytkownika z żądania (nagłówek lub sesja)
2. Walidacja parametrów id i card_id jako prawidłowych UUID
3. Usunięcie relacji z tabeli `cards_to_sets`:
   - Weryfikacja, że zestaw należy do użytkownika i nie jest usunięty
   - Weryfikacja, że fiszka należy do użytkownika i nie jest usunięta
   - Usunięcie rekordu łączącego fiszkę z zestawem
4. Zwrócenie odpowiedzi 204 No Content

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnianie

- Wszystkie endpointy wymagają uwierzytelnienia użytkownika
- UUID użytkownika jest pobierany z żądania (nagłówek, sesja lub token JWT)
- W środowisku produkcyjnym konieczne jest odpowiednie uwierzytelnianie (np. token JWT)

### 6.2 Autoryzacja

- Walidacja, że użytkownik ma dostęp tylko do własnych zestawów fiszek
- Walidacja, że użytkownik ma dostęp tylko do własnych fiszek
- Implementacja kontroli dostępu na poziomie bazy danych za pomocą polityk RLS (Row Level Security)

### 6.3 Walidacja danych

- Walidacja wszystkich parametrów wejściowych:
  - Walidacja id i card_id jako prawidłowych UUID
  - Sprawdzanie ograniczeń długości dla nazwy (max 100 znaków) i opisu
  - Weryfikacja, że tablica card_ids zawiera prawidłowe UUID i nie jest pusta
- Wykorzystanie schematów zod do walidacji żądań

### 6.4 Integralność danych

- Weryfikacja, że zestaw fiszek istnieje i nie jest usunięty przed operacjami
- Weryfikacja, że fiszka istnieje i nie jest usunięta przed dodaniem do zestawu
- Wykorzystanie transakcji bazodanowych dla operacji modyfikujących wiele tabel
- Odpowiednie obsługiwanie konfliktów unikalności przy dodawaniu fiszek do zestawów

## 7. Obsługa błędów

### Potencjalne scenariusze błędów

1. **Zestaw fiszek nie istnieje**:
   - Kod statusu: 404 Not Found
   - Odpowiedź: `{ "error": "Zestaw fiszek nie został znaleziony" }`

2. **Fiszka nie istnieje**:
   - Kod statusu: 404 Not Found
   - Odpowiedź: `{ "error": "Fiszka nie została znaleziona" }`

3. **Nieprawidłowe dane wejściowe**:
   - Kod statusu: 400 Bad Request
   - Odpowiedź: `{ "error": "Nieprawidłowe dane wejściowe", "details": { ... } }`

4. **Nieprawidłowa paginacja**:
   - Kod statusu: 400 Bad Request
   - Odpowiedź: `{ "error": "Nieprawidłowe parametry paginacji" }`

5. **Brak uwierzytelnienia**:
   - Kod statusu: 401 Unauthorized
   - Odpowiedź: `{ "error": "Wymagane uwierzytelnienie" }`

6. **Dostęp do danych innego użytkownika**:
   - Kod statusu: 403 Forbidden
   - Odpowiedź: `{ "error": "Brak dostępu" }`

7. **Błąd bazy danych**:
   - Kod statusu: 500 Internal Server Error
   - Odpowiedź: `{ "error": "Wystąpił błąd podczas przetwarzania żądania" }`
   - Logowanie szczegółowych informacji o błędzie po stronie serwera

8. **Próba duplikacji unikalnej relacji**:
   - Kod statusu: 400 Bad Request
   - Odpowiedź: `{ "error": "Fiszka jest już w zestawie" }`

## 8. Rozważania dotyczące wydajności

1. **Zapytania bazodanowe**:
   - Wykorzystanie odpowiednich indeksów dla `user_id`, `id`, `is_deleted`
   - Wykorzystanie paginacji dla dużych zbiorów danych
   - Używanie operacji wsadowych przy dodawaniu wielu fiszek do zestawu

2. **Współbieżność**:
   - Obsługa równoczesnych operacji na tym samym zestawie fiszek za pomocą transakcji bazodanowych
   - Wykorzystanie mechanizmu blokad optymistycznych w razie potrzeby

3. **Cache'owanie**:
   - Rozważenie cache'owania często używanych zestawów fiszek
   - Implementacja walidacji cache'a na podstawie znaczników czasu updated_at

4. **Optymalizacja odpowiedzi**:
   - Implementacja selectów z ograniczoną liczbą kolumn w tabelach cards i card_sets
   - Wykorzystanie selektów count(*) zamiast pobierania wszystkich fiszek przy pobieraniu liczby fiszek w zestawie

## 9. Etapy wdrożenia

### 9.1 Implementacja serwisu CardSetService

1. Utworzenie pliku `src/services/card-set.service.ts`
2. Implementacja klasy CardSetService rozszerzającej BaseService
3. Implementacja następujących metod:
   - `listCardSets(userId: string, page: number, limit: number): Promise<CardSetListResponse>`
   - `getCardSet(userId: string, setId: string, page: number, limit: number): Promise<CardSetWithCardsDTO>`
   - `createCardSet(userId: string, command: CardSetCreateCommand): Promise<CardSetDTO>`
   - `updateCardSet(userId: string, setId: string, command: CardSetUpdateCommand): Promise<CardSetDTO>`
   - `deleteCardSet(userId: string, setId: string): Promise<void>`
   - `addCardsToSet(userId: string, setId: string, command: CardToSetAddCommand): Promise<CardToSetAddResponse>`
   - `removeCardFromSet(userId: string, setId: string, cardId: string): Promise<void>`

### 9.2 Implementacja schematów walidacji

1. Utworzenie pliku `src/schemas/card-set.ts`
2. Implementacja następujących schematów zod:
   - `cardSetCreateSchema`: Walidacja danych do tworzenia zestawu fiszek
   - `cardSetUpdateSchema`: Walidacja danych do aktualizacji zestawu fiszek
   - `cardSetIdSchema`: Walidacja parametru id zestawu fiszek
   - `cardIdSchema`: Walidacja parametru card_id fiszki
   - `addCardsToSetSchema`: Walidacja danych do dodawania fiszek do zestawu
   - `paginationSchema`: Walidacja parametrów paginacji

### 9.3 Implementacja endpointów

1. Utworzenie następujących plików:
   - `src/pages/api/card-sets/index.ts` (GET, POST)
   - `src/pages/api/card-sets/[id]/index.ts` (GET, PUT, DELETE)
   - `src/pages/api/card-sets/[id]/cards/index.ts` (POST)
   - `src/pages/api/card-sets/[id]/cards/[card_id].ts` (DELETE)

2. Implementacja metod HTTP w każdym pliku:
   - Ekstrakcja UUID użytkownika
   - Walidacja parametrów i danych wejściowych
   - Wywołanie odpowiedniej metody serwisu
   - Formatowanie odpowiedzi i obsługa błędów

### 9.4 Aktualizacja typów (jeśli konieczne)

1. Sprawdzenie, czy wszystkie wymagane typy są już zdefiniowane w `src/types.ts`
2. W razie potrzeby, dodanie brakujących typów lub rozszerzenie istniejących

### 9.5 Testy

1. Testy jednostkowe serwisu:
   - Mockowanie Supabase dla testów jednostkowych
   - Testowanie wszystkich metod serwisu

2. Testy integracyjne:
   - Testowanie pełnych endpointów z rzeczywistą komunikacją z bazą danych
   - Testowanie scenariuszy błędów i graniczych przypadków

### 9.6 Dokumentacja

1. Dodanie komentarzy JSDoc do wszystkich metod serwisu i funkcji endpointów
2. Aktualizacja dokumentacji API, jeśli taka istnieje
