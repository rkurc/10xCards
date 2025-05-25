import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterService } from "../../../src/lib/services/openrouter.service";
import type { TypedSupabaseClient } from "../../../src/db/supabase.service";

describe("OpenRouterService (with mocks)", () => {
  let service: OpenRouterService;
  let mockBuildChatRequest: any;
  let mockBuildFlashcardSystemPrompt: any;
  let mockExecuteRequest: any;
  let mockShouldRetry: any;
  let mockRetryRequest: any;

  const mockSupabase = {} as TypedSupabaseClient;

  // Mock fetch API for all tests
  const mockFetch = vi.fn();

  beforeEach(() => {
    // Ensure fetch is properly mocked
    if (global.fetch !== mockFetch) {
      global.fetch = mockFetch;
    }

    // Reset fetch mock between tests
    mockFetch.mockReset();

    // Tworzenie mocków dla metod prywatnych
    // @ts-expect-error - Access to private methods
    mockBuildChatRequest = vi.spyOn(OpenRouterService.prototype, "buildChatRequest");
    // @ts-expect-error - Access to private methods
    mockBuildFlashcardSystemPrompt = vi.spyOn(OpenRouterService.prototype, "buildFlashcardSystemPrompt");
    // @ts-expect-error - Access to private methods
    mockExecuteRequest = vi.spyOn(OpenRouterService.prototype, "executeRequest");
    // @ts-expect-error - Access to private methods
    mockShouldRetry = vi.spyOn(OpenRouterService.prototype, "shouldRetry");
    // @ts-expect-error - Access to private methods
    mockRetryRequest = vi.spyOn(OpenRouterService.prototype, "retryRequest");

    service = new OpenRouterService(mockSupabase, {
      apiKey: "test-api-key",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Private methods", () => {
    describe("buildChatRequest", () => {
      it("should build proper chat request with system message", () => {
        // Przywracamy oryginalną implementację dla tego testu
        mockBuildChatRequest.mockRestore();

        // @ts-expect-error - Access to private method
        const request = service.buildChatRequest("test message", "system message", "test-model", {
          temperature: 0.7,
        });

        expect(request).toEqual({
          model: "test-model",
          messages: [
            { role: "system", content: "system message" },
            { role: "user", content: "test message" },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          top_p: 0.9,
        });
      });

      it("should build request without system message", () => {
        mockBuildChatRequest.mockRestore();

        // @ts-expect-error - Access to private method
        const request = service.buildChatRequest("test message", null, "test-model", { temperature: 0.7 });

        expect(request.messages).toHaveLength(1);
        expect(request.messages[0]).toEqual({
          role: "user",
          content: "test message",
        });
      });
    });

    describe("buildFlashcardSystemPrompt", () => {
      it("should include count in prompt", () => {
        mockBuildFlashcardSystemPrompt.mockRestore();

        // @ts-expect-error - Access to private method
        const prompt = service.buildFlashcardSystemPrompt({
          count: 5,
        });

        expect(prompt).toContain("5");
        expect(prompt).toContain("fiszek");
      });

      it("should handle difficulty levels", () => {
        mockBuildFlashcardSystemPrompt.mockRestore();

        // @ts-expect-error - Access to private method
        const beginnerPrompt = service.buildFlashcardSystemPrompt({
          difficulty: "beginner",
        });
        // @ts-expect-error - Access to private method
        const advancedPrompt = service.buildFlashcardSystemPrompt({
          difficulty: "advanced",
        });

        expect(beginnerPrompt).toContain("podstawowe pojęcia");
        expect(advancedPrompt).toContain("zaawansowane pojęcia");
      });
    });
  });

  describe("Integration between methods", () => {
    it("should properly chain methods for flashcard generation", async () => {
      // Arrange
      const mockResponse = {
        cards: [{ front: "Q1", back: "A1" }],
      };

      mockBuildFlashcardSystemPrompt.mockReturnValue("system prompt");
      mockBuildChatRequest.mockReturnValue({ messages: [] });
      mockExecuteRequest.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockResponse) } }],
      });

      // Act
      await service.generateFlashcards("test text", { count: 1 });

      // Assert
      expect(mockBuildFlashcardSystemPrompt).toHaveBeenCalledWith(expect.objectContaining({ count: 1 }));
      expect(mockBuildChatRequest).toHaveBeenCalled();
      expect(mockExecuteRequest).toHaveBeenCalled();
    });

    it("should handle errors in the chain", async () => {
      // Arrange
      mockBuildChatRequest.mockImplementation(() => {
        throw new Error("Test error");
      });

      // Act & Assert
      await expect(service.generateFlashcards("test text")).rejects.toThrow("Test error");

      expect(mockExecuteRequest).not.toHaveBeenCalled();
    });
  });

  describe("Retry mechanism internals", () => {
    it("should properly evaluate retry conditions", () => {
      mockShouldRetry.mockRestore();

      const networkError = new TypeError("Failed to fetch");
      const authError = { status: 401 };
      const rateLimitError = { status: 429 };

      // @ts-expect-error - Access to private method
      expect(service.shouldRetry(networkError, "/test")).toBe(true);
      // @ts-expect-error - Access to private method
      expect(service.shouldRetry(authError, "/test")).toBe(false);
      // @ts-expect-error - Access to private method
      expect(service.shouldRetry(rateLimitError, "/test")).toBe(true);
    });
  });

  describe("Retry integration", () => {
    beforeEach(() => {
      mockRetryRequest.mockClear();
      mockShouldRetry.mockClear();
      mockExecuteRequest.mockClear();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should integrate retry logic with request execution", async () => {
      // Create a network error that should trigger retry
      const networkError = new TypeError("Failed to fetch") as TypeError & {
        code?: string;
        status?: number;
      };
      mockExecuteRequest.mockRejectedValueOnce(networkError);

      // Mock shouldRetry to track calls and indicate this error should be retried
      mockShouldRetry.mockReturnValue(true); // Use mockReturnValue instead of mockReturnValueOnce

      // Set up successful response after retry
      const successResponse = {
        data: [
          { id: "model1", name: "Test Model 1" },
          { id: "model2", name: "Test Model 2" },
        ],
      };
      mockRetryRequest.mockResolvedValueOnce(successResponse);

      // Act - call a method that uses executeRequest internally
      const result = await service.getAvailableModels();

      // Assert that retry mechanism worked correctly
      expect(mockExecuteRequest).toHaveBeenCalledTimes(1);
      expect(mockShouldRetry).toHaveBeenCalledWith(networkError, expect.any(String));
      expect(mockRetryRequest).toHaveBeenCalledWith(expect.any(String), undefined);
      expect(mockRetryRequest).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        { id: "model1", name: "Test Model 1" },
        { id: "model2", name: "Test Model 2" },
      ]);
    });

    it("should not retry on non-retryable errors", async () => {
      // Create an auth error that should not be retried
      const authError = new Error("Invalid API key") as Error & {
        code: string;
        status: number;
      };
      authError.code = "AUTHENTICATION_ERROR";
      authError.status = 401;
      mockExecuteRequest.mockRejectedValueOnce(authError);

      // Mock shouldRetry to return false for auth errors
      mockShouldRetry.mockReturnValue(false); // Use mockReturnValue instead of mockReturnValueOnce

      // Act & Assert
      const promise = service.getAvailableModels();
      await expect(promise).rejects.toMatchObject({
        code: "AUTHENTICATION_ERROR",
        message: "Invalid API key",
        status: 401,
      });

      // Assert retry mechanism worked correctly
      expect(mockExecuteRequest).toHaveBeenCalledTimes(1);
      // Check shouldRetry called with error before error processing
      expect(mockShouldRetry).toHaveBeenCalledWith(authError, expect.any(String));
      // Verify no retry was attempted since shouldRetry returned false
      expect(mockRetryRequest).not.toHaveBeenCalled();
    });
  });
});
