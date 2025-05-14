import type { APIContext } from "astro";

/**
 * Standard authentication response types
 */
export interface AuthSuccessResponse {
  success: true;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  requiresEmailConfirmation?: boolean;
}

export interface AuthErrorResponse {
  success: false;
  error: string;
  status?: number;
}

export type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

/**
 * Create a standardized JSON response for authentication errors
 */
export function createAuthErrorResponse(error: string | Error, status = 400): Response {
  const errorMessage = error instanceof Error ? error.message : error;

  console.error(`[AUTH] Error: ${errorMessage}`);

  return new Response(
    JSON.stringify({
      success: false,
      error: errorMessage,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Create a standardized JSON response for successful authentication
 */
export function createAuthSuccessResponse(data: Omit<AuthSuccessResponse, "success">): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Determine if the request expects a JSON response or a redirect
 * This is determined by the Accept header
 */
export function requestExpectsJson(request: Request): boolean {
  return !!request.headers.get("accept")?.includes("application/json");
}

/**
 * Handle authentication response based on client expectations
 * Returns JSON for API requests, performs redirect for form submissions
 */
export function handleAuthResponse({
  request,
  redirect,
  data,
  redirectUrl = "/dashboard",
}: {
  request: Request;
  redirect: APIContext["redirect"];
  data: Omit<AuthSuccessResponse, "success">;
  redirectUrl?: string;
}): Response {
  // Check for test mode header
  const isTestMode = request.headers.get("x-test-environment") === "true";

  // For API requests or in test mode, return JSON
  if (requestExpectsJson(request) || isTestMode) {
    console.log("[AUTH] Returning JSON response for successful auth operation");
    return createAuthSuccessResponse(data);
  }

  // For form submissions, redirect
  console.log("[AUTH] Redirecting to:", redirectUrl);
  return redirect(redirectUrl);
}
