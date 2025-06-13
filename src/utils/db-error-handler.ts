import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // Database errors
  DATABASE_ERROR = "DATABASE_ERROR",
  NOT_FOUND = "NOT_FOUND",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
  CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION",

  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // API errors
  API_ERROR = "API_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // External service errors
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Unknown errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Standardized error structure for database operations
 */
export interface DatabaseError {
  code: string;
  message: string;
  details?: unknown;
  status: number;
  originalError?: unknown;
}

/**
 * Maps PostgreSQL error codes to HTTP status codes and application error codes
 */
const PG_ERROR_MAP: Record<string, { status: number; code: ErrorCode }> = {
  // Authentication errors
  "28000": { status: 401, code: ErrorCode.UNAUTHORIZED }, // Invalid auth
  "28P01": { status: 401, code: ErrorCode.UNAUTHORIZED }, // Wrong password

  // Constraint violations
  "23000": { status: 400, code: ErrorCode.CONSTRAINT_VIOLATION }, // Integrity constraint violation
  "23503": { status: 400, code: ErrorCode.CONSTRAINT_VIOLATION }, // Foreign key violation
  "23505": { status: 409, code: ErrorCode.DUPLICATE_ENTRY }, // Unique violation
  "23514": { status: 400, code: ErrorCode.CONSTRAINT_VIOLATION }, // Check violation

  // Data exceptions
  "22000": { status: 400, code: ErrorCode.VALIDATION_ERROR }, // Data exception
  "22001": { status: 400, code: ErrorCode.VALIDATION_ERROR }, // String too long
  "22P02": { status: 400, code: ErrorCode.VALIDATION_ERROR }, // Invalid text representation

  // No data
  "02000": { status: 404, code: ErrorCode.NOT_FOUND }, // No data found

  // Connection exceptions
  "08000": { status: 503, code: ErrorCode.DATABASE_ERROR }, // Connection exception
  "08003": { status: 503, code: ErrorCode.DATABASE_ERROR }, // Connection does not exist
  "08006": { status: 503, code: ErrorCode.DATABASE_ERROR }, // Connection failure

  // Other
  "42P01": { status: 404, code: ErrorCode.NOT_FOUND }, // Table not found
  "42703": { status: 400, code: ErrorCode.VALIDATION_ERROR }, // Column not found
};

/**
 * Default HTTP status code for database errors
 */
const DEFAULT_DB_ERROR_STATUS = 500;

/**
 * Converts a PostgreSQL error code to an HTTP status code
 */
function getStatusFromPgError(pgErrorCode: string): number {
  return PG_ERROR_MAP[pgErrorCode]?.status || DEFAULT_DB_ERROR_STATUS;
}

/**
 * Maps a PostgreSQL error code to an application error code
 */
function getErrorCodeFromPgError(pgErrorCode: string): ErrorCode {
  return PG_ERROR_MAP[pgErrorCode]?.code || ErrorCode.DATABASE_ERROR;
}

/**
 * Handles and standardizes database errors from Supabase operations
 * @param error The error to handle (can be PostgrestError, Error, or unknown)
 * @param defaultMessage Optional custom message to use if error doesn't have one
 * @returns Standardized DatabaseError object
 */
export function handleDatabaseError(
  error: PostgrestError | Error | unknown,
  defaultMessage = "Wystąpił błąd bazy danych"
): DatabaseError {
  console.error("Database operation error:", error);

  // Handle PostgrestError from Supabase
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const pgError = error as PostgrestError;
    const pgErrorCode = pgError.code;

    return {
      code: getErrorCodeFromPgError(pgErrorCode),
      message: pgError.message || defaultMessage,
      details: pgError.details,
      status: getStatusFromPgError(pgErrorCode),
      originalError: error,
    };
  }

  // Handle standard JavaScript Error
  if (error instanceof Error) {
    return {
      code: ErrorCode.DATABASE_ERROR,
      message: error.message || defaultMessage,
      details: error.stack,
      status: 500,
      originalError: error,
    };
  }

  // Handle unknown errors
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: defaultMessage,
    details: error,
    status: 500,
    originalError: error,
  };
}

/**
 * Checks if an error is a specific PostgreSQL constraint violation
 */
export function isConstraintViolation(error: unknown, constraintName?: string): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const pgError = error as PostgrestError;

    // Check if it's a constraint violation error
    if (pgError.code === "23503" || pgError.code === "23505" || pgError.code === "23514") {
      // If no specific constraint is provided, any constraint violation matches
      if (!constraintName) return true;

      // Check if the specific constraint is mentioned in the error details
      if (pgError.details && typeof pgError.details === "string") {
        return pgError.details.includes(constraintName);
      }
    }
  }

  return false;
}

/**
 * Checks if an error indicates a not found condition
 */
export function isNotFoundError(error: unknown): boolean {
  if (error && typeof error === "object") {
    if ("code" in error) {
      const pgError = error as PostgrestError;
      return pgError.code === "02000" || pgError.code === "42P01";
    }

    if ("status" in error && (error as any).status === 404) {
      return true;
    }
  }

  return false;
}
