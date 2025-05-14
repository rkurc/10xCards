import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerationService } from "../generation.service";
import { ErrorCode } from "../../utils/db-error-handler";

// Mock the SupabaseClient
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn().mockReturnValue({
    data: null,
    error: null,
  }),
  rpc: vi.fn().mockImplementation((procedure, params) => {
    if (procedure === "finalize_generation") {
      return Promise.resolve({
        data: {
          set_id: "new-set-id",
          name: params?.p_name || "Test Set",
          card_count: params?.p_accepted_cards?.length || 2,
        },
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: { message: "Unknown procedure" } });
  }),
};

describe("GenerationService", () => {
  let generationService: GenerationService;
  const userId = "test-user-id";

  beforeEach(() => {
    vi.clearAllMocks();
    generationService = new GenerationService(mockSupabase as any);
  });

  describe("US-001: Automated flash card generation", () => {
    it("should start text processing and return generation ID", async () => {
      // Arrange
      const command = {
        text: "This is a test text for generating flashcards.",
        target_count: 5,
      };

      // Act
      const result = await generationService.startTextProcessing(userId, command);

      // Assert
      expect(result).toHaveProperty("generation_id");
      expect(result).toHaveProperty("estimated_time_seconds");
      expect(typeof result.generation_id).toBe("string");
      expect(typeof result.estimated_time_seconds).toBe("number");
    });
  });

  describe("US-006: Accepting, modifying, or rejecting AI-generated cards", () => {
    it("should accept all generated cards", async () => {
      // Arrange
      const generationId = "test-generation-id";
      const command = { set_id: "test-set-id" };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "generation_logs") {
          return {
            ...mockSupabase,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { user_id: userId, id: generationId },
              error: null,
            }),
          };
        }
        if (table === "card_sets") {
          return {
            ...mockSupabase,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: command.set_id },
              error: null,
            }),
          };
        }
        if (table === "generation_results") {
          return {
            ...mockSupabase,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [
                { front_content: "Front 1", back_content: "Back 1", readability_score: 0.8 },
                { front_content: "Front 2", back_content: "Back 2", readability_score: 0.7 },
              ],
              error: null,
            }),
          };
        }
        if (table === "cards") {
          return {
            ...mockSupabase,
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({
              data: [{ id: "card-1" }, { id: "card-2" }],
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      // Act
      const result = await generationService.acceptAllCards(userId, generationId, command);

      // Assert
      expect(result).toHaveProperty("accepted_count");
      expect(result).toHaveProperty("card_ids");
      expect(result.accepted_count).toBe(2);
      expect(result.card_ids).toHaveLength(2);
    });

    it("should accept a specific card with edits", async () => {
      // Arrange
      const generationId = "test-generation-id";
      const cardId = "test-card-id";
      const command = {
        set_id: "test-set-id",
        front_content: "Edited Front",
        back_content: "Edited Back",
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "generation_logs") {
          return {
            ...mockSupabase,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                user_id: userId,
                id: generationId,
                accepted_edited_count: 0,
              },
              error: null,
            }),
          };
        }
        if (table === "card_sets") {
          return {
            ...mockSupabase,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: command.set_id },
              error: null,
            }),
          };
        }
        if (table === "generation_results") {
          return {
            ...mockSupabase,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: cardId,
                front_content: "Original Front",
                back_content: "Original Back",
                readability_score: 0.75,
              },
              error: null,
            }),
          };
        }
        if (table === "cards") {
          return {
            ...mockSupabase,
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "new-card-id",
                front_content: command.front_content,
                back_content: command.back_content,
                source_type: "ai_edited",
                readability_score: 0.75,
              },
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      // Act
      const result = await generationService.acceptCard(userId, generationId, cardId, command);

      // Assert
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("front_content");
      expect(result).toHaveProperty("back_content");
      expect(result).toHaveProperty("source_type");
      expect(result.front_content).toBe("Edited Front");
      expect(result.back_content).toBe("Edited Back");
      expect(result.source_type).toBe("ai_edited");
    });

    it("should reject a specific card", async () => {
      // Arrange
      const generationId = "test-generation-id";
      const cardId = "test-card-id";

      mockSupabase.from.mockImplementation((table) => {
        if (table === "generation_logs") {
          return {
            ...mockSupabase,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                user_id: userId,
                id: generationId,
                rejected_count: 0,
              },
              error: null,
            }),
          };
        }
        if (table === "generation_results") {
          return {
            ...mockSupabase,
            select: vi.fn().mockReturnThis(),
            match: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: cardId },
              error: null,
            }),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      // Act & Assert
      await expect(generationService.rejectCard(userId, generationId, cardId)).resolves.not.toThrow();
    });

    it("should finalize generation by creating a card set", async () => {
      // Arrange
      const generationId = "test-generation-id";
      const command = {
        name: "Test Card Set",
        description: "A description",
        accepted_cards: ["card-1", "card-2"],
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "generation_logs") {
          return {
            ...mockSupabase,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { user_id: userId, id: generationId },
              error: null,
            }),
          };
        }
        if (table === "generation_results") {
          return {
            ...mockSupabase,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [
                { id: "card-1", front_content: "Front 1", back_content: "Back 1", readability_score: 0.8 },
                { id: "card-2", front_content: "Front 2", back_content: "Back 2", readability_score: 0.7 },
              ],
              error: null,
            }),
          };
        }
        if (table === "card_sets") {
          return {
            ...mockSupabase,
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "new-set-id" },
              error: null,
            }),
          };
        }
        if (table === "cards") {
          return {
            ...mockSupabase,
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockResolvedValue({
              data: [{ id: "new-card-1" }, { id: "new-card-2" }],
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      // Act
      const result = await generationService.finalizeGeneration(userId, generationId, command);

      // Assert
      expect(result).toHaveProperty("set_id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("card_count");
      expect(result.name).toBe("Test Card Set");
    });
  });

  // describe("US-007: Generation statistics display", () => {
  //   it("should retrieve generation results with statistics", async () => {
  //     // Arrange
  //     const generationId = "test-generation-id";

  //     mockSupabase.from.mockImplementation((table) => {
  //       if (table === "generation_logs") {
  //         return {
  //           ...mockSupabase,
  //           select: vi.fn().mockReturnThis(),
  //           eq: vi.fn().mockReturnThis(),
  //           single: vi.fn().mockResolvedValue({
  //             data: {
  //               user_id: userId,
  //               id: generationId,
  //               source_text_length: 500,
  //               generated_count: 5,
  //               generation_duration: 3000,
  //             },
  //             error: null,
  //           }),
  //         };
  //       }
  //       if (table === "generation_results") {
  //         return {
  //           ...mockSupabase,
  //           select: vi.fn().mockReturnThis(),
  //           eq: vi.fn().mockResolvedValue({
  //             data: [
  //               { id: "card-1", front_content: "Front 1", back_content: "Back 1", readability_score: 0.8 },
  //               { id: "card-2", front_content: "Front 2", back_content: "Back 2", readability_score: 0.7 },
  //             ],
  //             error: null,
  //           }),
  //         };
  //       }
  //       return mockSupabase;
  //     });

  //     // Act
  //     const result = await generationService.getGenerationResults(userId, generationId);

  //     // Assert
  //     expect(result).toHaveProperty("cards");
  //     expect(result).toHaveProperty("stats");
  //     expect(result.cards).toHaveLength(2);
  //     expect(result.stats).toHaveProperty("text_length");
  //     expect(result.stats).toHaveProperty("generated_count");
  //     expect(result.stats).toHaveProperty("generation_time_ms");
  //   });
  // });

  describe("US-008: Readability scoring for cards", () => {
    it("should calculate readability scores for generated cards", () => {
      // Access private method using any type casting for testing
      const service = generationService as any;

      // Test with simple text
      const simpleText = "This is a simple sentence. It has basic words.";
      const simpleScore = service.calculateReadabilityScore(simpleText);

      // Test with complex text
      const complexText =
        "The mitochondria is the powerhouse of the cell. Its primary function is generating adenosine triphosphate through oxidative phosphorylation.";
      const complexScore = service.calculateReadabilityScore(complexText);

      // Assert scores are within correct range
      expect(simpleScore).toBeGreaterThanOrEqual(0.5);
      expect(simpleScore).toBeLessThanOrEqual(1.0);
      expect(complexScore).toBeGreaterThanOrEqual(0.5);
      expect(complexScore).toBeLessThanOrEqual(1.0);

      // Simpler text should have higher readability score than complex text
      expect(simpleScore).toBeGreaterThan(complexScore);
    });
  });
});
