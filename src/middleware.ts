import type { MiddlewareHandler } from "astro";
import { env, validateEnvironment } from "./config/environment";
import { createSupabaseServerClient } from "./lib/supabase.server";

// Define endpoints that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth-callback",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/logout",
];

// Change this value to false to use real Supabase authentication
const USE_MOCK_AUTH = false;

// Declare global variable to track environment validation
declare global {
  // eslint-disable-next-line no-var
  var __ENV_VALIDATED__: boolean;
}

export const onRequest: MiddlewareHandler = async ({ locals, request }, next) => {
  try {
    // Validate environment on first request in development
    if (env.isDevelopment && !global.__ENV_VALIDATED__) {
      console.log("[DEBUG] Middleware: Validating environment in development");
      validateEnvironment();
      global.__ENV_VALIDATED__ = true;
    }

    // Check if path is public
    const url = new URL(request.url);
    const isPublicPath = PUBLIC_PATHS.includes(url.pathname);
    console.log(`[DEBUG] Middleware: Request to ${url.pathname} (Public: ${isPublicPath})`);

    // Create Supabase client
    try {
      locals.supabase = createSupabaseServerClient({
        cookies: locals.cookies,
        headers: request.headers,
      });
      console.log("[DEBUG] Middleware: Supabase client created successfully");
    } catch (error) {
      console.error("[DEBUG] Middleware: Failed to create Supabase client:", error);
      throw error;
    }

    // Get auth token from request
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split("Bearer ")[1];
    console.log(`[DEBUG] Middleware: Auth header present: ${!!authHeader}, Bearer token present: ${!!token}`);

    // Extract user from token if present
    if (token) {
      console.log("[DEBUG] Middleware: Attempting to get user from token");
      const { data, error } = await locals.supabase.auth.getUser(token);

      if (data.user && !error) {
        console.log("[DEBUG] Middleware: User found in token");
        locals.user = data.user;
        locals.isAuthenticated = true;
      } else {
        console.log("[DEBUG] Middleware: Invalid or expired token:", error?.message);
      }
    }

    // Check for session cookie if no token provided
    if (!token) {
      console.log("[DEBUG] Middleware: No token, checking session cookie");
      const {
        data: { session },
        error,
      } = await locals.supabase.auth.getSession();

      if (session && !error) {
        console.log("[DEBUG] Middleware: Valid session found");
        locals.user = session.user;
        locals.isAuthenticated = true;
      } else if (error) {
        console.log("[DEBUG] Middleware: Session error:", error.message);
      } else {
        console.log("[DEBUG] Middleware: No valid session found");
      }
    }

    // Add helper to check authentication
    locals.isAuthenticated = !!locals.user;

    // Block access to protected routes for unauthenticated users
    if (!isPublicPath && !locals.isAuthenticated) {
      console.log("[DEBUG] Middleware: Blocking access to protected route");
      return new Response(
        JSON.stringify({
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log request details in development
    if (env.isDevelopment) {
      const userEmail = locals.user?.email || "unauthenticated";
      console.log(`[DEBUG] Middleware: ${request.method} ${url.pathname} (User: ${userEmail})`);
    }

    return next();
  } catch (error) {
    console.error("[DEBUG] Middleware: Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
