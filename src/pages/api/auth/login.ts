import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase.server";
import { 
  createAuthErrorResponse, 
  createAuthSuccessResponse,
  handleAuthResponse
} from "../../../utils/auth/responses";

/**
 * @deprecated This API route is deprecated and will be removed in a future release.
 * Use the AuthService or AuthContext directly with Supabase client instead.
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  console.log("[AUTH] Login API endpoint called (DEPRECATED) - " + new Date().toISOString());
  console.warn("This API route is deprecated. Use AuthService directly with Supabase client instead.");
  
  try {
    // Parse the request body with more robust error handling
    let email, password, redirectUrl;
    try {
      // Handle both JSON and form data requests
      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const body = await request.json();
        email = body.email;
        password = body.password;
        redirectUrl = body.redirectUrl;
      } else if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {
        const formData = await request.formData();
        email = formData.get("email")?.toString();
        password = formData.get("password")?.toString();
        redirectUrl = formData.get("redirectUrl")?.toString();
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (parseError) {
      return createAuthErrorResponse(`Invalid request format: ${parseError.message}`, 400);
    }

    // Validate required fields
    if (!email || !password) {
      return createAuthErrorResponse("Email and password are required", 400);
    }

    // Create Supabase client
    let supabase;
    try {
      supabase = createSupabaseServerClient({ cookies, headers: request.headers });
    } catch (error) {
      return createAuthErrorResponse(`Authentication service initialization failed: ${error}`, 500);
    }

    // Attempt login
    try {
      // Sign in with password
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const { data, error } = result;
      
      // Handle login errors
      if (error) {
        return createAuthErrorResponse(error.message, 401);
      }

      // Verify we have a user and session
      if (!data.user || !data.session) {
        return createAuthErrorResponse("Authentication failed - no user or session returned", 401);
      }

      // Handle successful login response
      return handleAuthResponse({
        request,
        redirect,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
          }
        },
        redirectUrl: redirectUrl || "/dashboard"
      });
    } catch (authError) {
      return createAuthErrorResponse(`Authentication service error: ${authError}`, 500);
    }
  } catch (error) {
    return createAuthErrorResponse(`Unexpected login error: ${error}`, 500);
  }
};
