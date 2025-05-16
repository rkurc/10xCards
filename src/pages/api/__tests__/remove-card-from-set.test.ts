import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "../card-sets/[id]/cards/[cardId]/index";
import { CardSetService } from "../../../services/card-set.service";

// Mock the CardSetService
vi.mock("../../../services/card-set.service", () => {
  return {
    CardSetService: vi.fn().mockImplementation(() => ({
      removeCardFromSet: vi.fn(),
    })),
  };
});

describe("Remove Card from Set API Endpoint", () => {
  let mockCardSetService: any;
  let mockSupabase: any;
  let mockContext: any;

  beforeEach(() => {
    mockCardSetService = {
      removeCardFromSet: vi.fn(),
    };

    // Reset CardSetService constructor mock
    (CardSetService as any).mockImplementation(() => mockCardSetService);

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
    it("should remove a card from a set", async () => {
      // Arrange
      mockCardSetService.removeCardFromSet.mockResolvedValue(undefined);

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(204);
      expect(mockCardSetService.removeCardFromSet).toHaveBeenCalledWith("test-user-id", "test-set-id", "test-card-id");
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
  });
});
