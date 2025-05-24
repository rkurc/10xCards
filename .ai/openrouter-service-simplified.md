# Plan implementacji usługi OpenRouter (Uproszczony)

## 1. Opis usługi

Usługa OpenRouter stanowi kluczowy komponent aplikacji 10xCards odpowiedzialny za komunikację z interfejsem API OpenRouter.ai. Celem usługi jest zapewnienie łatwego i zunifikowanego dostępu do różnych modeli językowych (LLM) poprzez jeden spójny interfejs. Usługa będzie wykorzystywana do generowania fiszek na podstawie dostarczonych tekstów, zapewniając wysoką jakość odpowiedzi.

Usługa OpenRouterService jest klasą dziedziczącą po BaseService, co zapewnia spójność z istniejącą architekturą aplikacji oraz dostęp do wspólnych mechanizmów obsługi błędów i operacji na bazie danych.

Główne funkcje usługi obejmują:
1. Konfigurację i zarządzanie parametrami modeli LLM
2. Formatowanie zapytań zgodnie z wymaganiami OpenRouter API
3. Obsługę komunikatów systemowych i użytkownika
4. Przetwarzanie odpowiedzi strukturalnych (JSON)
5. Obsługę błędów i wyjątków specyficznych dla API

## 2. Opis konstruktora

```typescript
constructor(
  supabase: TypedSupabaseClient,
  options: {
    apiKey?: string;
    defaultModel?: string;
    defaultSystemMessage?: string;
    defaultParameters?: OpenRouterParameters;
  } = {}
) {
  super(supabase);
  this.apiKey = options.apiKey || process.env.PUBLIC_OPENROUTER_API_KEY || '';
  this.defaultModel = options.defaultModel || 'anthropic/claude-3-opus';
  this.defaultSystemMessage = options.defaultSystemMessage || 'Jesteś pomocnym asystentem do tworzenia fiszek edukacyjnych.';
  this.defaultParameters = {
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 0.9,
    ...options.defaultParameters
  };
  
  if (!this.apiKey) {
    console.warn('OpenRouter API key not provided. Service will not function correctly.');
  }
}
```

Konstruktor przyjmuje instancję klienta Supabase oraz opcjonalny obiekt konfiguracyjny, który pozwala na dostosowanie domyślnych parametrów usługi. Jeśli klucz API nie zostanie podany w opcjach, usługa spróbuje go pobrać ze zmiennych środowiskowych. Ponadto, konstruktor inicjalizuje domyślne wartości dla:
- Modelu językowego (domyślnie Claude 3 Opus)
- Komunikatu systemowego
- Parametrów modelu (temperatura, maksymalna liczba tokenów, top_p)

## 3. Publiczne metody i pola

### 3.1 Pola publiczne

```typescript
public readonly defaultModel: string;
public readonly defaultSystemMessage: string;
public readonly defaultParameters: OpenRouterParameters;
```

### 3.2 Metody publiczne

#### 3.2.1 generateCompletion

```typescript
/**
 * Generuje odpowiedź tekstową na podstawie zapytania
 * @param prompt Zapytanie użytkownika
 * @param options Opcje konfiguracyjne dla zapytania
 * @returns Odpowiedź modelu językowego
 */
async generateCompletion(
  prompt: string,
  options?: {
    model?: string;
    systemMessage?: string;
    parameters?: Partial<OpenRouterParameters>;
    responseFormat?: OpenRouterResponseFormat;
  }
): Promise<string>
```

Metoda ta wysyła zapytanie do API OpenRouter i zwraca wygenerowaną odpowiedź w formie tekstu.

#### 3.2.2 generateJson

```typescript
/**
 * Generuje odpowiedź w formacie JSON zgodną z podanym schematem
 * @param prompt Zapytanie użytkownika
 * @param schema Schemat JSON określający strukturę oczekiwanej odpowiedzi
 * @param options Opcje konfiguracyjne dla zapytania
 * @returns Odpowiedź modelu językowego w formacie JSON
 */
async generateJson<T>(
  prompt: string,
  schema: JsonSchema,
  options?: {
    model?: string;
    systemMessage?: string;
    parameters?: Partial<OpenRouterParameters>;
    schemaName?: string;
    strictSchema?: boolean;
  }
): Promise<T>
```

