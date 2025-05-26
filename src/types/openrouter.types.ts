/**
 * Parametry konfiguracyjne dla modelu OpenRouter
 */
export interface OpenRouterParameters {
  /** Temperatura określająca kreatywność modelu (0-1) */
  temperature: number;
  /** Maksymalna liczba tokenów w odpowiedzi */
  max_tokens?: number;
  /** Sampling z górnego percentyla prawdopodobieństw (0-1) */
  top_p?: number;
  /** Kara za powtarzanie się tokenów (-2.0 do 2.0) */
  presence_penalty?: number;
}

/**
 * Format odpowiedzi z API OpenRouter
 */
export interface OpenRouterResponseFormat {
  /** Typ formatu odpowiedzi */
  type: 'json_schema';
  /** Schemat JSON dla odpowiedzi */
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchema;
  };
}

/**
 * Wiadomość w formacie chat API
 */
export interface OpenRouterMessage {
  /** Rola w konwersacji */
  role: 'system' | 'user' | 'assistant';
  /** Treść wiadomości */
  content: string;
}

/**
 * Żądanie do chat API OpenRouter
 */
export interface OpenRouterChatRequest {
  /** Identyfikator modelu */
  model: string;
  /** Lista wiadomości w konwersacji */
  messages: OpenRouterMessage[];
  /** Parametry modelu */
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  presence_penalty?: number;
  /** Format odpowiedzi */
  response_format?: OpenRouterResponseFormat;
}

/**
 * Model dostępny w API OpenRouter
 */
export interface OpenRouterModel {
  /** Unikalny identyfikator modelu */
  id: string;
  /** Nazwa modelu */
  name: string;
  /** Opis modelu */
  description?: string;
  /** Kontekst (maksymalna liczba tokenów) */
  context_length?: number;
}

/**
 * Wynik generowania fiszek
 */
export interface FlashcardGenerationResult {
  /** Wygenerowane fiszki */
  cards: {
    /** Pytanie na fiszce */
    question: string;
    /** Odpowiedź na fiszce */
    answer: string;
    /** Dodatkowe notatki lub wyjaśnienia */
    notes?: string;
  }[];
}

/**
 * Schemat JSON dla walidacji odpowiedzi
 */
export type JsonSchema = Record<string, unknown>;

/**
 * Błędy specyficzne dla API OpenRouter
 */
export interface OpenRouterError extends Error {
  /** Kod błędu */
  code: string;
  /** Oryginalny błąd z API */
  originalError?: unknown;
  /** Status HTTP */
  status?: number;
}
