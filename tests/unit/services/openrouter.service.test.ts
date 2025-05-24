import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterService } from "../../../src/lib/services/openrouter.service";
import type { TypedSupabaseClient } from "../../../src/db/supabase.service";
import type {
  FlashcardGenerationResult,
  OpenRouterModel,
  OpenRouterParameters,
} from "../../../src/types/openrouter.types";

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Utility do weryfikacji, że żadne rzeczywiste zapytanie nie jest wykonywane
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";
const verifyNoRealApiCalls = () => {
  const calls = mockFetch.mock.calls;
  const realApiCalls = calls.filter((call) => call[0].toString().includes(OPENROUTER_API_URL));

  if (realApiCalls.length > 0) {
    console.error("Wykryto próby prawdziwych wywołań API:", realApiCalls);
    throw new Error("Test próbował wykonać prawdziwe wywołanie API!");
  }
};

describe("OpenRouterService", () => {
  let service: OpenRouterService;
  const mockSupabase = {} as TypedSupabaseClient;
  const TEST_API_KEY = "test-api-key";

  beforeEach(() => {
    vi.resetAllMocks();
    // Inicjalizacja serwisu z mockiem supabase i kluczem testowym
    service = new OpenRouterService(mockSupabase, {
      apiKey: TEST_API_KEY,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    verifyNoRealApiCalls();
  });

  describe("constructor", () => {
    it("should initialize with default values when no options provided", () => {
      const defaultService = new OpenRouterService(mockSupabase);
      expect(defaultService).toBeInstanceOf(OpenRouterService);
    });

    it("should use provided API key", () => {
      const customService = new OpenRouterService(mockSupabase, {
        apiKey: "custom-key",
      });
      expect(customService).toBeInstanceOf(OpenRouterService);
    });
  });

  describe("generateCompletion", () => {
    it("should successfully generate text completion", async () => {
      // Arrange
      const mockResponse = {
        choices: [{ message: { content: "Test response" } }],
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await service.generateCompletion("Test prompt");

      // Assert
      expect(result).toBe("Test response");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/chat/completions"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${TEST_API_KEY}`,
          }),
          body: expect.stringContaining("Test prompt"),
        })
      );
    });

    it("should handle API error responses", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: "Invalid API key" },
        }),
      });

      // Act & Assert
      await expect(service.generateCompletion("Test prompt")).rejects.toMatchObject({
        code: "AUTHENTICATION_ERROR",
        status: 401,
      });
    });
  });

  describe("generateJson", () => {
    it("should generate and parse JSON response", async () => {
      // Arrange
      const mockJsonResponse = { key: "value" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockJsonResponse) } }],
        }),
      });

      // Act
      const result = await service.generateJson<{ key: string }>("Test prompt", {
        type: "object",
        properties: { key: { type: "string" } },
      });

      // Assert
      expect(result).toEqual(mockJsonResponse);
    });

    it("should handle invalid JSON response", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Invalid JSON" } }],
        }),
      });

      // Act & Assert
      await expect(service.generateJson("Test prompt", {})).rejects.toMatchObject({
        code: "JSON_PARSE_ERROR",
      });
    });
  });

  describe("generateFlashcards", () => {
    const mockFlashcards: FlashcardGenerationResult = {
      cards: [
        {
          question: "Question 1",
          answer: "Answer 1",
          notes: "Note 1",
        },
        {
          question: "Question 2",
          answer: "Answer 2",
        },
      ],
    };

    it("should generate flashcards successfully", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockFlashcards) } }],
        }),
      });

      // Act
      const result = await service.generateFlashcards("Test text");

      // Assert
      expect(result).toEqual(mockFlashcards);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/chat/completions"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringMatching(/Test text/),
        })
      );
    });

    it("should respect count and difficulty options", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockFlashcards) } }],
        }),
      });

      // Act
      await service.generateFlashcards("Test text", {
        count: 5,
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringMatching(/5/),
        })
      );
    });
  });

  describe("getAvailableModels", () => {
    const mockModels: OpenRouterModel[] = [
      {
        id: "model1",
        name: "Test Model 1",
      },
      {
        id: "model2",
        name: "Test Model 2",
      },
    ];

    it("should fetch available models", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockModels }),
      });

      // Act
      const result = await service.getAvailableModels();

      // Assert
      expect(result).toEqual(mockModels);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/models"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${TEST_API_KEY}`,
          }),
        })
      );
    });

    it("should handle API errors when fetching models", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: { message: "Internal server error" },
        }),
      });

      // Act & Assert
      await expect(service.getAvailableModels()).rejects.toMatchObject({
        code: "API_ERROR",
        status: 500,
      });
    });
  });

  describe("Error handling", () => {
    const testCases = [
      {
        name: "should handle rate limit errors",
        status: 429,
        error: { message: "Too many requests" },
        expectedCode: "RATE_LIMIT_ERROR",
      },
      {
        name: "should handle invalid model errors",
        status: 400,
        error: { type: "invalid_model", param: "test-model" },
        expectedCode: "INVALID_MODEL_ERROR",
      },
      {
        name: "should handle context length errors",
        status: 400,
        error: { type: "context_length_exceeded" },
        expectedCode: "CONTEXT_LENGTH_ERROR",
      },
      {
        name: "should handle network errors",
        error: new TypeError("Failed to fetch"),
        expectedCode: "API_ERROR",
      },
    ];

    testCases.forEach(({ name, status, error, expectedCode }) => {
      it(name, async () => {
        // Arrange
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status,
          json: async () => ({ error }),
        });

        // Act & Assert
        await expect(service.generateCompletion("Test prompt")).rejects.toMatchObject({
          code: expectedCode,
        });
      });
    });
  });

  describe("Configuration methods", () => {
    it("should update model settings", () => {
      // Act
      service.setModel("new-model");

      // Arrange & Assert
      expect(service.generateCompletion("test")).resolves.toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("new-model"),
        })
      );
    });

    it("should update system message", () => {
      // Act
      service.setSystemMessage("new message");

      // Arrange & Assert
      expect(service.generateCompletion("test")).resolves.toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("new message"),
        })
      );
    });

    it("should update model parameters", () => {
      // Arrange
      const newParams: Partial<OpenRouterParameters> = {
        temperature: 0.5,
        max_tokens: 1000,
      };

      // Act
      service.setParameters(newParams);

      // Assert
      expect(service.generateCompletion("test")).resolves.toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("0.5"),
        })
      );
    });
  });

  describe("Retry mechanism", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should retry on network error", async () => {
      // Arrange
      mockFetch
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "Success after retry" } }],
          }),
        });

      // Act
      const resultPromise = service.generateCompletion("test");

      // Advance timers for exponential backoff
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry

      const result = await resultPromise;

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toBe("Success after retry");
    });

    it("should retry on rate limit error", async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            error: { message: "Rate limit exceeded" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "Success after rate limit" } }],
          }),
        });

      // Act
      const resultPromise = service.generateCompletion("test");
      await vi.advanceTimersByTimeAsync(1000); // Wait for backoff
      const result = await resultPromise;

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBe("Success after rate limit");
    });

    it("should not retry on authentication error", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: "Invalid API key" },
        }),
      });

      // Act & Assert
      await expect(service.generateCompletion("test")).rejects.toMatchObject({
        code: "AUTHENTICATION_ERROR",
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should give up after max retries", async () => {
      // Arrange
      mockFetch
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockRejectedValueOnce(new TypeError("Failed to fetch")); // One more than max retries

      // Act
      const resultPromise = service.generateCompletion("test");

      // Advance through all retry attempts
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry
      await vi.advanceTimersByTimeAsync(4000); // Third retry

      // Assert
      await expect(resultPromise).rejects.toMatchObject({
        code: "API_ERROR",
      });
      expect(mockFetch).toHaveBeenCalledTimes(3); // Original + 2 retries
    });
  });

  describe("API Call Safety", () => {
    it("should not make real API calls", async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Test response" } }],
        }),
      });

      // Act
      await service.generateCompletion("test");

      // Assert
      const calls = mockFetch.mock.calls;
      expect(calls.every((call) => !call[0].toString().includes("https://openrouter.ai"))).toBe(true);
    });

    it("should verify all requests use mocked fetch", () => {
      // Act & Assert
      expect(() => {
        global.fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          body: JSON.stringify({ test: true }),
        });
      }).not.toThrow();

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