Metoda ta używa `response_format` do wygenerowania odpowiedzi zgodnej z podanym schematem JSON, a następnie parsuje i zwraca tę odpowiedź jako obiekt.

#### 3.2.3 generateFlashcards

```typescript
/**
 * Generuje fiszki na podstawie dostarczonego tekstu
 * @param text Tekst źródłowy do analizy
 * @param options Opcje generowania fiszek
 * @returns Tablica wygenerowanych fiszek
 */
async generateFlashcards(
  text: string,
  options?: {
    count?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    model?: string;
    systemMessage?: string;
    parameters?: Partial<OpenRouterParameters>;
  }
): Promise<FlashcardGenerationResult>
```

Wyspecjalizowana metoda do generowania fiszek na podstawie treści tekstowej, wykorzystująca `generateJson` z odpowiednim schematem dla fiszek.

#### 3.2.4 setModel

```typescript
/**
 * Ustawia model do używania w zapytaniach
 * @param model Identyfikator modelu
 */
setModel(model: string): void
```

#### 3.2.5 setSystemMessage

```typescript
/**
 * Ustawia komunikat systemowy do używania w zapytaniach
 * @param message Treść komunikatu systemowego
 */
setSystemMessage(message: string): void
```

#### 3.2.6 setParameters

```typescript
/**
 * Ustawia parametry modelu do używania w zapytaniach
 * @param parameters Obiekt parametrów modelu
 */
setParameters(parameters: Partial<OpenRouterParameters>): void
```

#### 3.2.7 getAvailableModels

```typescript
/**
 * Pobiera listę dostępnych modeli z API OpenRouter
 * @returns Lista dostępnych modeli
 */
async getAvailableModels(): Promise<OpenRouterModel[]>
```

## 4. Prywatne metody i pola

### 4.1 Pola prywatne

```typescript
private readonly apiKey: string;
private readonly apiUrl: string = 'https://openrouter.ai/api/v1';
```

### 4.2 Metody prywatne

#### 4.2.1 buildChatRequest

```typescript
/**
 * Tworzy obiekt żądania zgodny z formatem Chat API
 * @param userMessage Wiadomość od użytkownika
 * @param systemMessage Wiadomość systemowa (opcjonalna)
 * @param model Model do użycia
 * @param parameters Parametry modelu
 * @param responseFormat Format odpowiedzi (opcjonalny)
 * @returns Obiekt żądania
 */
private buildChatRequest(
  userMessage: string,
  systemMessage: string | null,
  model: string,
  parameters: OpenRouterParameters,
  responseFormat?: OpenRouterResponseFormat
): OpenRouterChatRequest
```

#### 4.2.2 executeRequest

```typescript
/**
 * Wykonuje żądanie do API OpenRouter
 * @param endpoint Końcówka API
 * @param method Metoda HTTP
 * @param body Treść żądania
 * @returns Odpowiedź API
 */
private async executeRequest<T>(
  endpoint: string, 
  method: 'GET' | 'POST' = 'POST',
  body?: any
): Promise<T>
```

#### 4.2.3 handleApiError

```typescript
/**
 * Przetwarza błędy API i rzuca odpowiednie wyjątki
 * @param error Obiekt błędu
 */
private handleApiError(error: any): never
```

#### 4.2.4 buildFlashcardSystemPrompt

```typescript
/**
 * Tworzy komunikat systemowy dostosowany do generowania fiszek
 * @param options Opcje generowania fiszek
 * @returns Komunikat systemowy
 */
private buildFlashcardSystemPrompt(
  options: {
    count?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }
): string
```

#### 4.2.5 buildFlashcardSchema

```typescript
/**
 * Tworzy schemat JSON dla generowania fiszek
 * @returns Schemat JSON
 */
private buildFlashcardSchema(): JsonSchema
```

## 5. Obsługa błędów

Usługa OpenRouterService implementuje rozbudowany mechanizm obsługi błędów, który identyfikuje i właściwie obsługuje następujące scenariusze błędów:

