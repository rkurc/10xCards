import { describe, it, expect, beforeEach, vi } from "vitest";
import { GenerationService } from "../../src/services/generation.service";
import { createSupabaseTestClient } from "../mocks/supabase-mock";
import { ErrorCode } from "../../src/utils/db-error-handler";
import type { GenerationFinalizeCommand } from "../../src/types";

describe("GenerationService", () => {
  let service: GenerationService;
  let mockSupabase: ReturnType<typeof createSupabaseTestClient>;
  const testUserId = "test-user-id";

  beforeEach(() => {
    mockSupabase = createSupabaseTestClient();
    service = new GenerationService(mockSupabase);
    
    // Ensure insert function is properly mocked to record parameter values
    const insertSpy = vi.fn().mockImplementation((data) => {
      return {
        error: null
      };
    });
    
    (mockSupabase.from as any).mockImplementation((tableName: string) => {
      if (tableName === "generation_logs") {
        return {
          insert: insertSpy,
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: {
                  id: "test-gen-id",
                  source_text: "Test source text",
                  status: "pending"
                },
                error: null
              })
            })
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ error: null })
          })
        };
      }
      return (mockSupabase.from as any).getMockImplementation()(tableName);
    });
  });

  describe("startTextProcessing", () => {
    it("should create a generation record and return a generation ID", async () => {
      const result = await service.startTextProcessing(testUserId, {
        text: "Sample text for testing flashcard generation with sufficient length to be valid input.",
      });

      expect(result).toMatchObject({
        generation_id: expect.any(String),
        estimated_time_seconds: expect.any(Number),
      });

      // Verify that a record was inserted into generation_logs
      expect(mockSupabase.from).toHaveBeenCalledWith("generation_logs");
    });

    it("should include target count when provided", async () => {
      const targetCount = 15;
      const insertSpy = vi.fn().mockReturnValue({ error: null });
      
      // Override the from method for this specific test to capture the insert parameters
      (mockSupabase.from as any).mockImplementationOnce((tableName) => {
        if (tableName === "generation_logs") {
          return {
            insert: insertSpy,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockReturnValue({
                  data: { id: "test-id" },
                  error: null
                })
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ error: null })
            })
          };
        }
      });

      await service.startTextProcessing(testUserId, {
        text: "Sample text for testing flashcard generation with sufficient length to be valid input.",
        target_count: targetCount,
      });

      // Validate that insert was called with the right parameters
      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          target_count: targetCount,
        })
      );
    });
  });

  describe("getGenerationResults", () => {
    it("should return cards and stats for an existing generation", async () => {
      // Mock the specific behavior for this test
      (mockSupabase.from as any).mockImplementation((tableName: string) => {
        if (tableName === "generation_logs") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation((column: string, value: any) => {
                // This handles the recordExists and verifyOwnership calls
                if (column === "id" && value === "test-gen-1") {
                  return {
                    // For recordExists check
                    data: [{ id: "test-gen-1" }],
                    error: null,
                    // For the subsequent ownership check
                    eq: vi.fn().mockImplementation((column2: string, value2: any) => {
                      if (column2 === "user_id" && value2 === "test-user-id") {
                        return {
                          data: [{ id: "test-gen-1" }],
                          error: null
                        };
                      }
                      return { data: [], error: null };
                    }),
                    // For getting the generation details
                    single: vi.fn().mockReturnValue({
                      data: {
                        id: "test-gen-1",
                        user_id: "test-user-id",
                        source_text_length: 100,
                        generated_count: 2
                      },
                      error: null
                    })
                  };
                }
                return { 
                  data: [], 
                  error: null,
                  eq: vi.fn().mockReturnValue({ data: [], error: null })
                };
              })
            })
          };
        } else if (tableName === "generation_results") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                data: [
                  {
                    id: "test-card-1",
                    front_content: "Test front content",
                    back_content: "Test back content",
                    readability_score: 0.8
                  },
                  {
                    id: "test-card-2",
                    front_content: "Test front content 2",
                    back_content: "Test back content 2",
                    readability_score: 0.7
                  }
                ],
                error: null
              })
            })
          };
        }
        return (mockSupabase.from as any).getMockImplementation()(tableName);
      });

      const generationId = "test-gen-1";
      const result = await service.getGenerationResults(testUserId, generationId);

      expect(result).toMatchObject({
        cards: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            front_content: expect.any(String),
            back_content: expect.any(String),
          }),
        ]),
        stats: expect.objectContaining({
          text_length: expect.any(Number),
          generated_count: expect.any(Number),
        }),
      });
    });

    it("should throw an error for a non-existent generation", async () => {
      await expect(service.getGenerationResults(testUserId, "non-existent-id")).rejects.toMatchObject({
        code: ErrorCode.NOT_FOUND,
      });
    });
  });

  describe("finalizeGeneration", () => {
    it("should call the transaction function and return the result", async () => {
      const command: GenerationFinalizeCommand = {
        name: "Test Flashcard Set",
        description: "A set created from generated flashcards",
        accepted_cards: ["test-card-1", "test-card-2"],
      };

      const result = await service.finalizeGeneration(testUserId, "test-gen-1", command);

      // Verify the result
      expect(result).toMatchObject({
        set_id: expect.any(String),
        name: command.name,
        card_count: expect.any(Number),
      });

      // Verify that RPC was called with correct parameters
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "finalize_generation",
        expect.objectContaining({
          p_user_id: testUserId,
          p_generation_id: "test-gen-1",
          p_name: command.name,
          p_description: command.description,
          p_accepted_cards: command.accepted_cards,
        })
      );
    });

    it("should handle transaction errors properly", async () => {
      // Mock a transaction error
      mockSupabase.rpc.mockImplementationOnce(() => {
        return Promise.resolve({
          data: null,
          error: { code: "23503", message: "Foreign key violation" },
        });
      });

      const command: GenerationFinalizeCommand = {
        name: "Test Set",
        accepted_cards: ["invalid-card-id"],
      };

      await expect(service.finalizeGeneration(testUserId, "test-gen-1", command)).rejects.toMatchObject({
        code: ErrorCode.CONSTRAINT_VIOLATION,
        status: 400,
      });
    });
  });
});

