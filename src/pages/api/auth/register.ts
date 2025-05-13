import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase.server";
import { createAuthErrorResponse, createAuthSuccessResponse } from "../../../utils/auth/responses";

/**
 * @deprecated This API route is deprecated and will be removed in a future release.
 * Use the AuthService or AuthContext directly with Supabase client instead.
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  console.log("[AUTH] Register API endpoint called (DEPRECATED) - " + new Date().toISOString());
  console.warn("This API route is deprecated. Use AuthService directly with Supabase client instead.");

  try {
    let email: string, password: string, userData: any, redirectUrl: string;

    try {
      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const body = await request.json();
        email = body.email;
        password = body.password;
        userData = body.userData;
        redirectUrl = body.redirectUrl;
      } else if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {
        const formData = await request.formData();
        email = formData.get("email")?.toString();
        password = formData.get("password")?.toString();
        userData = formData.get("userData") ? JSON.parse(formData.get("userData")?.toString() || "{}") : {};
        redirectUrl = formData.get("redirectUrl")?.toString();
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (parseError) {
      return createAuthErrorResponse("Invalid request format", 400);
    }

    if (!email || !password) {
      return createAuthErrorResponse("Email and password are required", 400);
    }

    const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

    // Attempt registration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${new URL(request.url).origin}/auth-callback`,
      },
    });

    if (error) {
      // Check for specific error messages
      if (error.message.toLowerCase().includes("user already registered")) {
        return createAuthErrorResponse("User already registered", 400);
      }
      return createAuthErrorResponse(error.message, 400);
    }

    if (!data.user) {
      return createAuthErrorResponse("Registration failed - no user created", 400);
    }

    // Return success response
    return createAuthSuccessResponse({
      user: {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "",
      },
      requiresEmailConfirmation: !data.session,
    });
  } catch (error) {
    console.error("[AUTH] Registration error:", error);
    return createAuthErrorResponse("Unexpected error during registration", 500);
  }
};