### 5.1 Błędy uwierzytelniania

```typescript
if (error.status === 401) {
  throw {
    code: 'AUTHENTICATION_ERROR',
    message: 'Nieprawidłowy klucz API OpenRouter',
    status: 401,
    originalError: error
  };
}
```

### 5.2 Błędy limitu szybkości (rate limiting)

```typescript
if (error.status === 429) {
  throw {
    code: 'RATE_LIMIT_ERROR',
    message: 'Przekroczono limit zapytań do API OpenRouter',
    status: 429,
    originalError: error
  };
}
```

### 5.3 Błędy modelu

```typescript
if (error.response?.data?.error?.type === 'invalid_model') {
  throw {
    code: 'INVALID_MODEL_ERROR',
    message: `Model "${error.response.data.error.param}" nie jest dostępny`,
    status: 400,
    originalError: error
  };
}
```

### 5.4 Błędy limitu tokenów

```typescript
if (error.response?.data?.error?.type === 'context_length_exceeded') {
  throw {
    code: 'CONTEXT_LENGTH_ERROR',
    message: 'Przekroczono maksymalną długość kontekstu dla modelu',
    status: 400,
    originalError: error
  };
}
```

### 5.5 Błędy walidacji schematu

```typescript
if (!isValidJson) {
  throw {
    code: 'SCHEMA_VALIDATION_ERROR',
    message: 'Odpowiedź API nie jest zgodna z oczekiwanym schematem',
    status: 422,
    originalError: error
  };
}
```

### 5.6 Ogólne błędy HTTP

```typescript
throw {
  code: 'API_ERROR',
  message: `Błąd API: ${error.message || 'Nieznany błąd'}`,
  status: error.status || 500,
  originalError: error
};
```

## 6. Kwestie bezpieczeństwa

### 6.1 Bezpieczne przechowywanie kluczy API

1. Klucze API powinny być przechowywane w zmiennych środowiskowych, nigdy nie powinny być bezpośrednio zapisane w kodzie.
2. W środowisku produkcyjnym klucze API powinny być odczytywane przez serwer, a nie przekazywane do klienta.
3. Należy stosować mechanizmy limitowania dostępu do kluczy API na poziomie infrastruktury (np. ograniczenia CORS).

### 6.2 Walidacja wejść

1. Wszystkie dane wejściowe od użytkowników muszą być walidowane przed przekazaniem do API.
2. Zapytania powinny być oczyszczane z potencjalnie niebezpiecznych treści.

### 6.4 Izolacja i obsługa błędów

1. Błędy w usłudze OpenRouter nie powinny wpływać na działanie reszty aplikacji.
2. Implementacja mechanizmu retry z exponential backoff dla tymczasowych błędów API.
3. Logowanie szczegółów błędów do monitoringu, ale bez ujawniania wrażliwych informacji użytkownikom.

## 7. Plan wdrożenia krok po kroku

### Krok 1: Przygotowanie zależności i typów

1. Utworzenie pliku `src/types/openrouter.types.ts` definiującego interfejsy dla OpenRouter API:

```typescript
// src/types/openrouter.types.ts
export interface OpenRouterParameters {
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenRouterResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: true;
    schema: JsonSchema;
  };
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterChatRequest {
  model: string;
  messages: OpenRouterMessage[];
  response_format?: OpenRouterResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

export interface FlashcardGenerationResult {
  cards: {
    front: string;
    back: string;
  }[];
  metadata?: {
    model_used: string;
    tokens_used: number;
  };
}

export type JsonSchema = Record<string, any>;
```

### Krok 2: Implementacja klasy serwisu

2. Utworzenie pliku `src/lib/services/openrouter.service.ts`:

