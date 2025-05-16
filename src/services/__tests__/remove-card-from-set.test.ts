import { describe, it, expect, beforeEach, vi } from "vitest";
import { CardSetService } from "../card-set.service";

describe("CardSetService - removeCardFromSet", () => {
  let service: CardSetService;
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  const userId = "test-user-id";
  const setId = "test-set-id";
  const cardId = "test-card-id";

  beforeEach(() => {
    service = new CardSetService(mockSupabase as any);
    vi.clearAllMocks();
  });

  it("should remove a card from a set", async () => {
    // Arrange
    // Mock card set check
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: setId, name: "Test Set" },
      error: null,
    });

    // Mock card check
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: cardId, front_content: "Test Card" },
      error: null,
    });

    // Mock relationship check
    mockSupabase.single.mockResolvedValueOnce({
      data: { set_id: setId, card_id: cardId },
      error: null,
    });

    // Mock delete operation
    mockSupabase.eq.mockResolvedValueOnce({ error: null });

    // Act
    await service.removeCardFromSet(userId, setId, cardId);

    // Assert
    // Check if it verifies the card set exists and is not deleted
    expect(mockSupabase.from).toHaveBeenCalledWith("card_sets");
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith("id", setId);
    expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
    expect(mockSupabase.eq).toHaveBeenCalledWith("is_deleted", false);

    // Check if it verifies the card exists and is not deleted
    expect(mockSupabase.from).toHaveBeenCalledWith("cards");
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith("id", cardId);
    expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
    expect(mockSupabase.eq).toHaveBeenCalledWith("is_deleted", false);

    // Check if it verifies the relationship exists
    expect(mockSupabase.from).toHaveBeenCalledWith("cards_to_sets");
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith("set_id", setId);
    expect(mockSupabase.eq).toHaveBeenCalledWith("card_id", cardId);

    // Check if it deletes the relationship
    expect(mockSupabase.from).toHaveBeenCalledWith("cards_to_sets");
    expect(mockSupabase.delete).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith("set_id", setId);
    expect(mockSupabase.eq).toHaveBeenCalledWith("card_id", cardId);
  });

  it("should throw an error if the card set is not found", async () => {
    // Arrange
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: new Error("Card set not found"),
    });

    // Act & Assert
    await expect(service.removeCardFromSet(userId, setId, cardId)).rejects.toThrow("Card set not found");
  });

  it("should throw an error if the card is not found", async () => {
    // Arrange
    // Mock card set check success
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: setId, name: "Test Set" },
      error: null,
    });

    // Mock card check failure
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: new Error("Card not found"),
    });

    // Act & Assert
    await expect(service.removeCardFromSet(userId, setId, cardId)).rejects.toThrow("Card not found");
  });

  it("should throw an error if the card is not in the set", async () => {
    // Arrange
    // Mock card set check success
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: setId, name: "Test Set" },
      error: null,
    });

    // Mock card check success
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: cardId, front_content: "Test Card" },
      error: null,
    });

    // Mock relationship check failure
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: new Error("Relationship not found"),
    });

    // Act & Assert
    await expect(service.removeCardFromSet(userId, setId, cardId)).rejects.toThrow("Card is not in this set");
  });
});
