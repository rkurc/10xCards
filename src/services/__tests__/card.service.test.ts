import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CardService } from "../card.service";
import type { TypedSupabaseClient } from "../../db/supabase.service";

describe("CardService", () => {
  let service: CardService;
  // Use explicit typing to avoid 'any' errors
  let mockSupabase: { from: ReturnType<typeof vi.fn> };

  const userId = "test-user-id";
  const cardId = "test-card-id";

  beforeEach(() => {
    // Create fresh mocks for each test
    mockSupabase = {
      from: vi.fn(),
    };

    service = new CardService(mockSupabase as unknown as TypedSupabaseClient);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getCard", () => {
    it("should get a card by ID with is_deleted=false filter", async () => {
      // Arrange - Set up the mock chain for getCard
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: cardId, front_content: "Test front", back_content: "Test back" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await service.getCard(userId, cardId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("cards");
      expect(result).toEqual(expect.objectContaining({ id: cardId }));
    });

    it("should throw an error if the card is not found", async () => {
      // Arrange - Set up the mock chain for getCard - error case
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: null,
                  error: new Error("Card not found"),
                }),
              }),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(service.getCard(userId, cardId)).rejects.toThrow("Card not found");
    });
  });

  describe("createCard", () => {
    it("should create a card with is_deleted=false", async () => {
      // Arrange
      const command = {
        front_content: "Test front",
        back_content: "Test back",
        source_type: "manual", // Use lowercase 'manual' as per enum definition
      };

      // Set up mock for insert operation
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValueOnce({
          select: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: { id: cardId, ...command },
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await service.createCard(userId, command);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("cards");
      expect(result).toEqual(expect.objectContaining({ id: cardId }));
    });
  });

  describe("updateCard", () => {
    it("should update a card and check is_deleted=false", async () => {
      // Arrange
      const command = {
        front_content: "Updated front",
        back_content: "Updated back",
      };

      // First call - check card exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: cardId, front_content: "Old front", back_content: "Old back" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Second call - update card
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              select: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: cardId, ...command },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Act
      const result = await service.updateCard(userId, cardId, command);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("cards");
      expect(result).toEqual(expect.objectContaining({ id: cardId }));
    });

    it("should throw an error if the card is not found", async () => {
      // Arrange - Set up the mock chain for card check - error case
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: null,
                  error: new Error("Card not found"),
                }),
              }),
            }),
          }),
        }),
      });

      const command = {
        front_content: "Updated front",
        back_content: "Updated back",
      };

      // Act & Assert
      await expect(service.updateCard(userId, cardId, command)).rejects.toThrow("Card not found");
    });
  });

  describe("deleteCard", () => {
    it("should soft-delete a card by setting is_deleted=true", async () => {
      // Arrange
      // First call - check card exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: cardId },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Second call - update card to be deleted
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              error: null,
            }),
          }),
        }),
      });

      // Act
      await service.deleteCard(userId, cardId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("cards");
    });

    it("should throw an error if the card is not found", async () => {
      // Arrange - Set up the mock chain for card check - error case
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: null,
                  error: new Error("Card not found"),
                }),
              }),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(service.deleteCard(userId, cardId)).rejects.toThrow("Card not found");
    });
  });
});