```typescript
// src/lib/services/openrouter.service.ts
import { BaseService } from '../../services/base.service';
import type { TypedSupabaseClient } from '../../db/supabase.service';
import type {
  OpenRouterParameters,
  OpenRouterResponseFormat,
  OpenRouterMessage,
  OpenRouterChatRequest,
  OpenRouterModel,
  FlashcardGenerationResult,
  JsonSchema
} from '../../types/openrouter.types';

/**
 * Serwis do komunikacji z API OpenRouter.ai
 */
export class OpenRouterService extends BaseService {
  private readonly apiKey: string;
  private readonly apiUrl: string = 'https://openrouter.ai/api/v1';
  public readonly defaultModel: string;
  public readonly defaultSystemMessage: string;
  public readonly defaultParameters: OpenRouterParameters;

  constructor(
    supabase: TypedSupabaseClient,
    options: {
      apiKey?: string;
      defaultModel?: string;
      defaultSystemMessage?: string;
      defaultParameters?: OpenRouterParameters;
    } = {}
  ) {
    super(supabase);
    this.apiKey = options.apiKey || process.env.PUBLIC_OPENROUTER_API_KEY || '';
    this.defaultModel = options.defaultModel || 'deepseek/deepseek-chat-v3-0324:free';
    this.defaultSystemMessage = options.defaultSystemMessage || 'Jesteś pomocnym asystentem do tworzenia fiszek edukacyjnych.';
    this.defaultParameters = {
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.9,
      ...options.defaultParameters
    };
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not provided. Service will not function correctly.');
    }
  }

  /**
   * Ustawia model do używania w zapytaniach
   * @param model Identyfikator modelu
   */
  setModel(model: string): void {
    (this as any).defaultModel = model;
  }

  /**
   * Ustawia komunikat systemowy do używania w zapytaniach
   * @param message Treść komunikatu systemowego
   */
  setSystemMessage(message: string): void {
    (this as any).defaultSystemMessage = message;
  }

  /**
   * Ustawia parametry modelu do używania w zapytaniach
   * @param parameters Obiekt parametrów modelu
   */
  setParameters(parameters: Partial<OpenRouterParameters>): void {
    (this as any).defaultParameters = {
      ...this.defaultParameters,
      ...parameters
    };
  }

  /**
   * Generuje odpowiedź tekstową na podstawie zapytania
   * @param prompt Zapytanie użytkownika
   * @param options Opcje konfiguracyjne dla zapytania
   * @returns Odpowiedź modelu językowego
   */
  async generateCompletion(
    prompt: string,
    options?: {
      model?: string;
      systemMessage?: string;
      parameters?: Partial<OpenRouterParameters>;
      responseFormat?: OpenRouterResponseFormat;
    }
  ): Promise<string> {
    const model = options?.model || this.defaultModel;
    const systemMessage = options?.systemMessage || this.defaultSystemMessage;
    const parameters = {
      ...this.defaultParameters,
      ...options?.parameters
    };

    const request = this.buildChatRequest(
      prompt,
      systemMessage,
      model,
      parameters,
      options?.responseFormat
    );

    try {
      const response = await this.executeRequest<{
        choices: { message: { content: string } }[];
      }>('/chat/completions', 'POST', request);
      
      return response.choices[0].message.content;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Generuje odpowiedź w formacie JSON zgodną z podanym schematem
   * @param prompt Zapytanie użytkownika
   * @param schema Schemat JSON określający strukturę oczekiwanej odpowiedzi
   * @param options Opcje konfiguracyjne dla zapytania
   * @returns Odpowiedź modelu językowego w formacie JSON
   */
  async generateJson<T>(
    prompt: string,
    schema: JsonSchema,
    options?: {
      model?: string;
      systemMessage?: string;
      parameters?: Partial<OpenRouterParameters>;
      schemaName?: string;
      strictSchema?: boolean;
    }
  ): Promise<T> {
    const responseFormat = {
      type: 'json_schema',
      json_schema: {
        name: options?.schemaName || 'response',
        strict: true,
        schema: schema
      }
    };

    const jsonResponse = await this.generateCompletion(prompt, {
      ...options,
      responseFormat
    });

    try {
      return JSON.parse(jsonResponse);
    } catch (error) {
      throw {
        code: 'JSON_PARSE_ERROR',
        message: 'Nie udało się sparsować odpowiedzi jako JSON',
        status: 422,
        originalError: error
      };
    }
  }

  /**
   * Generuje fiszki na podstawie dostarczonego tekstu
   * @param text Tekst źródłowy do analizy
   * @param options Opcje generowania fiszek
   * @returns Tablica wygenerowanych fiszek
   */
  async generateFlashcards(
    text: string,
    options?: {
      count?: number;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      model?: string;
      systemMessage?: string;
      parameters?: Partial<OpenRouterParameters>;
    }
  ): Promise<FlashcardGenerationResult> {
    const customSystemMessage = options?.systemMessage || 
      this.buildFlashcardSystemPrompt({
        count: options?.count,
        difficulty: options?.difficulty
      });

    const schema = this.buildFlashcardSchema();
    
    const prompt = `Przeanalizuj poniższy tekst i stwórz zestaw fiszek edukacyjnych:

