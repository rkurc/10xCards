import { BaseService } from '../services/base.service';
import type { TypedSupabaseClient } from '../db/supabase.service';
import type {
  OpenRouterParameters,
  OpenRouterResponseFormat,
  OpenRouterMessage,
  OpenRouterChatRequest,
  OpenRouterModel,
  FlashcardGenerationResult,
  JsonSchema,
  OpenRouterError
} from '../types/openrouter.types';

/**
 * Serwis do komunikacji z API OpenRouter.ai
 * Zapewnia zunifikowany dostęp do różnych modeli językowych poprzez jeden interfejs
 */
export class OpenRouterService extends BaseService {
  private readonly apiKey: string;
  private readonly apiUrl: string = "https://openrouter.ai/api/v1";
  private defaultModel: string;
  private defaultSystemMessage: string;
  private defaultParameters: OpenRouterParameters;

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

  /**
   * Tworzy obiekt żądania zgodny z formatem Chat API
   * @private
   */
  private buildChatRequest(
    userMessage: string,
    responseFormat?: OpenRouterResponseFormat
  ): OpenRouterChatRequest {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: this.defaultSystemMessage
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    return {
      model: this.defaultModel,
      messages,
      ...this.defaultParameters,
      ...(responseFormat && { response_format: responseFormat })
    };
  }

  /**
   * Przetwarza błędy API i rzuca odpowiednie wyjątki
   * @private
   */
  private handleApiError(error: any): never {
    const errorResponse = error.response?.data?.error;
    
    const apiError: OpenRouterError = new Error(
      errorResponse?.message || 'Unknown OpenRouter API error'
    ) as OpenRouterError;
    
    apiError.code = 'API_ERROR';
    apiError.originalError = error;
    apiError.status = error.status || 500;

    if (error.status === 401) {
      apiError.code = 'AUTHENTICATION_ERROR';
    } else if (error.status === 429) {
      apiError.code = 'RATE_LIMIT_ERROR';
    } else if (errorResponse?.type === 'invalid_model') {
      apiError.code = 'INVALID_MODEL_ERROR';
    } else if (errorResponse?.type === 'context_length_exceeded') {
      apiError.code = 'CONTEXT_LENGTH_ERROR';
    }

    throw apiError;
  }

  /**
   * Wykonuje żądanie do API OpenRouter
   * @private
   */
  private async executeRequest<T>(endpoint: string, body?: unknown): Promise<T> {
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://10xcards.com",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      this.handleApiError(error);
    }
  }

  /**
   * Generuje odpowiedź tekstową na podstawie zapytania
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
    const chatRequest = this.buildChatRequest(prompt, options?.responseFormat);
    
    if (options?.model) chatRequest.model = options.model;
    if (options?.systemMessage) chatRequest.messages[0].content = options.systemMessage;
    if (options?.parameters) {
      Object.assign(chatRequest, options.parameters);
    }

    const response = await this.executeRequest<{ choices: { message: { content: string } }[] }>(
      "/chat/completions",
      chatRequest
    );

    return response.choices[0].message.content;
  }

  /**
   * Generuje odpowiedź w formacie JSON zgodną z podanym schematem
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
    const responseFormat: OpenRouterResponseFormat = {
      type: "json_schema",
      schema,
    };

    const schemaPrompt = `${prompt}\n\nOdpowiedź MUSI być zgodna z podanym schematem JSON${
      options?.schemaName ? ` dla ${options.schemaName}` : ""
    }${options?.strictSchema ? " i nie może zawierać żadnych dodatkowych pól" : ""}.`;

    const jsonResponse = await this.generateCompletion(schemaPrompt, {
      ...options,
      responseFormat,
    });

    try {
      return JSON.parse(jsonResponse);
    } catch (error) {
      throw {
        code: "JSON_PARSE_ERROR",
        message: "Failed to parse JSON response",
        originalError: error,
      };
    }
  }

  /**
   * Generuje fiszki na podstawie dostarczonego tekstu
   */
  async generateFlashcards(
    text: string,
    options?: {
      count?: number;
      parameters?: Partial<OpenRouterParameters>;
    }
  ): Promise<FlashcardGenerationResult> {
    const flashcardSchema = {
      type: "object",
      properties: {
        cards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
              notes: { type: "string" },
            },
            required: ["question", "answer"],
          },
          minItems: options?.count || 3,
          maxItems: options?.count || 10,
        },
      },
      required: ["cards"],
    };

    const systemMessage = this.buildFlashcardSystemPrompt(text, options?.count);

    return this.generateJson<FlashcardGenerationResult>(text, flashcardSchema, {
      systemMessage,
      parameters: options?.parameters,
      schemaName: "fiszki",
      strictSchema: true,
    });
  }

  /**
   * Buduje komunikat systemowy dla generowania fiszek
   * @private
   */
  private buildFlashcardSystemPrompt(text: string, count?: number): string {
    return `Jesteś ekspertem w tworzeniu efektywnych fiszek edukacyjnych. 
    Przeanalizuj poniższy tekst i stwórz ${count || "3-10"} fiszek w formacie pytanie-odpowiedź.
    
    Zasady tworzenia fiszek:
    1. Pytania powinny być jasne i konkretne
    2. Odpowiedzi powinny być zwięzłe ale kompletne
    3. Fiszki powinny obejmować najważniejsze koncepcje z tekstu
    4. Unikaj pytań tak/nie - preferuj pytania wymagające zrozumienia
    5. W polu notes możesz dodać dodatkowe wyjaśnienia lub kontekst
    
    Odpowiedź MUSI być w formacie JSON zgodnym z podanym schematem.`;
  }

  /**
   * Ustawia model do używania w zapytaniach
   */
  setModel(model: string): void {
    this.defaultModel = model;
  }

  /**
   * Ustawia komunikat systemowy do używania w zapytaniach
   */
  setSystemMessage(message: string): void {
    this.defaultSystemMessage = message;
  }

  /**
   * Ustawia parametry modelu do używania w zapytaniach
   */
  setParameters(parameters: Partial<OpenRouterParameters>): void {
    this.defaultParameters = {
      ...this.defaultParameters,
      ...parameters,
    };
  }

  /**
   * Pobiera listę dostępnych modeli z API OpenRouter
   */
  async getAvailableModels(): Promise<OpenRouterModel[]> {
    const response = await this.executeRequest<{ data: OpenRouterModel[] }>(
      "/models",
      undefined
    );
    return response.data;
  }
}
