import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "../card-sets/[id]/cards/[cardId]/index";
import { CardSetService } from "../../../services/card-set.service";
import { CardService } from "../../../services/card.service";

// Mock the CardSetService
vi.mock("../../../services/card-set.service", () => {
  return {
    CardSetService: vi.fn().mockImplementation(() => ({
      removeCardFromSet: vi.fn(),
    })),
  };
});

// Mock the CardService
vi.mock("../../../services/card.service", () => {
  return {
    CardService: vi.fn().mockImplementation(() => ({
      deleteCard: vi.fn(),
    })),
  };
});

describe("Remove Card from Set API Endpoint", () => {
  let mockCardSetService: any;
  let mockCardService: any;
  let mockSupabase: any;
  let mockContext: any;

  beforeEach(() => {
    mockCardSetService = {
      removeCardFromSet: vi.fn(),
      checkCardInAnyUserSet: vi.fn().mockResolvedValue(false),
    };

    mockCardService = {
      deleteCard: vi.fn(),
    };

    // Reset CardSetService constructor mock
    (CardSetService as any).mockImplementation(() => mockCardSetService);
    (CardService as any).mockImplementation(() => mockCardService);

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
        }),
      },
    };

    mockContext = {
      params: { id: "test-set-id", cardId: "test-card-id" },
      locals: { supabase: mockSupabase },
    };
  });

  describe("DELETE /api/card-sets/[id]/cards/[cardId]", () => {
    it("should remove a card from a set and delete it if not in any other set", async () => {
      // Arrange
      mockCardSetService.removeCardFromSet.mockResolvedValue(undefined);
      mockCardSetService.checkCardInAnyUserSet.mockResolvedValue(false);
      mockCardService.deleteCard.mockResolvedValue(undefined);

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(204);
      expect(mockCardSetService.removeCardFromSet).toHaveBeenCalledWith("test-user-id", "test-set-id", "test-card-id");
      expect(mockCardSetService.checkCardInAnyUserSet).toHaveBeenCalledWith("test-card-id");
      expect(mockCardService.deleteCard).toHaveBeenCalledWith("test-user-id", "test-card-id");
    });

    it("should remove a card from a set but not delete it if it's in other sets", async () => {
      // Arrange
      mockCardSetService.removeCardFromSet.mockResolvedValue(undefined);
      mockCardSetService.checkCardInAnyUserSet.mockResolvedValue(true);

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(204);
      expect(mockCardSetService.removeCardFromSet).toHaveBeenCalledWith("test-user-id", "test-set-id", "test-card-id");
      expect(mockCardSetService.checkCardInAnyUserSet).toHaveBeenCalledWith("test-card-id");
      expect(mockCardService.deleteCard).not.toHaveBeenCalled();
    });

    it("should return 404 if card set not found", async () => {
      // Arrange
      mockCardSetService.removeCardFromSet.mockRejectedValue(new Error("Card set not found"));

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Card set not found");
    });

    it("should return 404 if card not found", async () => {
      // Arrange
      mockCardSetService.removeCardFromSet.mockRejectedValue(new Error("Card not found"));

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Card not found");
    });

    it("should return 404 if card is not in set", async () => {
      // Arrange
      mockCardSetService.removeCardFromSet.mockRejectedValue(new Error("Card is not in this set"));

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Card is not in this set");
    });

    it("should return 401 if user is not authenticated", async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 if set ID is not a valid UUID", async () => {
      // Arrange
      mockContext.params.id = "invalid-uuid";

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid card set ID");
    });

    it("should return 400 if card ID is not a valid UUID", async () => {
      // Arrange
      mockContext.params.cardId = "invalid-uuid";

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid card ID");
    });

    it("should return 500 on internal server error", async () => {
      // Arrange
      mockCardSetService.removeCardFromSet.mockRejectedValue(new Error("Database connection error"));

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("An error occurred while processing your request");
    });
  });
});