${text}`;
    
    const result = await this.generateJson<{ cards: { front: string; back: string }[] }>(
      prompt,
      schema,
      {
        model: options?.model,
        systemMessage: customSystemMessage,
        parameters: options?.parameters,
        schemaName: 'flashcards',
        strictSchema: true
      }
    );
    
    return result;
  }

  /**
   * Pobiera listę dostępnych modeli z API OpenRouter
   * @returns Lista dostępnych modeli
   */
  async getAvailableModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await this.executeRequest<{ data: OpenRouterModel[] }>('/models', 'GET');
      return response.data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Tworzy obiekt żądania zgodny z formatem Chat API
   * @param userMessage Wiadomość od użytkownika
   * @param systemMessage Wiadomość systemowa (opcjonalna)
   * @param model Model do użycia
   * @param parameters Parametry modelu
   * @param responseFormat Format odpowiedzi (opcjonalny)
   * @returns Obiekt żądania
   */
  private buildChatRequest(
    userMessage: string,
    systemMessage: string | null,
    model: string,
    parameters: OpenRouterParameters,
    responseFormat?: OpenRouterResponseFormat
  ): OpenRouterChatRequest {
    const messages: OpenRouterMessage[] = [];
    
    if (systemMessage) {
      messages.push({
        role: 'system',
        content: systemMessage
      });
    }
    
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    const request: OpenRouterChatRequest = {
      model,
      messages,
      temperature: parameters.temperature,
      max_tokens: parameters.max_tokens,
      top_p: parameters.top_p
    };
    
    if (parameters.frequency_penalty !== undefined) {
      request.frequency_penalty = parameters.frequency_penalty;
    }
    
    if (parameters.presence_penalty !== undefined) {
      request.presence_penalty = parameters.presence_penalty;
    }
    
    if (responseFormat) {
      request.response_format = responseFormat;
    }
    
    return request;
  }

  /**
   * Wykonuje żądanie do API OpenRouter
   * @param endpoint Końcówka API
   * @param method Metoda HTTP
   * @param body Treść żądania
   * @returns Odpowiedź API
   */
  private async executeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' = 'POST',
    body?: any
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://10xcards.app',
    };
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: errorData.error?.message || response.statusText,
          response: { data: errorData }
        };
      }
      
      return await response.json();
    } catch (error) {
      // Zastosowanie mechanizmu ponownych prób (retry) z exponential backoff
      if (this.shouldRetry(error, endpoint)) {
        return await this.retryRequest<T>(endpoint, method, body);
      }
      
      // Logowanie błędu przed rzuceniem wyjątku
      console.error(`OpenRouter API error (${endpoint}):`, error);
      
      // Przekazanie błędu do centralnego handlera
      this.handleApiError(error);
    }
  }

  /**
   * Przetwarza błędy API i rzuca odpowiednie wyjątki
   * @param error Obiekt błędu
   */
  private handleApiError(error: any): never {
    // Błędy uwierzytelniania
    if (error.status === 401) {
      throw {
        code: 'AUTHENTICATION_ERROR',
        message: 'Nieprawidłowy klucz API OpenRouter',
        status: 401,
        originalError: error
      };
    }
    
    // Błędy limitu szybkości (rate limiting)
    if (error.status === 429) {
      throw {
        code: 'RATE_LIMIT_ERROR',
        message: 'Przekroczono limit zapytań do API OpenRouter',
        status: 429,
        originalError: error
      };
    }
    
    // Błędy modelu
    if (error.response?.data?.error?.type === 'invalid_model') {
      throw {
        code: 'INVALID_MODEL_ERROR',
        message: `Model "${error.response.data.error.param}" nie jest dostępny`,
        status: 400,
        originalError: error
      };
    }
    
    // Błędy limitu tokenów
    if (error.response?.data?.error?.type === 'context_length_exceeded') {
      throw {
        code: 'CONTEXT_LENGTH_ERROR',
        message: 'Przekroczono maksymalną długość kontekstu dla modelu',
        status: 400,
        originalError: error
      };
    }
    
    // Ogólne błędy HTTP
    throw {
      code: 'API_ERROR',
      message: `Błąd API: ${error.message || 'Nieznany błąd'}`,
      status: error.status || 500,
      originalError: error
    };
  }

  /**
   * Tworzy komunikat systemowy dostosowany do generowania fiszek
   * @param options Opcje generowania fiszek
   * @returns Komunikat systemowy
   */
  private buildFlashcardSystemPrompt(
    options: {
      count?: number;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
    }
  ): string {
    const count = options.count || 5;
    const difficulty = options.difficulty || 'intermediate';
    
    let difficultyDescription = '';
    switch (difficulty) {
      case 'beginner':
        difficultyDescription = 'podstawowe pojęcia i proste definicje';
        break;
      case 'advanced':
        difficultyDescription = 'zaawansowane pojęcia, złożone relacje i szczegółowe wyjaśnienia';
        break;
      default:
        difficultyDescription = 'pojęcia o średnim poziomie trudności i ich wyjaśnienia';
        break;
    }
    
    return `Jesteś ekspertem w tworzeniu fiszek edukacyjnych. Twoim zadaniem jest wygenerowanie ${count} wysokiej jakości fiszek na podstawie dostarczonego tekstu. 