import { vi } from "vitest";
import type { TypedSupabaseClient } from "../../src/db/supabase.service";
import { ErrorCode } from "../../src/utils/db-error-handler";

/**
 * Creates a mock Supabase client for testing
 * This allows testing services without connecting to actual database
 */
export function createSupabaseTestClient(): TypedSupabaseClient {
  // Sample test data
  const testData: Record<string, any[]> = {
    generation_logs: [
      {
        id: "test-gen-1",
        user_id: "test-user-id",
        source_text: "Sample text for testing",
        status: "completed",
        target_count: 10,
      },
    ],
    generation_results: [
      {
        id: "test-card-1",
        generation_id: "test-gen-1",
        front_content: "Test question",
        back_content: "Test answer",
        readability_score: 0.8,
      },
      {
        id: "test-card-2",
        generation_id: "test-gen-1",
        front_content: "Test question 2",
        back_content: "Test answer 2",
        readability_score: 0.7,
      },
    ],
    card_sets: [
      {
        id: "test-set-1",
        user_id: "test-user-id",
        name: "Test Set",
      },
    ],
    cards: [],
  };

  // Keep track of method calls for verification in tests
  const methodCalls = {
    from: {},
    select: {},
    insert: {},
    update: {},
    delete: {},
    rpc: {},
  };

  // Create a table operation factory function to generate mock CRUD methods
  const createTableMethods = (tableName: string) => {
    // Use table-specific data if available, or empty array
    const tableData = testData[tableName] || [];

    // Create spy for insert operation that will be accessible for verification in tests
    const insertSpy = vi.fn().mockImplementation((data: any | any[]) => {
      // Track the method call
      methodCalls.insert[tableName] = { data };
      
      const dataArray = Array.isArray(data) ? data : [data];
      const insertedIds = dataArray.map((item, index) => ({
        ...item,
        id: item.id || `mocked-id-${index}`,
      }));

      return {
        select: vi.fn().mockImplementation(() => {
          return {
            single: () => ({ data: insertedIds[0], error: null }),
            data: insertedIds,
            error: null,
          };
        }),
        data: insertedIds,
        error: null,
      };
    });

    const selectMethods = {
      eq: vi.fn().mockImplementation((column: string, value: any) => {
        // Filter data based on equality
        const filtered = tableData.filter((row) => row[column] === value);

        return {
          ...selectMethods,
          data: filtered.length > 0 ? filtered : null,
          maybeSingle: () => {
            return {
              data: filtered.length > 0 ? filtered[0] : null,
              error: null,
            };
          },
          single: () => {
            if (filtered.length === 0) {
              return { data: null, error: { message: "No rows found", code: "PGRST116" } };
            }
            return { data: filtered[0], error: null };
          },
          eq: vi.fn().mockImplementation((column2: string, value2: any) => {
            // Handle multiple conditions
            const doubleFiltered = filtered.filter(row => row[column2] === value2);
            return {
              ...selectMethods,
              data: doubleFiltered.length > 0 ? doubleFiltered : null,
              maybeSingle: () => {
                return {
                  data: doubleFiltered.length > 0 ? doubleFiltered[0] : null,
                  error: null,
                };
              },
              single: () => {
                if (doubleFiltered.length === 0) {
                  return { data: null, error: { message: "No rows found", code: "PGRST116" } };
                }
                return { data: doubleFiltered[0], error: null };
              },
            };
          }),
        };
      }),

      // Handle IN condition
      in: vi.fn().mockImplementation((column: string, values: any[]) => {
        const filtered = tableData.filter((row) => values.includes(row[column]));
        return {
          ...selectMethods,
          data: filtered.length > 0 ? filtered : null,
          error: null,
        };
      }),

      // Handle matching multiple conditions
      match: vi.fn().mockImplementation((conditions: Record<string, any>) => {
        const filtered = tableData.filter((row) => {
          return Object.entries(conditions).every(([key, value]) => row[key] === value);
        });

        return {
          ...selectMethods,
          data: filtered.length > 0 ? filtered : null,
          single: () => {
            if (filtered.length === 0) {
              return { data: null, error: { message: "No rows found", code: "PGRST116" } };
            }
            return { data: filtered[0], error: null };
          },
        };
      }),
    };

    const tableMethods = {
      select: vi.fn().mockImplementation((columns: string = "*") => {
        // Track the method call
        methodCalls.select[tableName] = { columns };
        return selectMethods;
      }),

      // Use spy for insert operation
      insert: insertSpy,

      // Mock update operation
      update: vi.fn().mockImplementation((data: any) => {
        // Track the method call
        methodCalls.update[tableName] = { data };
        
        return {
          eq: vi.fn().mockImplementation((column: string, value: any) => {
            return { data: { ...data, [column]: value }, error: null };
          }),
          match: vi.fn().mockImplementation((conditions: Record<string, any>) => {
            return { data: { ...data, ...conditions }, error: null };
          }),
          data: data,
          error: null,
        };
      }),

      // Mock delete operation
      delete: vi.fn().mockImplementation(() => {
        // Track the method call
        methodCalls.delete[tableName] = { called: true };
        
        return {
          eq: vi.fn().mockImplementation((column: string, value: any) => {
            return { data: { deleted: true }, error: null };
          }),
          match: vi.fn().mockImplementation((conditions: Record<string, any>) => {
            return { data: { deleted: true }, error: null };
          }),
          in: vi.fn().mockImplementation((column: string, values: any[]) => {
            return { data: { deleted: true }, error: null };
          }),
          data: { deleted: true },
          error: null,
        };
      }),
    };

    return tableMethods;
  };

  // Create fromSpy for tracking from() calls
  const fromSpy = vi.fn().mockImplementation((tableName: string) => {
    // Track the method call
    methodCalls.from[tableName] = { called: true };
    return createTableMethods(tableName);
  });

  // Create rpcSpy for tracking rpc() calls
  const rpcSpy = vi.fn().mockImplementation((procedureName: string, params: any) => {
    // Track the method call
    methodCalls.rpc[procedureName] = { params };
    
    // Mock successful finalize_generation procedure
    if (procedureName === "finalize_generation") {
      return Promise.resolve({
        data: {
          set_id: "123e4567-e89b-12d3-a456-426614174000",
          name: params.p_name,
          card_count: params.p_accepted_cards?.length || 5,
        },
        error: null,
      });
    }

    return Promise.resolve({ 
      data: null, 
      error: { 
        message: "Unsupported procedure", 
        code: "42P01" 
      }
    });
  });

  // Create base mock object with all methods
  const mockClient = {
    from: fromSpy,
    rpc: rpcSpy,

    // Mock auth operations
    auth: {
      getUser: vi.fn().mockImplementation((token?: string) => {
        if (token === "valid-token" || !token) {
          return Promise.resolve({
            data: {
              user: {
                id: "test-user-id",
                email: "test@example.com",
                role: "authenticated",
              },
            },
            error: null,
          });
        }

        return Promise.resolve({
          data: { user: null },
          error: { message: "Invalid token", code: "invalid_token" },
        });
      }),

      getSession: vi.fn().mockImplementation(() => {
        return Promise.resolve({
          data: {
            session: {
              user: {
                id: "test-user-id",
                email: "test@example.com",
                role: "authenticated",
              },
            },
          },
          error: null,
        });
      }),
    },
  };

  return mockClient as unknown as TypedSupabaseClient;
}
