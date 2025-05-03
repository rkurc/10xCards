import type { SupabaseClient } from "@supabase/supabase-js";
import type { TypedSupabaseClient } from "../db/supabase.service";
import { handleDatabaseError, type DatabaseError } from "../utils/db-error-handler";

/**
 * Base service class with shared functionality for all services
 * Provides consistent error handling and database operations
 */
export abstract class BaseService {
  /**
   * Creates a new service instance with a Supabase client
   * @param supabase The Supabase client to use for database operations
   */
  constructor(protected supabase: TypedSupabaseClient) {}

  /**
   * Executes a database operation with standardized error handling
   * @param operation The async operation to execute
   * @param errorMessage Optional custom error message
   * @returns The result of the operation
   * @throws DatabaseError if the operation fails
   */
  protected async executeDbOperation<T>(
    operation: () => Promise<T>,
    errorMessage = "Database operation failed"
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const dbError = handleDatabaseError(error, errorMessage);
      console.error(`${errorMessage}:`, dbError);
      throw dbError;
    }
  }

  /**
   * Standardizes handling of Supabase query responses
   * @param result The result from a Supabase query
   * @param errorMessage Optional custom error message
   * @returns The data from the result
   * @throws DatabaseError if the result contains an error or no data
   */
  protected handleQueryResult<T>(
    result: { data: T | null; error: any | null },
    errorMessage = "Database query failed"
  ): T {
    if (result.error) {
      throw handleDatabaseError(result.error, errorMessage);
    }

    if (result.data === null) {
      throw handleDatabaseError(new Error("No data found"), "The requested resource was not found");
    }

    return result.data;
  }

  /**
   * Executes multiple database operations in a transactional way
   * Note: Since Supabase JS client doesn't directly support transactions,
   * this uses a stored procedure approach
   *
   * @param procedureName The name of the PostgreSQL stored procedure to call
   * @param params The parameters to pass to the procedure
   * @param errorMessage Optional custom error message
   * @returns The result from the procedure
   * @throws DatabaseError if the transaction fails
   */
  protected async executeTransaction<T>(
    procedureName: string,
    params: Record<string, any>,
    errorMessage = "Transaction failed"
  ): Promise<T> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase.rpc(procedureName, params);

      if (error) {
        throw error;
      }

      if (data === null) {
        throw new Error("Transaction returned no data");
      }

      return data as T;
    }, errorMessage);
  }

  /**
   * Checks if a record exists in a table
   * @param table The table name
   * @param column The column to check
   * @param value The value to check for
   * @returns True if the record exists, false otherwise
   */
  protected async recordExists(table: string, column: string, value: any): Promise<boolean> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq(column, value);

      if (error) {
        throw error;
      }

      return (data?.length || 0) > 0;
    }, `Failed to check if record exists in ${table}`);
  }

  /**
   * Verifies that a record exists and belongs to the specified user
   * @param table The table name
   * @param id The record ID
   * @param userId The user ID
   * @returns True if the record exists and belongs to the user, false otherwise
   */
  protected async verifyOwnership(table: string, id: string, userId: string): Promise<boolean> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }

      return (data?.length || 0) > 0;
    }, `Failed to verify ownership of record in ${table}`);
  }
}