Fiszki powinny koncentrować się na ${difficultyDescription}.

Każda fiszka powinna składać się z:
1. Przednia strona (front): Precyzyjne pytanie lub pojęcie
2. Tylna strona (back): Zwięzła, dokładna i informatywna odpowiedź

Analizuj tekst pod kątem najważniejszych zagadnień, pojęć i definicji. Upewnij się, że fiszki są ze sobą powiązane tematycznie i obejmują kluczowe elementy z tekstu.

Twoja odpowiedź musi być w formacie JSON zgodnym z dostarczonym schematem.`;
  }

  /**
   * Tworzy schemat JSON dla generowania fiszek
   * @returns Schemat JSON
   */
  private buildFlashcardSchema(): JsonSchema {
    return {
      type: 'object',
      properties: {
        cards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: {
                type: 'string',
                description: 'Pytanie lub pojęcie na przedniej stronie fiszki'
              },
              back: {
                type: 'string',
                description: 'Odpowiedź lub wyjaśnienie na tylnej stronie fiszki'
              }
            },
            required: ['front', 'back']
          }
        }
      },
      required: ['cards']
    };
  }

  /**
   * Sprawdza, czy zapytanie powinno zostać ponowione
   * @param error Obiekt błędu
   * @param endpoint Końcówka API
   * @returns True, jeśli zapytanie powinno zostać ponowione
   */
  private shouldRetry(error: any, endpoint: string): boolean {
    // Nie ponawiamy zapytań dla błędów uwierzytelniania, nieprawidłowych modeli itp.
    if (error.status === 401 || 
        error.status === 403 || 
        error.response?.data?.error?.type === 'invalid_model') {
      return false;
    }
    
    // Ponawiamy zapytania w przypadku błędów sieci, timeout i rate-limit
    if (error.status === 429 || // Rate limit
        error.status === 500 || // Internal server error
        error.status === 502 || // Bad gateway
        error.status === 503 || // Service unavailable
        error.status === 504 || // Gateway timeout
        error instanceof TypeError) { // Network error
      return true;
    }
    
    return false;
  }

  /**
   * Ponawia zapytanie z exponential backoff
   * @param endpoint Końcówka API
   * @param method Metoda HTTP
   * @param body Treść żądania
   * @returns Odpowiedź API
   */
  private async retryRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any
  ): Promise<T> {
    const maxRetries = 3;
    let retryCount = 0;
    let lastError: any;
    
    while (retryCount < maxRetries) {
      try {
        // Exponential backoff - 1s, 2s, 4s...
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Ponowienie zapytania do ${endpoint} (${retryCount + 1}/${maxRetries}) po ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        retryCount++;
        
        const url = `${this.apiUrl}${endpoint}`;
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://10xcards.app',
        };
        
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw {
            status: response.status,
            message: errorData.error?.message || response.statusText,
            response: { data: errorData }
          };
        }
        
        return await response.json();
      } catch (error) {
        lastError = error;
        
        // Jeśli błąd nie kwalifikuje się do ponowienia próby, przerwij
        if (!this.shouldRetry(error, endpoint)) {
          break;
        }
      }
    }
    
    // Po wyczerpaniu wszystkich prób, rzuć ostatni błąd
    console.error(`Wszystkie próby zapytania do ${endpoint} nie powiodły się.`);
    this.handleApiError(lastError);
  }

  /* Te metody zostały usunięte jako część uproszczenia implementacji */
}
```

