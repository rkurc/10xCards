import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CardService } from "../card.service";

describe("CardService", () => {
  let service: CardService;
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  const userId = "test-user-id";
  const cardId = "test-card-id";

  beforeEach(() => {
    service = new CardService(mockSupabase as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getCard", () => {
    it("should get a card by ID with is_deleted=false filter", async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: { id: cardId, front_content: "Test front", back_content: "Test back" },
        error: null,
      });

      // Act
      await service.getCard(userId, cardId);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("cards");
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", cardId);
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSupabase.eq).toHaveBeenCalledWith("is_deleted", false);
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it("should throw an error if the card is not found", async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error("Card not found"),
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
        source_type: "MANUAL" as const,
      };

      mockSupabase.select.mockReturnThis();
      mockSupabase.single.mockResolvedValue({
        data: { id: cardId, ...command },
        error: null,
      });

      // Act
      const result = await service.createCard(userId, command);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("cards");
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId,
          front_content: command.front_content,
          back_content: command.back_content,
          source_type: command.source_type,
          is_deleted: false,
        })
      );
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

      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: cardId, front_content: "Old front", back_content: "Old back" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: cardId, ...command },
          error: null,
        });

      // Act
      const result = await service.updateCard(userId, cardId, command);

      // Assert
      // First, check that we verify the card exists and is not deleted
      expect(mockSupabase.from).toHaveBeenCalledWith("cards");
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", cardId);
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSupabase.eq).toHaveBeenCalledWith("is_deleted", false);

      // Then, check that we update the card
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          front_content: command.front_content,
          back_content: command.back_content,
        })
      );

      expect(result).toEqual(expect.objectContaining({ id: cardId }));
    });

    it("should throw an error if the card is not found", async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error("Card not found"),
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
      mockSupabase.single.mockResolvedValue({
        data: { id: cardId },
        error: null,
      });

      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockReturnThis();

      // Act
      await service.deleteCard(userId, cardId);

      // Assert
      // First, check that we verify the card exists and is not deleted
      expect(mockSupabase.from).toHaveBeenCalledWith("cards");
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", cardId);
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockSupabase.eq).toHaveBeenCalledWith("is_deleted", false);

      // Then, check that we soft-delete the card by setting is_deleted=true
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_deleted: true,
          deleted_at: expect.any(String),
        })
      );
    });

    it("should throw an error if the card is not found", async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error("Card not found"),
      });

      // Act & Assert
      await expect(service.deleteCard(userId, cardId)).rejects.toThrow("Card not found");
    });
  });
});
