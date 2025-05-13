import type { MiddlewareHandler } from "astro";
import { env, validateEnvironment } from "./config/environment";
import { createSupabaseServerClient } from "./lib/supabase.server";
import type { AstroCookies } from "astro";
import type { User } from "@supabase/supabase-js";

// Extend Astro's Locals interface
declare module "astro" {
  interface AstroGlobal {
    locals: {
      cookies: AstroCookies;
      isAuthenticated: boolean;
      user?: User;
      supabase: ReturnType<typeof createSupabaseServerClient>;
    };
  }
}

// Define endpoints that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/registration-success",
  "/auth-callback",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/logout",
  "/api/auth/create-test-user", // Add the test user creation endpoint
  "/api/auth/confirm-test-user", // Add the test user confirmation endpoint
  "/api/auth/resend-verification",
];

// Declare global variable to track environment validation
declare global {
  // eslint-disable-next-line no-var
  var __ENV_VALIDATED__: boolean;
}

export const onRequest: MiddlewareHandler = async ({ locals, request, cookies }, next) => {
  try {
    // Set cookies in locals
    locals.cookies = cookies;

    // Validate environment on first request in development
    if (env.isDevelopment && !global.__ENV_VALIDATED__) {
      validateEnvironment();
      global.__ENV_VALIDATED__ = true;
    }

    // Check if path is public
    const url = new URL(request.url);
    const isPublicPath = PUBLIC_PATHS.includes(url.pathname);

    // Create Supabase client
    try {
      locals.supabase = createSupabaseServerClient({
        cookies: locals.cookies,
        headers: request.headers,
      });
    } catch (error) {
      console.error("[DEBUG] Middleware: Failed to create Supabase client:", error);
      throw error;
    }

    // Get auth token from request
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split("Bearer ")[1];

    // Authenticate user securely with getUser()
    try {
      // If token exists in Authorization header, use it explicitly
      if (token) {
        const { data, error } = await locals.supabase.auth.getUser(token);
        if (data.user && !error) {
          locals.user = data.user;
          locals.isAuthenticated = true;
        }
      } else {
        // Otherwise let getUser() use the session from cookies
        const { data, error } = await locals.supabase.auth.getUser();
        if (data.user && !error) {
          locals.user = data.user;
          locals.isAuthenticated = true;
        }
      }
    } catch (authError) {
      console.error("[DEBUG] Authentication error:", authError);
      locals.isAuthenticated = false;
    }

    // Block access to protected routes for unauthenticated users
    if (!isPublicPath && !locals.isAuthenticated) {
      // Check if this is an API route or a page route
      const isApiRoute = url.pathname.startsWith("/api/");

      if (isApiRoute) {
        // For API routes: return a JSON 401 response
        return new Response(
          JSON.stringify({
            error: "Authentication required",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        // For page routes: redirect to login page with the return URL
        const redirectUrl = new URL("/login", url.origin);
        redirectUrl.searchParams.set("redirect", url.pathname);
        return Response.redirect(redirectUrl.toString(), 302);
      }
    }

    // Log request details in development
    if (env.isDevelopment) {
      const userEmail = locals.user?.email || "unauthenticated";
      console.log(`[DEBUG] Request: ${url.pathname} - User: ${userEmail}`);
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
