import { describe, it, expect, beforeEach, vi } from "vitest";
import { CardSetService } from "../card-set.service";
import type { TypedSupabaseClient } from "../../db/supabase.service";

describe("CardSetService - removeCardFromSet", () => {
  let service: CardSetService;
  let mockSupabase: any;
  
  const userId = "test-user-id";
  const setId = "test-set-id";
  const cardId = "test-card-id";

  beforeEach(() => {
    // Create fresh mocks for each test
    mockSupabase = {
      from: vi.fn(),
    };
    
    service = new CardSetService(mockSupabase as TypedSupabaseClient);
  });

  it("should remove a card from a set", async () => {
    // Standard happy path setup
    
    // 1. First call - check card set exists
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: { id: setId, name: "Test Set" },
                error: null
              })
            })
          })
        })
      })
    });
    
    // 2. Second call - check card exists
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: { id: cardId, front_content: "Test Card" },
                error: null
              })
            })
          })
        })
      })
    });

    // 3. Third call - check relation exists
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: { set_id: setId, card_id: cardId },
              error: null
            })
          })
        })
      })
    });

    // 4. Fourth call - delete relationship
    mockSupabase.from.mockReturnValueOnce({
      delete: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            error: null
          })
        })
      })
    });

    // Act
    await service.removeCardFromSet(userId, setId, cardId);

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("card_sets");
    expect(mockSupabase.from).toHaveBeenCalledWith("cards");
    expect(mockSupabase.from).toHaveBeenCalledWith("cards_to_sets");
  });

  it("should throw an error if the card set is not found", async () => {
    // Mock card set not found response
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: null,
                error: new Error("Card set not found")
              })
            })
          })
        })
      })
    });

    // Act & Assert
    await expect(service.removeCardFromSet(userId, setId, cardId))
      .rejects.toThrow("Card set not found");
  });

  it("should throw an error if the card is not found", async () => {
    // 1. First call - check card set exists (success)
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: { id: setId, name: "Test Set" },
                error: null
              })
            })
          })
        })
      })
    });
    
    // 2. Second call - check card exists (failure)
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: null,
                error: new Error("Card not found")
              })
            })
          })
        })
      })
    });

    // Act & Assert
    await expect(service.removeCardFromSet(userId, setId, cardId))
      .rejects.toThrow("Card not found");
  });

  it("should throw an error if the card is not in the set", async () => {
    // 1. First call - check card set exists (success)
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: { id: setId, name: "Test Set" },
                error: null
              })
            })
          })
        })
      })
    });
    
    // 2. Second call - check card exists (success)
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: { id: cardId, front_content: "Test Card" },
                error: null
              })
            })
          })
        })
      })
    });
    
    // 3. Third call - check relation exists (failure)
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValueOnce({
        eq: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: null,
              error: new Error("Card is not in this set")
            })
          })
        })
      })
    });

    // Act & Assert
    await expect(service.removeCardFromSet(userId, setId, cardId))
      .rejects.toThrow("Card is not in this set");
  });
});
