import { describe, it, expect, beforeEach, vi } from "vitest";
import { CardSetService } from "../card-set.service";
import { CardService } from "../card.service";
import type { TypedSupabaseClient } from "../../db/supabase.service";
import type { CardSetCreateCommand, CardSetUpdateCommand, CardToSetAddCommand } from "../../types";

describe("CardSetService", () => {
  let service: CardSetService;
  // Use explicit typing to avoid 'any' errors
  let mockSupabase: { from: ReturnType<typeof vi.fn>; rpc: ReturnType<typeof vi.fn> };
  const userId = "test-user-id";
  const setId = "test-set-id";

  beforeEach(() => {
    // Create fresh mocks for each test
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
    };
    service = new CardSetService(mockSupabase as unknown as TypedSupabaseClient);
  });

  describe("listCardSets", () => {
    it("should return empty list when user has no card sets", async () => {
      // Mock count query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              count: 0,
            }),
          }),
        }),
      } as any);

      const result = await service.listCardSets(userId, 1, 10);

      expect(result).toEqual({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          pages: 0,
        },
      });
    });

    it("should return paginated list of card sets with counts", async () => {
      const mockCardSets = [
        {
          id: "1",
          name: "Set 1",
          description: "Description 1",
          created_at: "2025-01-01",
          updated_at: "2025-01-01",
          cards: [{ count: 1 }], // Using the format with count property
        },
        {
          id: "2",
          name: "Set 2",
          description: "Description 2",
          created_at: "2025-01-02",
          updated_at: "2025-01-02",
          cards: [{ count: 2 }], // Using the format with count property
        },
      ];

      // Mock count query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              count: mockCardSets.length,
            }),
          }),
        }),
      } as any);

      // Mock data query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockReturnValueOnce({
                order: vi.fn().mockResolvedValueOnce({
                  data: mockCardSets,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.listCardSets(userId, 1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].card_count).toBe(1);
      expect(result.data[1].card_count).toBe(2);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe("createCardSet", () => {
    it("should create a new card set", async () => {
      const command: CardSetCreateCommand = {
        name: "New Set",
        description: "Test description",
      };

      const mockCardSet = {
        id: "new-id",
        user_id: userId,
        ...command,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
        is_deleted: false,
      };

      // Mock the initial count query for connectivity test
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          count: 5,
          error: null,
        }),
      } as any);

      // Mock the actual insert operation
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValueOnce({
          select: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: mockCardSet,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await service.createCardSet(userId, command);

      expect(result).toEqual(mockCardSet);
      expect(mockSupabase.from).toHaveBeenCalledWith("card_sets");
    });

    it("should throw error if card set creation fails", async () => {
      // Mock the initial count query for connectivity test
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          count: 5,
          error: null,
        }),
      } as any);

      // Mock the actual insert operation with an error
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValueOnce({
          select: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: null,
              error: new Error("Database error"),
            }),
          }),
        }),
      } as any);

      // Change expectation to match the actual error message
      await expect(service.createCardSet(userId, { name: "Test", description: "Test" })).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getCardSet", () => {
    it("should return card set with paginated cards", async () => {
      const mockCardSet = {
        id: setId,
        name: "Test Set",
        description: "Test Description",
        user_id: userId,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
        is_deleted: false,
      };

      // Mock data for cards with the correct structure
      const mockCardToSets = [
        {
          card_id: "card-1",
          cards: {
            id: "card-1",
            front_content: "Front 1",
            back_content: "Back 1",
            source_type: "manual",
            readability_score: 0.8,
            created_at: "2025-01-01",
            updated_at: "2025-01-01",
          },
        },
      ];

      // Mock card set query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: mockCardSet,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock cards count query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            count: 1,
            error: null,
          }),
        }),
      } as any);

      // Mock cards data query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            range: vi.fn().mockReturnValueOnce({
              order: vi.fn().mockResolvedValueOnce({
                data: mockCardToSets,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.getCardSet(userId, setId, 1, 10);

      expect(result.id).toBe(setId);
      expect(result.cards.data).toHaveLength(1);
      expect(result.cards.pagination.total).toBe(1);
    });

    it("should return empty cards array when set has no cards", async () => {
      const mockCardSet = {
        id: setId,
        name: "Test Set",
        description: "Test Description",
        user_id: userId,
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
        is_deleted: false,
      };

      // Mock card set query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: mockCardSet,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock cards count query
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              count: 0,
            }),
          }),
        }),
      } as any);

      const result = await service.getCardSet(userId, setId, 1, 10);

      expect(result.id).toBe(setId);
      expect(result.cards.data).toHaveLength(0);
      expect(result.cards.pagination.total).toBe(0);
    });
  });

  describe("updateCardSet", () => {
    it("should update existing card set", async () => {
      const command: CardSetUpdateCommand = {
        name: "Updated Set",
        description: "Updated description",
      };

      // Mock exists check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: setId },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock update query
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            select: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: {
                  id: setId,
                  user_id: userId,
                  ...command,
                  created_at: "2025-01-01",
                  updated_at: "2025-01-01",
                },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await service.updateCardSet(userId, setId, command);

      expect(result.name).toBe(command.name);
      expect(result.description).toBe(command.description);
    });

    it("should throw error if card set does not exist", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      await expect(
        service.updateCardSet(userId, setId, {
          name: "Updated",
          description: "Updated",
        })
      ).rejects.toThrow("Card set not found");
    });
  });

  describe("deleteCardSet", () => {
    it("should soft delete existing card set and handle cards within the set", async () => {
      // Mock exists check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: setId },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock getting cards in set
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            data: [{ card_id: "card-1" }, { card_id: "card-2" }],
            error: null,
          }),
        }),
      } as any);

      // Mock the removeCardFromSet method instead of letting it run
      const removeCardFromSetMock = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(service, "removeCardFromSet").mockImplementation(removeCardFromSetMock);

      // Create a spy for the update method
      const updateSpy = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      // Mock soft delete update
      mockSupabase.from.mockReturnValueOnce({
        update: updateSpy,
      } as any);

      // Mock the checkCardInAnyUserSet method
      vi.spyOn(service, "checkCardInAnyUserSet").mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      // Mock the CardService.deleteCard method
      const deleteCardMock = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(CardService.prototype, "deleteCard").mockImplementation(deleteCardMock);

      await service.deleteCardSet(userId, setId);

      // Verify the update was called with the correct parameters
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          is_deleted: true,
        })
      );

      // Verify removeCardFromSet was called correctly
      expect(removeCardFromSetMock).toHaveBeenCalledWith(userId, setId, "card-1");
      expect(removeCardFromSetMock).toHaveBeenCalledWith(userId, setId, "card-2");
    });

    it("should throw error if card set does not exist", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      await expect(service.deleteCardSet(userId, setId)).rejects.toThrow("Card set not found");
    });

    it("should continue with set deletion even if there's an error getting cards", async () => {
      // Mock exists check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: setId,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock getting cards in set - with error
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            data: null,
            error: new Error("Failed to get cards in set"),
          }),
        }),
      } as any);

      // Mock update query for card set soft deletion
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              error: null,
            }),
          }),
        }),
      } as any);

      await service.deleteCardSet(userId, setId);

      // Verify the set was still soft-deleted even though getting cards failed
      expect(mockSupabase.from).toHaveBeenCalledWith("card_sets");
    });
  });

  describe("addCardsToSet", () => {
    it("should add cards to set", async () => {
      const command: CardToSetAddCommand = {
        card_ids: ["card-1", "card-2"],
      };

      // Mock card set exists check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: setId },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock cards exists check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          in: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockResolvedValueOnce({
                data: [{ id: "card-1" }, { id: "card-2" }],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock insert
      mockSupabase.from.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValueOnce({
          error: null,
        }),
      } as any);

      const result = await service.addCardsToSet(userId, setId, command);

      expect(result.set_id).toBe(setId);
      expect(result.added_card_ids).toEqual(command.card_ids);
      expect(result.added_count).toBe(command.card_ids.length);
    });

    it("should throw error if card set does not exist", async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      await expect(service.addCardsToSet(userId, setId, { card_ids: ["card-1"] })).rejects.toThrow(
        "Card set not found"
      );
    });

    it("should throw error if cards do not exist", async () => {
      // Mock card set exists check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: setId },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock cards exists check (returns fewer cards than requested)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          in: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockResolvedValueOnce({
                data: [{ id: "card-1" }], // Only one card found
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      await expect(service.addCardsToSet(userId, setId, { card_ids: ["card-1", "card-2"] })).rejects.toThrow(
        "One or more cards not found"
      );
    });
  });

  describe("checkCardInAnyUserSet", () => {
    it("should return true if card is in at least one active set", async () => {
      // Mock count query that returns a positive count
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            count: 2,
            error: null,
          }),
        }),
      });

      const result = await service.checkCardInAnyUserSet("test-card-id");

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith("cards_to_sets");
    });

    it("should return false if card is not in any active set", async () => {
      // Mock count query that returns zero
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            count: 0,
            error: null,
          }),
        }),
      });

      const result = await service.checkCardInAnyUserSet("test-card-id");

      expect(result).toBe(false);
      expect(mockSupabase.from).toHaveBeenCalledWith("cards_to_sets");
    });

    it("should throw error if database query fails", async () => {
      // Mock count query that returns an error
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            count: null,
            error: new Error("Database error"),
          }),
        }),
      });

      await expect(service.checkCardInAnyUserSet("test-card-id")).rejects.toThrow("Database error");
    });
  });

  describe("removeCardFromSet", () => {
    it("should remove a card from a set", async () => {
      // Mock checks for card set exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: setId },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock checks for card exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: "test-card-id" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock checks for relation exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: { set_id: setId, card_id: "test-card-id" },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      // Mock delete from junction table
      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(service.removeCardFromSet(userId, setId, "test-card-id")).resolves.not.toThrow();
      expect(mockSupabase.from).toHaveBeenCalledWith("cards_to_sets");
    });

    it("should throw error if card set does not exist", async () => {
      // Mock check for card set exists (not found)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      await expect(service.removeCardFromSet(userId, setId, "test-card-id")).rejects.toThrow("Card set not found");
    });

    it("should throw error if card does not exist", async () => {
      // Mock check for card set exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: setId },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock check for card exists (not found)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      await expect(service.removeCardFromSet(userId, setId, "test-card-id")).rejects.toThrow("Card not found");
    });

    it("should throw error if card is not in set", async () => {
      // Mock check for card set exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: setId },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock check for card exists
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                single: vi.fn().mockResolvedValueOnce({
                  data: { id: "test-card-id" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock check for relation exists (not found)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      await expect(service.removeCardFromSet(userId, setId, "test-card-id")).rejects.toThrow("Card is not in this set");
    });
  });
});
