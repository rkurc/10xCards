import type { APIContext } from "astro";

/**
 * Interface for API error responses
 */
export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

/**
 * Helper function to require authentication for API routes
 * Returns an unauthorized response if the user is not authenticated
 * @param context Astro API context
 * @returns Response if unauthorized, null if authorized
 */
export function requireAuth({ locals, request }: APIContext): Response | null {
  if (!locals.user) {
    return new Response(
      JSON.stringify({ 
        code: "UNAUTHORIZED", 
        message: "Authentication required to access this resource",
        status: 401 
      } as ApiError),
      { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
  return null; // Continue if authorized
}

/**
 * Helper to create standard API error responses
 * @param error Error object or string
 * @param status HTTP status code
 * @returns Formatted API error response
 */
export function createApiError(
  error: string | Error | ApiError | unknown, 
  status = 500
): Response {
  let apiError: ApiError;
  
  if (typeof error === 'string') {
    apiError = {
      code: 'API_ERROR',
      message: error,
      status
    };
  } else if (error instanceof Error) {
    apiError = {
      code: 'API_ERROR',
      message: error.message,
      status,
      details: error.stack
    };
  } else if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    apiError = {
      ...(error as ApiError),
      status: (error as ApiError).status || status
    };
  } else {
    apiError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      status,
      details: error
    };
  }
  
  return new Response(
    JSON.stringify(apiError),
    { 
      status: apiError.status, 
      headers: { "Content-Type": "application/json" } 
    }
  );
}

/**
 * Helper to create standard API success responses
 * @param data Response data
 * @param status HTTP status code
 * @returns Formatted API success response
 */
export function createApiResponse<T>(data: T, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { "Content-Type": "application/json" } 
    }
  );
}