### Krok 3: Rozszerzenie istniejącej usługi generacji

3. Modyfikacja klasy GenerationService, aby używała OpenRouterService:

```typescript
// src/services/generation.service.ts
import { OpenRouterService } from '../lib/services/openrouter.service';

export class GenerationService extends BaseService {
  private openRouterService: OpenRouterService;
  
  constructor(supabase: TypedSupabaseClient) {
    super(supabase);
    this.openRouterService = new OpenRouterService(supabase);
  }
  
  // Modyfikacja metody processTextAsync, aby używała OpenRouterService
  private async processTextAsync(generationId: string): Promise<void> {
    try {
      // Update status to processing
      const { error: updateStatusError } = await this.supabase
        .from("generation_logs")
        .update({ status: "processing" })
        .eq("id", generationId);

      // Get the generation log to access text and options
      const { data: generationLog, error: logError } = await this.supabase
        .from("generation_logs")
        .select("*")
        .eq("id", generationId)
        .single();

      if (logError || !generationLog) {
        throw new Error(`Failed to retrieve generation log: ${logError?.message || "Record not found"}`);
      }

      // Generowanie fiszek przy użyciu OpenRouterService
      const result = await this.openRouterService.generateFlashcards(
        generationLog.text,
        {
          count: generationLog.target_count || 5,
          difficulty: 'intermediate',
          parameters: {
            temperature: 0.7,
            max_tokens: 4000
          }
        }
      );

      // Zapisywanie wygenerowanych fiszek w bazie danych
      const generatedCards = result.cards.map(card => ({
        id: this.generateUUID(),
        generation_id: generationId,
        front_content: card.front,
        back_content: card.back,
        readability_score: 0.8, // Mock value
        status: 'pending'
      }));

      // Zapisz wygenerowane fiszki
      const { error: insertError } = await this.supabase
        .from("generation_results")
        .insert(generatedCards);

      if (insertError) {
        throw new Error(`Failed to save generated cards: ${insertError.message}`);
      }

      // Zaktualizuj status generacji
      await this.supabase
        .from("generation_logs")
        .update({
          status: "completed",
          generated_count: generatedCards.length,
          updated_at: new Date().toISOString()
        })
        .eq("id", generationId);
    } catch (error) {
      // Obsługa błędów
      console.error(`Error processing text for generation ${generationId}:`, error);
      const failedUpdateData = {
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        updated_at: new Date().toISOString(),
      };

      await this.supabase
        .from("generation_logs")
        .update(failedUpdateData)
        .eq("id", generationId);
    }
  }

  // Pozostałe metody bez zmian...
}
```

### Krok 4: Dodanie zmiennych środowiskowych

4. Zaktualizowanie pliku `.env` o zmienne związane z OpenRouter:

```
PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
```

5. Zaktualizowanie plików konfiguracyjnych, aby uwzględnić nowe zmienne środowiskowe:

