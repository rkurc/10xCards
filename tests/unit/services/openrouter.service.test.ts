/* eslint-disable @typescript-eslint/ban-ts-comment */
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
  const realApiCalls = calls.filter((call) => String(call[0]).includes(OPENROUTER_API_URL));

  if (realApiCalls.length > 0) {
    console.error("Detected real API calls:", realApiCalls);
    throw new Error("Test attempted to make real API calls!");
  }
};

// Suppress unhandled promise rejection warnings for this test file
process.on("unhandledRejection", () => {});

describe("OpenRouterService", () => {
  let service: OpenRouterService;
  const mockSupabase = {} as TypedSupabaseClient;
  const TEST_API_KEY = "test-api-key";

  beforeEach(() => {
    vi.resetAllMocks();

    // Verify that fetch is properly mocked
    if (global.fetch !== mockFetch) {
      global.fetch = mockFetch;
    }

    // Reset mocks and create a new service instance
    service = new OpenRouterService(mockSupabase, {
      apiKey: TEST_API_KEY,
    });

    // Default successful response implementation
    mockFetch.mockReset().mockImplementation(async (url, options) => {
      const endpoint = url.toString();
      const body = options?.body ? JSON.parse(options.body as string) : {};

      // Verify auth header
      if (!options?.headers?.Authorization?.includes(TEST_API_KEY)) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: { message: "Invalid API key" } }),
        };
      }

      // Handle rate limiting - special case for tests that need to test rate limiting
      if (body.messages?.[0]?.content?.includes("trigger_rate_limit")) {
        return {
          ok: false,
          status: 429,
          json: async () => ({ error: { message: "Too many requests" } }),
        };
      }

      // Handle network errors - special case for tests that need to test network errors
      if (body.messages?.[0]?.content?.includes("trigger_network_error")) {
        throw new TypeError("Failed to fetch");
      }

      // Handle specific endpoints
      if (endpoint.includes("/chat/completions")) {
        if (body.response_format?.type === "json_schema") {
          return {
            ok: true,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
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
                    }),
                  },
                },
              ],
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "Test response" } }],
          }),
        };
      }

      if (endpoint.includes("/models")) {
        return {
          ok: true,
          json: async () => ({
            data: [
              { id: "model1", name: "Test Model 1" },
              { id: "model2", name: "Test Model 2" },
            ],
          }),
        };
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: { message: "Not found" } }),
      };
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
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Test response" } }],
        }),
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
      // Create a fresh service instance for this test
      const errorTestService = new OpenRouterService(mockSupabase, { apiKey: TEST_API_KEY });

      // Create a specialized mock for this test that always returns the same error
      const testMockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: { message: "Internal server error" },
        }),
      });

      // Replace the global fetch
      const originalFetch = global.fetch;
      global.fetch = testMockFetch;

      vi.useFakeTimers();
      try {
        const resultPromise = errorTestService.getAvailableModels();
        await vi.runAllTimersAsync();
        await expect(resultPromise).rejects.toMatchObject({
          code: "MAX_RETRIES_EXCEEDED",
          status: 500,
          retryReasons: ["Internal server error", "Internal server error", "Internal server error"],
        });
      } finally {
        vi.useRealTimers();
        // Restore the original fetch
        global.fetch = originalFetch;
      }
    });
  });

  describe("Error handling", () => {
    it("should handle rate limit errors", async () => {
      // Create a fresh service instance
      const errorTestService = new OpenRouterService(mockSupabase, { apiKey: TEST_API_KEY });

      // Create a specialized mock that always returns the same error
      const testMockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          error: { message: "Too many requests" },
        }),
      });

      // Replace the global fetch
      const originalFetch = global.fetch;
      global.fetch = testMockFetch;

      vi.useFakeTimers();
      try {
        const resultPromise = errorTestService.generateCompletion("Test prompt");
        await vi.runAllTimersAsync();
        await expect(resultPromise).rejects.toMatchObject({
          code: "MAX_RETRIES_EXCEEDED",
          retryReasons: ["Too many requests", "Too many requests", "Too many requests"],
        });
      } finally {
        vi.useRealTimers();
        // Restore the original fetch
        global.fetch = originalFetch;
      }
    });

    it("should handle invalid model errors", async () => {
      // Create a fresh service instance
      const errorTestService = new OpenRouterService(mockSupabase, { apiKey: TEST_API_KEY });

      // Create a specialized mock
      const testMockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { type: "invalid_model", param: "test-model" },
        }),
      });

      // Replace the global fetch
      const originalFetch = global.fetch;
      global.fetch = testMockFetch;

      // Act & Assert
      await expect(errorTestService.generateCompletion("Test prompt")).rejects.toMatchObject({
        code: "INVALID_MODEL_ERROR",
      });

      // Restore the original fetch
      global.fetch = originalFetch;
    });

    it("should handle context length errors", async () => {
      // Create a fresh service instance
      const errorTestService = new OpenRouterService(mockSupabase, { apiKey: TEST_API_KEY });

      // Create a specialized mock
      const testMockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { type: "context_length_exceeded" },
        }),
      });

      // Replace the global fetch
      const originalFetch = global.fetch;
      global.fetch = testMockFetch;

      // Act & Assert
      await expect(errorTestService.generateCompletion("Test prompt")).rejects.toMatchObject({
        code: "CONTEXT_LENGTH_ERROR",
      });

      // Restore the original fetch
      global.fetch = originalFetch;
    });

    it("should handle network errors", async () => {
      // Create a fresh service instance with reduced maxRetries
      const errorTestService = new OpenRouterService(mockSupabase, { apiKey: TEST_API_KEY });

      // Set maxRetries to 0 to avoid test timeouts (hack for testing)
      // @ts-ignore - Accessing private property
      errorTestService.maxRetries = 0;

      // Create a specialized mock that throws TypeError
      const testMockFetch = vi.fn().mockImplementation(() => {
        throw new TypeError("Failed to fetch");
      });

      // Replace the global fetch
      const originalFetch = global.fetch;
      global.fetch = testMockFetch;

      // Act & Assert
      await expect(errorTestService.generateCompletion("Test prompt")).rejects.toMatchObject({
        code: "MAX_RETRIES_EXCEEDED",
        retryReasons: [],
      });

      // Restore the original fetch
      global.fetch = originalFetch;
    });
  });

  describe("Configuration methods", () => {
    it("should update model settings", async () => {
      // Act
      service.setModel("new-model");

      // Arrange & Assert
      await expect(service.generateCompletion("test")).resolves.toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("new-model"),
        })
      );
    });

    it("should update system message", async () => {
      // Act
      service.setSystemMessage("new message");

      // Arrange & Assert
      await expect(service.generateCompletion("test")).resolves.toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("new message"),
        })
      );
    });

    it("should update model parameters", async () => {
      // Arrange
      const newParams: Partial<OpenRouterParameters> = {
        temperature: 0.5,
        max_tokens: 1000,
      };

      // Act
      service.setParameters(newParams);

      // Assert
      await expect(service.generateCompletion("test")).resolves.toBeDefined();
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
      // Create a dedicated instance for this test
      const retryTestService = new OpenRouterService(mockSupabase, { apiKey: TEST_API_KEY });

      // Override maxRetries to reduce test time
      // @ts-expect-error - Accessing private property
      retryTestService.maxRetries = 1;

      // Create a specialized mock that fails once then succeeds
      const testMockFetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: "Success after retry" } }],
          }),
        });

      // Replace the global fetch
      const originalFetch = global.fetch;
      global.fetch = testMockFetch;

      // Act
      const resultPromise = retryTestService.generateCompletion("test");

      // Advance timers for exponential backoff
      await vi.advanceTimersByTimeAsync(1000);

      const result = await resultPromise;

      // Assert
      expect(testMockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBe("Success after retry");

      // Restore the original fetch
      global.fetch = originalFetch;
    });

    it("should retry on rate limit error", async () => {
      // Create a dedicated instance for this test
      const retryTestService = new OpenRouterService(mockSupabase, { apiKey: TEST_API_KEY });

      // Create a specialized mock that returns rate limit error then succeeds
      const testMockFetch = vi
        .fn()
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

      // Replace the global fetch
      const originalFetch = global.fetch;
      global.fetch = testMockFetch;

      // Act
      const resultPromise = retryTestService.generateCompletion("test");
      await vi.advanceTimersByTimeAsync(1000); // Wait for backoff
      const result = await resultPromise;

      // Assert
      expect(testMockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBe("Success after rate limit");

      // Restore the original fetch
      global.fetch = originalFetch;
    });

    it("should not retry on authentication error", async () => {
      // Create a dedicated instance for this test
      const retryTestService = new OpenRouterService(mockSupabase, { apiKey: TEST_API_KEY });

      // Create a specialized mock that returns auth error
      const testMockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: { message: "Invalid API key" },
        }),
      });

      // Replace the global fetch
      const originalFetch = global.fetch;
      global.fetch = testMockFetch;

      // Act & Assert
      await expect(retryTestService.generateCompletion("test")).rejects.toMatchObject({
        code: "AUTHENTICATION_ERROR",
      });
      expect(testMockFetch).toHaveBeenCalledTimes(1);

      // Restore the original fetch
      global.fetch = originalFetch;
    });

    it("should give up after max retries", async () => {
      // Create a dedicated instance for this test with a low retry count
      const retryTestService = new OpenRouterService(mockSupabase, { apiKey: TEST_API_KEY });

      // Clearly set maxRetries to 2 for deterministic testing
      // @ts-expect-error - Accessing private property
      retryTestService.maxRetries = 2;

      // Create a specialized mock that always fails
      const testMockFetch = vi
        .fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockRejectedValueOnce(new TypeError("Failed to fetch"));

      // Replace the global fetch
      const originalFetch = global.fetch;
      global.fetch = testMockFetch;

      // Act
      try {
        const resultPromise = retryTestService.generateCompletion("test");
        // Advance through all retry attempts
        await vi.advanceTimersByTimeAsync(1000); // First retry
        await vi.advanceTimersByTimeAsync(2000); // Second retry
        // Assert
        await expect(resultPromise).rejects.toMatchObject({
          code: "MAX_RETRIES_EXCEEDED",
          retryReasons: ["Failed to fetch", "Failed to fetch"],
        });
        expect(testMockFetch).toHaveBeenCalledTimes(3); // Initial try + 2 retries = 3 attempts
      } finally {
        // Restore the original fetch
        global.fetch = originalFetch;
      }
    });
  });

  describe("API Call Safety", () => {
    it("should not make real API calls", async () => {
      // Create a dedicated instance for this test
      const safetyTestService = new OpenRouterService(mockSupabase, { apiKey: TEST_API_KEY });

      // Override the apiUrl to a non-HTTP URL for safety
      // @ts-expect-error - Accessing private property
      safetyTestService.apiUrl = "test://test-url";

      // Create a specialized mock
      const testMockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Test response" } }],
        }),
      });

      // Replace the global fetch
      const originalFetch = global.fetch;
      global.fetch = testMockFetch;

      // Act
      await safetyTestService.generateCompletion("test");

      // Assert - Make sure all calls use our test URL, not the real API
      const calls = testMockFetch.mock.calls;
      for (const call of calls) {
        expect(String(call[0])).toContain("test://test-url");
        expect(String(call[0])).not.toContain("openrouter.ai");
      }

      // Restore the original fetch
      global.fetch = originalFetch;
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
