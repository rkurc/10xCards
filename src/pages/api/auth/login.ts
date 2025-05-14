import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase.server";
import { createAuthErrorResponse, createAuthSuccessResponse } from "../../../utils/auth/responses";

/**
 * @deprecated This API route is deprecated and will be removed in a future release.
 * Use the AuthService or AuthContext directly with Supabase client instead.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("[AUTH] Login API endpoint called (DEPRECATED) - " + new Date().toISOString());
  console.warn("This API route is deprecated. Use AuthService directly with Supabase client instead.");

  try {
    // Parse request body
    let email: string | null = null;
    let password: string | null = null;

    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } catch {
      return createAuthErrorResponse("Invalid request format", 400);
    }

    if (!email || !password) {
      return createAuthErrorResponse("Email and password are required", 400);
    }

    // Create Supabase client
    const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Return 401 for authentication errors
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data?.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication failed - no user returned",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return successful response
    return createAuthSuccessResponse({
      user: {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "",
      },
    });
  } catch (error) {
    return createAuthErrorResponse("Unexpected error during login", 500);
  }
};
