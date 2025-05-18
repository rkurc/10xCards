import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE, GET, PUT } from "../cards/[id]/index";
import { POST } from "../cards/index";
import { CardService } from "../../../services/card.service";

// Mock the CardService
vi.mock("../../../services/card.service", () => {
  return {
    CardService: vi.fn().mockImplementation(() => ({
      getCard: vi.fn(),
      createCard: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
    })),
  };
});

describe("Card API Endpoints", () => {
  let mockCardService: any;
  let mockSupabase: any;
  let mockContext: any;

  beforeEach(() => {
    mockCardService = {
      getCard: vi.fn(),
      createCard: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
    };

    // Reset CardService constructor mock
    (CardService as any).mockImplementation(() => mockCardService);

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "test-user-id" } },
        }),
      },
    };

    mockContext = {
      params: { id: "test-card-id" },
      locals: { supabase: mockSupabase },
    };
  });

  describe("GET /api/cards/[id]", () => {
    it("should return a card", async () => {
      // Arrange
      const mockCard = {
        id: "test-card-id",
        front_content: "Test Front",
        back_content: "Test Back",
      };
      mockCardService.getCard.mockResolvedValue(mockCard);

      // Act
      const response = await GET(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockCard);
      expect(mockCardService.getCard).toHaveBeenCalledWith("test-user-id", "test-card-id");
    });

    it("should return 404 if card not found", async () => {
      // Arrange
      mockCardService.getCard.mockRejectedValue(new Error("Card not found"));

      // Act
      const response = await GET(mockContext);

      // Assert
      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/cards/[id]", () => {
    it("should update a card", async () => {
      // Arrange
      const mockCard = {
        id: "test-card-id",
        front_content: "Updated Front",
        back_content: "Updated Back",
      };
      mockCardService.updateCard.mockResolvedValue(mockCard);
      mockContext.request = {
        json: vi.fn().mockResolvedValue({
          front_content: "Updated Front",
          back_content: "Updated Back",
        }),
      };

      // Act
      const response = await PUT(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockCard);
      expect(mockCardService.updateCard).toHaveBeenCalledWith(
        "test-user-id",
        "test-card-id",
        expect.objectContaining({
          front_content: "Updated Front",
          back_content: "Updated Back",
        })
      );
    });
  });

  describe("DELETE /api/cards/[id]", () => {
    it("should soft-delete a card", async () => {
      // Arrange
      mockCardService.deleteCard.mockResolvedValue(undefined);

      // Act
      const response = await DELETE(mockContext);

      // Assert
      expect(response.status).toBe(204);
      expect(mockCardService.deleteCard).toHaveBeenCalledWith("test-user-id", "test-card-id");
    });
  });

  describe("POST /api/cards", () => {
    it("should create a new card", async () => {
      // Arrange
      const mockCard = {
        id: "new-card-id",
        front_content: "New Front",
        back_content: "New Back",
        source_type: "MANUAL",
      };
      mockCardService.createCard.mockResolvedValue(mockCard);
      mockContext.request = {
        json: vi.fn().mockResolvedValue({
          front_content: "New Front",
          back_content: "New Back",
          source_type: "MANUAL",
        }),
      };

      // Act
      const response = await POST(mockContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual(mockCard);
      expect(mockCardService.createCard).toHaveBeenCalledWith(
        "test-user-id",
        expect.objectContaining({
          front_content: "New Front",
          back_content: "New Back",
          source_type: "MANUAL",
        })
      );
    });
  });
});
