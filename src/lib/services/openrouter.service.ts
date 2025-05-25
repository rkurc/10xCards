import { BaseService } from "../../services/base.service";
import type { TypedSupabaseClient } from "../../db/supabase.service";
import type {
  OpenRouterParameters,
  OpenRouterResponseFormat,
  OpenRouterMessage,
  OpenRouterChatRequest,
  OpenRouterModel,
  FlashcardGenerationResult,
  JsonSchema,
} from "../../types/openrouter.types";

export interface ApiErrorResponse {
  status?: number;
  response?: {
    data?: {
      error?: {
        message?: string;
        type?: string;
      };
    };
  };
}

interface EnhancedError extends Error {
  code: string;
  status?: number;
}

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
  private readonly maxRetries = 3;

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
    this.apiKey = options.apiKey || process.env.PUBLIC_OPENROUTER_API_KEY || "";
    this.defaultModel = options.defaultModel || "anthropic/claude-3-opus";
    this.defaultSystemMessage =
      options.defaultSystemMessage || "Jesteś pomocnym asystentem do tworzenia fiszek edukacyjnych.";
    this.defaultParameters = {
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.9,
      ...options.defaultParameters,
    };

    if (!this.apiKey) {
      console.warn("OpenRouter API key not provided. Service will not function correctly.");
    }
  }

  /**
   * Tworzy obiekt żądania zgodny z formatem Chat API
   * @private
   */
  private buildChatRequest(
    userMessage: string,
    systemMessage: string | null = null,
    model: string | null = null,
    parameters: Partial<OpenRouterParameters> | null = null,
    responseFormat: OpenRouterResponseFormat | null = null
  ): OpenRouterChatRequest {
    const messages: OpenRouterMessage[] = [];

    if (systemMessage) {
      messages.push({
        role: "system",
        content: systemMessage,
      });
    }

    messages.push({
      role: "user",
      content: userMessage,
    });

    // Create request with mandatory fields
    const request: OpenRouterChatRequest = {
      model: model || this.defaultModel,
      messages,
    };

    // Merge parameters from this.defaultParameters and provided parameters
    const mergedParameters = {
      ...this.defaultParameters,
      ...(parameters || {}),
    };

    // Apply parameters to request
    if (mergedParameters.temperature !== undefined) request.temperature = mergedParameters.temperature;
    if (mergedParameters.max_tokens !== undefined) request.max_tokens = mergedParameters.max_tokens;
    if (mergedParameters.top_p !== undefined) request.top_p = mergedParameters.top_p;
    if (mergedParameters.presence_penalty !== undefined) request.presence_penalty = mergedParameters.presence_penalty;

    // Handle response format
    if (responseFormat) {
      request.response_format = responseFormat;
    }

    return request;
  }

  /**
   * Sprawdza, czy należy ponowić próbę dla danego błędu
   * @private
   */
  private shouldRetry(error: Error | ApiErrorResponse | unknown, path?: string): boolean {
    // Always retry network errors
    if (error instanceof TypeError) return true;

    // Check for mock TypeError objects in tests (more robust check)
    if (
      error &&
      typeof error === "object" &&
      (("name" in error && error.name === "TypeError") ||
        ("constructor" in error && error.constructor.name === "TypeError"))
    ) {
      return true;
    }

    // For API errors, only retry specific status codes
    if (error && typeof error === "object" && "status" in error) {
      const statusCode = error.status as number;
      return (
        statusCode === 429 || // Rate limit
        statusCode === 500 || // Internal server error
        statusCode === 502 || // Bad gateway
        statusCode === 503 || // Service unavailable
        statusCode === 504 // Gateway timeout
      );
    }

    // If it's an error with a code property, check if it's a retryable error type
    if (error && typeof error === "object" && "code" in error) {
      const code = error.code as string;
      return code === "NETWORK_ERROR" || code === "RATE_LIMIT_ERROR" || code === "TIMEOUT_ERROR";
    }

    return false;
  }

  /**
   * Ponawia zapytanie z exponential backoff
   * @private
   */
  private async retryRequest<T>(endpoint: string, body?: unknown): Promise<T> {
    let lastError: Error | ApiErrorResponse = new Error("Initial retry error");
    const retryReasons: string[] = [];

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const url = `${this.apiUrl}${endpoint}`;
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://10xcards.com",
        };

        // Add exponential backoff delay
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }

        // Use global.fetch to ensure mockability for tests
        const response = await global.fetch(url, {
          method: "POST",
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
          const apiError: ApiErrorResponse = {
            status: response.status,
            response: { data },
          };

          // If we shouldn't retry this error, fail immediately with a properly formatted error
          if (!this.shouldRetry(apiError, endpoint)) {
            this.handleApiError(apiError);
          }

          // Otherwise keep track of the last error and continue to the next retry attempt
          lastError = apiError;
          continue;
        }

        // Success! Return the data
        return data;
      } catch (error) {
        retryReasons.push(error instanceof Error ? error.message : String(error));
        // Handle network errors and other exceptions consistently
        if (error instanceof Error) {
          // If the error already has a code property, it's already been processed
          if ("code" in error) {
            // If we should no longer retry this type of error, just re-throw it
            if (!this.shouldRetry(error, endpoint)) {
              throw error;
            }

            // Otherwise, store it and continue retrying
            lastError = error;
            continue;
          }

          // For network errors (TypeError), we should continue retrying
          if (error instanceof TypeError) {
            lastError = error;
            continue;
          }

          // For other errors without a code, add a standardized error structure
          const enhancedError = new Error(
            `API request failed during retry (${attempt + 1}/${this.maxRetries}): ${error.message}`
          ) as EnhancedError;
          enhancedError.code = "API_ERROR";
          enhancedError.status = 500;

          // Check if we should retry this type of error
          if (!this.shouldRetry(enhancedError, endpoint)) {
            throw enhancedError;
          }

          lastError = enhancedError;
        } else {
          // For unknown error types, create a standard error
          const unknownError = new Error("Unknown error during API retry") as EnhancedError;
          unknownError.code = "UNKNOWN_ERROR";
          unknownError.status = 500;

          if (!this.shouldRetry(unknownError, endpoint)) {
            throw unknownError;
          }

          lastError = unknownError;
        }
      }
    }

    // If we get here, we've exhausted all retries
    // Format the final error with additional context about retries
    if (lastError instanceof Error) {
      const enhancedError = new Error(
        `API request failed after ${this.maxRetries} retries: ${lastError.message}`
      ) as EnhancedError & { retryReasons?: string[] };
      enhancedError.code = "MAX_RETRIES_EXCEEDED";
      enhancedError.status = 500;
      enhancedError.retryReasons = retryReasons;
      throw enhancedError;
    }

    // For API error responses, handle them through our standard handler
    this.handleApiError(lastError as ApiErrorResponse);
  }

  /**
   * Przetwarza błędy API i rzuca odpowiednie wyjątki
   * @private
   */
  private handleApiError(error: Error | ApiErrorResponse): never {
    let enhancedError: EnhancedError;

    // Network errors
    if (error instanceof TypeError) {
      enhancedError = new Error("Network error occurred") as EnhancedError;
      enhancedError.code = "NETWORK_ERROR";
      throw enhancedError;
    }

    // If it's already an enhanced error with a code, just throw it
    if (error instanceof Error && "code" in error) {
      throw error;
    }

    // Handle API errors
    const apiError = error as ApiErrorResponse;
    let message: string;
    let code: string;

    // Determine the appropriate error code and message based on status or error type
    if (apiError.status === 401 || apiError.status === 403) {
      message = "Invalid API key";
      code = "AUTHENTICATION_ERROR";
    } else if (apiError.status === 429) {
      message = "Rate limit exceeded";
      code = "RATE_LIMIT_ERROR";
    } else if (apiError.response?.data?.error?.type === "invalid_model") {
      message = "Invalid model specified";
      code = "INVALID_MODEL_ERROR";
    } else if (apiError.response?.data?.error?.type === "context_length_exceeded") {
      message = "Input text too long";
      code = "CONTEXT_LENGTH_ERROR";
    } else if (apiError.response?.data?.error?.type === "json_parse_error") {
      message = "Failed to parse JSON response";
      code = "JSON_PARSE_ERROR";
    } else {
      // Get the message from the API response or use a default message
      message = apiError.response?.data?.error?.message || "Unknown API error";
      code = "API_ERROR";
    }

    // Construct and throw the error with consistent format
    enhancedError = new Error(message) as EnhancedError;
    enhancedError.code = code;
    enhancedError.status = apiError.status || 500; // Default to 500 if status is not available
    throw enhancedError;
  }

  /**
   * Wykonuje żądanie do API OpenRouter
   * @private
   */
  private async executeRequest<T>(endpoint: string, body?: unknown): Promise<T> {
    try {
      const url = `${this.apiUrl}${endpoint}`;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://10xcards.com",
      };

      // Always use global.fetch (not fetch) to ensure mockability for tests
      const response = await global.fetch(url, {
        method: "POST",
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        const error: ApiErrorResponse = {
          status: response.status,
          response: { data },
        };

        // Check if we should retry the request based on the error type
        if (this.shouldRetry(error, endpoint)) {
          return await this.retryRequest<T>(endpoint, body);
        }

        // Transform API errors into standardized format and throw
        this.handleApiError(error);
      }

      return data;
    } catch (error) {
      // If it's a network error (TypeError) that should be retried
      if (error instanceof TypeError && this.shouldRetry(error, endpoint)) {
        return await this.retryRequest<T>(endpoint, body);
      }

      // If it's an error we've already processed (has a code property), just rethrow it
      if (error instanceof Error && "code" in error) {
        throw error;
      }

      // If it's a standard Error, wrap it with additional context for consistent error format
      if (error instanceof Error) {
        const enhancedError = new Error(`API request failed: ${error.message}`) as EnhancedError;
        enhancedError.code = "API_ERROR";
        enhancedError.status = 500;
        throw enhancedError;
      }

      // Handle API-specific errors that have status code
      if (error && typeof error === "object" && "status" in error) {
        this.handleApiError(error as ApiErrorResponse);
      }

      // For truly unknown errors, create a generic one with consistent format
      const wrappedError: ApiErrorResponse = {
        status: 500,
        response: {
          data: {
            error: {
              message: "Unknown error during API request",
              type: "unknown_error",
            },
          },
        },
      };

      this.handleApiError(wrappedError);
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
    const chatRequest = this.buildChatRequest(
      prompt,
      options?.systemMessage || this.defaultSystemMessage,
      options?.model,
      options?.parameters || undefined,
      options?.responseFormat
    );

    const response = await this.executeRequest<{
      choices: { message: { content: string } }[];
    }>("/chat/completions", chatRequest);

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
      json_schema: {
        name: options?.schemaName || "response",
        strict: options?.strictSchema ?? true,
        schema: schema,
      },
    };

    const jsonResponse = await this.generateCompletion(prompt, {
      ...options,
      responseFormat,
    });

    try {
      // Try to parse the JSON response
      let parsedResponse = JSON.parse(jsonResponse);

      // Some models might return the result wrapped in an additional object
      // For example: { "response": { ...actual data... } }
      // If the schema name is used as a wrapper, extract the inner content
      const schemaName = options?.schemaName || "response";
      if (parsedResponse && typeof parsedResponse === "object" && schemaName in parsedResponse) {
        parsedResponse = parsedResponse[schemaName];
      }

      return parsedResponse as T;
    } catch (err) {
      // Create a standardized error for JSON parsing failures
      const parseError: EnhancedError = new Error(
        `Failed to parse JSON response: ${(err as Error)?.message || "Invalid JSON"}. Response: ${jsonResponse.slice(0, 100)}...`
      ) as EnhancedError;
      parseError.code = "JSON_PARSE_ERROR";
      parseError.status = 422;
      throw parseError;
    }
  }

  /**
   * Generuje fiszki na podstawie podanego tekstu
   */
  async generateFlashcards(
    text: string,
    options?: {
      count?: number;
      difficulty?: "beginner" | "advanced";
      model?: string;
      parameters?: Partial<OpenRouterParameters>;
    }
  ): Promise<FlashcardGenerationResult> {
    const systemMessage = this.buildFlashcardSystemPrompt({
      count: options?.count,
      difficulty: options?.difficulty,
    });

    return await this.generateJson<FlashcardGenerationResult>(text, this.buildFlashcardSchema(), {
      model: options?.model,
      systemMessage,
      parameters: options?.parameters,
    });
  }

  /**
   * Buduje komunikat systemowy dla generowania fiszek
   * @private
   */
  private buildFlashcardSystemPrompt(options?: { count?: number; difficulty?: "beginner" | "advanced" }): string {
    let prompt = "Jesteś ekspertem w tworzeniu efektywnych fiszek edukacyjnych. ";
    prompt += `Przeanalizuj podany tekst i stwórz ${options?.count || 5} najważniejszych fiszek. `;

    if (options?.difficulty === "beginner") {
      prompt += "Skup się na podstawowe pojęcia i fundamenty. ";
    } else if (options?.difficulty === "advanced") {
      prompt += "Skup się na zaawansowane pojęcia i szczegóły. ";
    }

    prompt += `
    Każda fiszka powinna zawierać pytanie i odpowiedź.
    Pytania powinny być jasne i konkretne.
    Odpowiedzi powinny być zwięzłe ale kompletne.
    Dodaj pomocnicze notatki tam gdzie to pomoże w zrozumieniu.`;

    return prompt;
  }

  /**
   * Buduje schemat JSON dla walidacji fiszek
   * @private
   */
  private buildFlashcardSchema(): JsonSchema {
    return {
      type: "object",
      properties: {
        cards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: "Pytanie na fiszce",
              },
              answer: {
                type: "string",
                description: "Odpowiedź na fiszce",
              },
              notes: {
                type: "string",
                description: "Dodatkowe notatki (opcjonalne)",
              },
            },
            required: ["question", "answer"],
          },
        },
      },
      required: ["cards"],
    };
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
    const response = await this.executeRequest<{ data: OpenRouterModel[] }>("/models");
    return response.data;
  }
}