```typescript
// src/config/environment.ts
export function validateEnvironment() {
  const requiredVars = [
    'PUBLIC_SUPABASE_URL',
    'PUBLIC_SUPABASE_ANON_KEY',
    'PUBLIC_OPENROUTER_API_KEY' // Dodana nowa zmienna
  ];
  // Reszta funkcji bez zmian...
}
```

### Krok 5: Implementacja testów jednostkowych

6. Utworzenie plików testowych dla usługi OpenRouter:

```typescript
// tests/unit/openrouter.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenRouterService } from '../../src/lib/services/openrouter.service';

// Mock fetch API
global.fetch = vi.fn();

describe('OpenRouterService', () => {
  let service: OpenRouterService;
  const mockSupabase = {
    // Mock supabase client
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OpenRouterService(mockSupabase as any, {
      apiKey: 'test-api-key'
    });
  });

  describe('generateCompletion', () => {
    it('should generate a text completion successfully', async () => {
      // Arrange
      const mockResponse = {
        choices: [
          { message: { content: 'This is a test response' } }
        ]
      };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await service.generateCompletion('Test prompt');

      // Assert
      expect(result).toBe('This is a test response');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });

    it('should handle API errors correctly', async () => {
      // Arrange
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: { message: 'Invalid API key' } })
      });

      // Act & Assert
      await expect(service.generateCompletion('Test prompt')).rejects.toMatchObject({
        code: 'AUTHENTICATION_ERROR',
        status: 401
      });
    });
  });

  // Dodatkowe testy dla pozostałych metod...
});
```

### Krok 6: Rozszerzenie istniejących endpointów API

7. Zaktualizowanie endpointów API związanych z generowaniem fiszek:

```typescript
// src/pages/api/generation/process-text.ts
import type { APIContext } from 'astro';
import { processTextSchema } from '../../../schemas/generation';
import { GenerationService } from '../../../services/generation.service';
import { requireAuth, createApiError } from '../../../utils/api-auth';

export const prerender = false;

export async function POST({ request, locals }: APIContext) {
  try {
    // Sprawdzenie autoryzacji
    const authError = requireAuth({ locals, request });
    if (authError) return authError;

    const { user } = locals;
    if (!user) {
      return createApiError('User not authenticated', 401);
    }

    // Parsowanie i walidacja ciała zapytania
    const body = await request.json();
    const validation = processTextSchema.safeParse(body);
    
    if (!validation.success) {
      return createApiError({
        message: 'Invalid input data',
        issues: validation.error.format()
      }, 400);
    }

    // Utworzenie serwisu i przetworzenie tekstu
    const generationService = new GenerationService(locals.supabase);
    try {
      const result = await generationService.startTextProcessing(user.id, validation.data);
      
      return new Response(JSON.stringify(result), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error in generation service:', error);
      return createApiError(error, 500);
    }
  } catch (error) {
    console.error('Unhandled error processing request:', error);
    return createApiError('Internal server error', 500);
  }
}
```

### Krok 7: Integracja z interfejsem użytkownika

8. Rozszerzenie komponentu GenerateContent:

```tsx
// src/components/generate/GenerateContent.tsx
import { useState } from 'react';
import { useGenerationContext } from '@/contexts/generation-context';

export default function GenerateContent() {
  const [text, setText] = useState('');
  const [targetCount, setTargetCount] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { startGeneration } = useGenerationContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      await startGeneration({ text, target_count: targetCount });
      // Nawigacja do strony przeglądania nastąpi automatycznie przez kontekst generacji
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing your text');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Generuj fiszki</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="text" className="block text-sm font-medium mb-1">
            Tekst źródłowy
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 p-2 border rounded"
            placeholder="Wklej tekst, z którego chcesz wygenerować fiszki..."
            required
          />
        </div>
        
        <div>
          <label htmlFor="targetCount" className="block text-sm font-medium mb-1">
            Liczba fiszek
          </label>
          <input
            id="targetCount"
            type="number"
            min={1}
            max={20}
            value={targetCount}
            onChange={(e) => setTargetCount(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full p-2 bg-blue-600 text-white rounded ${
            isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Przetwarzanie...' : 'Generuj fiszki'}
        </button>
      </form>
    </div>
  );
}
```
