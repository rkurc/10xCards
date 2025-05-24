import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterService } from "../../../src/lib/services/openrouter.service";
import type { TypedSupabaseClient } from "../../../src/db/supabase.service";

describe("OpenRouterService (with mocks)", () => {
  let service: OpenRouterService;
  let mockBuildChatRequest: vi.SpyInstance;
  let mockBuildFlashcardSystemPrompt: vi.SpyInstance;
  let mockExecuteRequest: vi.SpyInstance;
  let mockShouldRetry: vi.SpyInstance;
  let mockRetryRequest: vi.SpyInstance;

  const mockSupabase = {} as TypedSupabaseClient;

  beforeEach(() => {
    // Tworzenie mocków dla metod prywatnych
    mockBuildChatRequest = vi.spyOn(OpenRouterService.prototype as any, "buildChatRequest");
    mockBuildFlashcardSystemPrompt = vi.spyOn(OpenRouterService.prototype as any, "buildFlashcardSystemPrompt");
    mockExecuteRequest = vi.spyOn(OpenRouterService.prototype as any, "executeRequest");
    mockShouldRetry = vi.spyOn(OpenRouterService.prototype as any, "shouldRetry");
    mockRetryRequest = vi.spyOn(OpenRouterService.prototype as any, "retryRequest");

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

        const request = (service as any).buildChatRequest("test message", "system message", "test-model", {
          temperature: 0.7,
        });

        expect(request).toEqual({
          model: "test-model",
          messages: [
            { role: "system", content: "system message" },
            { role: "user", content: "test message" },
          ],
          temperature: 0.7,
        });
      });

      it("should build request without system message", () => {
        mockBuildChatRequest.mockRestore();

        const request = (service as any).buildChatRequest("test message", null, "test-model", { temperature: 0.7 });

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

        const prompt = (service as any).buildFlashcardSystemPrompt({
          count: 5,
        });

        expect(prompt).toContain("5");
        expect(prompt).toContain("fiszek");
      });

      it("should handle difficulty levels", () => {
        mockBuildFlashcardSystemPrompt.mockRestore();

        const beginnerPrompt = (service as any).buildFlashcardSystemPrompt({
          difficulty: "beginner",
        });
        const advancedPrompt = (service as any).buildFlashcardSystemPrompt({
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

      expect((service as any).shouldRetry(networkError, "/test")).toBe(true);
      expect((service as any).shouldRetry(authError, "/test")).toBe(false);
      expect((service as any).shouldRetry(rateLimitError, "/test")).toBe(true);
    });

    it("should integrate retry logic with request execution", async () => {
      // Arrange
      const successResponse = { data: "success" };
      mockExecuteRequest.mockRejectedValueOnce(new TypeError("Failed to fetch"));
      mockShouldRetry.mockReturnValue(true);
      mockRetryRequest.mockResolvedValue(successResponse);

      // Act
      const result = await service.getAvailableModels();

      // Assert
      expect(mockShouldRetry).toHaveBeenCalled();
      expect(mockRetryRequest).toHaveBeenCalled();
      expect(result).toBe(successResponse);
    });
  });
});
