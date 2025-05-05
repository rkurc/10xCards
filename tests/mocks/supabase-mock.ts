import { vi } from "vitest";
import type { TypedSupabaseClient } from "../../src/db/supabase.service";

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
        select: vi.fn().mockImplementation((columns = "*") => {
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
        const methods = {
          data: filtered.length > 0 ? filtered : null,
          count: filtered.length,
          maybeSingle: () => ({
            data: filtered.length > 0 ? filtered[0] : null,
            error: null
          }),
          single: () => {
            if (filtered.length === 0) {
              return { data: null, error: { message: "No rows found", code: "PGRST116" } };
            }
            return { data: filtered[0], error: null };
          },
          eq: vi.fn().mockImplementation((column2: string, value2: any) => {
            const doubleFiltered = filtered.filter(row => row[column2] === value2);
            return {
              data: doubleFiltered.length > 0 ? doubleFiltered : null,
              count: doubleFiltered.length,
              maybeSingle: () => ({
                data: doubleFiltered.length > 0 ? doubleFiltered[0] : null,
                error: null
              }),
              single: () => {
                if (doubleFiltered.length === 0) {
                  return { data: null, error: { message: "No rows found", code: "PGRST116" } };
                }
                return { data: doubleFiltered[0], error: null };
              }
            };
          }),
          // Add limit method
          limit: vi.fn().mockImplementation((limitCount: number) => {
            const limitedData = filtered.slice(0, limitCount);
            return {
              data: limitedData.length > 0 ? limitedData : [],
              error: null,
              single: () => {
                if (limitedData.length === 0) {
                  return { data: null, error: { message: "No rows found", code: "PGRST116" } };
                }
                return { data: limitedData[0], error: null };
              }
            };
          })
        };
        return methods;
      }),
      in: vi.fn().mockImplementation((column: string, values: any[]) => {
        const filtered = tableData.filter((row) => values.includes(row[column]));
        return {
          ...selectMethods,
          data: filtered.length > 0 ? filtered : null,
          count: filtered.length,
          error: null
        };
      }),
      match: vi.fn().mockImplementation((conditions: Record<string, any>) => {
        const filtered = tableData.filter((row) => {
          return Object.entries(conditions).every(([key, value]) => row[key] === value);
        });
        return {
          ...selectMethods,
          data: filtered.length > 0 ? filtered : null,
          count: filtered.length,
          single: () => {
            if (filtered.length === 0) {
              return { data: null, error: { message: "No rows found", code: "PGRST116" } };
            }
            return { data: filtered[0], error: null };
          }
        };
      }),
    };

    const tableMethods = {
      select: vi.fn().mockImplementation((columns: string = "*") => {
        // Track the method call
        methodCalls.select[tableName] = { columns };
        
        return {
          ...selectMethods,
          data: tableData.length > 0 ? tableData : null,
          error: null,
          eq: selectMethods.eq,
        };
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

    return Promise.resolve({ data: null, error: { message: "Unsupported procedure", code: "42P01" } });
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
