import type { TypedSupabaseClient } from "../db/supabase.service";
import { handleDatabaseError, ErrorCode } from "../utils/db-error-handler";

/**
 * Base service class that provides common database operations and error handling
 * All other services should extend this class
 */
export class BaseService {
  protected readonly supabase: TypedSupabaseClient;

  constructor(supabase: TypedSupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Executes a database operation with error handling
   * @param operation Function that performs the database operation
   * @param errorMsg Optional custom error message
   * @returns The result of the operation
   * @throws Standardized error object
   */
  protected async executeDbOperation<T>(operation: () => Promise<T>, errorMsg?: string): Promise<T> {
    try {
      console.log(`[DEBUG] executeDbOperation: Starting database operation`);
      const result = await operation();
      console.log(`[DEBUG] executeDbOperation: Operation completed successfully`);
      return result;
    } catch (error: any) {
      console.error(`[DEBUG] executeDbOperation: Error encountered:`, error);
      console.log(`[DEBUG] executeDbOperation: Error type:`, typeof error);
      console.log(`[DEBUG] executeDbOperation: Error code:`, error?.code);
      console.log(`[DEBUG] executeDbOperation: Error message:`, error?.message);
      console.log(`[DEBUG] executeDbOperation: Custom error message:`, errorMsg);

      // Transform Postgres error codes
      if (error && error.code === "23505") {
        console.log(`[DEBUG] executeDbOperation: Detected duplicate entry error (23505)`);
        throw {
          code: ErrorCode.DUPLICATE_ENTRY,
          message: error.message || "Duplicate entry",
          status: 409,
        };
      }

      // If the error already has a code property and it's not a postgres code, preserve it
      if (error && error.code && !error.code.match(/^\d+/)) {
        console.log(`[DEBUG] executeDbOperation: Preserving existing error code:`, error.code);
        throw error;
      }

      const formattedError = handleDatabaseError(error, errorMsg);
      console.log(`[DEBUG] executeDbOperation: Formatted error:`, formattedError);
      throw formattedError;
    }
  }

  /**
   * Executes a database transaction using Supabase RPC
   * @param procedureName The name of the stored procedure to call
   * @param params Parameters to pass to the procedure
   * @param errorMsg Optional custom error message
   * @returns The result of the transaction
   * @throws Standardized error object
   */
  protected async executeTransaction<T>(
    procedureName: string,
    params: Record<string, any>,
    errorMsg?: string
  ): Promise<T> {
    return this.executeDbOperation(
      async () => {
        const { data, error } = await this.supabase.rpc(procedureName, params);

        return this.handleQueryResult<T>({ data, error }, errorMsg);
      },
      errorMsg || `Failed to execute transaction: ${procedureName}`
    );
  }

  /**
   * Handles the result of a database query, standardizing the error format
   * @param result The database query result
   * @param errorMsg Optional custom error message
   * @returns The data from the result
   * @throws Standardized error object if there's an error or no data
   */
  protected handleQueryResult<T>(result: { data: T | null; error: any | null }, errorMsg?: string): T {
    // If there's an error in the query result, throw with proper error code
    if (result.error) {
      // Match test expectations: map PostgreSQL error codes to our application error codes
      if (result.error.code === "42P01") {
        throw {
          code: ErrorCode.NOT_FOUND,
          message: result.error.message || "Resource not found",
          status: 404,
        };
      }

      // Handle foreign key violation errors
      if (result.error.code === "23503") {
        throw {
          code: ErrorCode.CONSTRAINT_VIOLATION,
          message: result.error.message || "Foreign key constraint violation",
          status: 400,
        };
      }

      // Handle unique constraint violations
      if (result.error.code === "23505") {
        throw {
          code: ErrorCode.DUPLICATE_ENTRY,
          message: result.error.message || "Duplicate entry",
          status: 409,
        };
      }

      // Handle other constraint violations
      if (result.error.code === "23000" || result.error.code === "23514") {
        throw {
          code: ErrorCode.CONSTRAINT_VIOLATION,
          message: result.error.message || "Constraint violation",
          status: 400,
        };
      }

      throw result.error;
    }

    // If no data returned, throw consistent "not found" error
    if (!result.data) {
      throw {
        code: ErrorCode.DATABASE_ERROR,
        message: errorMsg || "Data not found",
        status: 500,
      };
    }

    return result.data;
  }

  /**
   * Checks if a record exists in the database
   * @param table The table to check
   * @param column The column to check
   * @param value The value to check for
   * @returns True if the record exists, false otherwise
   */
  protected async recordExists(table: string, column: string, value: any): Promise<boolean> {
    console.log(`[DEBUG] recordExists: Checking if record exists in ${table} where ${column}=${value}`);
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select(column)
        .eq(column, value)
        .limit(1);

      console.log(`[DEBUG] recordExists: Query result - data:`, data);
      console.log(`[DEBUG] recordExists: Query result - error:`, error);

      return data && data.length > 0;
    } catch (error) {
      console.error(`[DEBUG] recordExists: Unexpected error checking if record exists:`, error);
      throw error;
    }
  }

  /**
   * Verifies that a record exists and belongs to the specified user
   * @param table The table to check
   * @param id The ID of the record
   * @param userId The ID of the user
   * @returns True if the record exists and belongs to the user, false otherwise
   */
  protected async verifyOwnership(table: string, id: string, userId: string): Promise<boolean> {
    console.log(`[DEBUG] verifyOwnership: Checking if record exists in ${table} with id ${id} for user ${userId}`);
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      const exists = !!data && !error;
      console.log(`[DEBUG] verifyOwnership: User ownership check result for ${table}: ${exists}`);
      return exists;
    } catch (error) {
      console.error(`[DEBUG] verifyOwnership: Error verifying ownership in ${table}:`, error);
      return false;
    }
  }
}
