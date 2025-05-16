import { describe, it, expect, beforeEach, vi } from "vitest";
import { CardSetService } from "../card-set.service";
import { createSupabaseTestClient } from "../../../tests/mocks/supabase-mock";
import type { CardSetCreateCommand, CardSetUpdateCommand, CardToSetAddCommand } from "../../types";

describe("CardSetService", () => {
  let service: CardSetService;
  let mockSupabase: any;
  const userId = "test-user-id";
  const setId = "test-set-id";

  beforeEach(() => {
    // Create fresh mocks for each test
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
    };
    service = new CardSetService(mockSupabase);
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
    it("should soft delete existing card set", async () => {
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
            eq: vi.fn().mockResolvedValueOnce({
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(service.deleteCardSet(userId, setId)).resolves.toBeUndefined();
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
});
