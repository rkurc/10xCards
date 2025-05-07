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
  console.log("[AUTH] Register API endpoint called (DEPRECATED) - " + new Date().toISOString());
  console.warn("This API route is deprecated. Use AuthService directly with Supabase client instead.");

  try {
    // Parse the request body
    let email, password, userData, redirectUrl;
    try {
      // Handle both JSON and form data requests
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

    // Validate required fields
    if (!email || !password) {
      return createAuthErrorResponse("Email and password are required", 400);
    }

    // Create Supabase client
    let supabase;
    try {
      supabase = createSupabaseServerClient({ cookies, headers: request.headers });
    } catch (error) {
      return createAuthErrorResponse("Authentication service initialization failed", 500);
    }

    // First check if the email already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .maybeSingle();
      
    if (existingUser) {
      console.log("[AUTH] Attempted registration with existing email:", email);
      return createAuthErrorResponse("Email already registered", 400);
    }

    // Attempt registration with metadata for user's name
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData, // This will include the name field
        emailRedirectTo: `${new URL(request.url).origin}/auth-callback`,
      },
    });

    if (error) {
      return createAuthErrorResponse(error.message, 400);
    }

    // Check if email confirmation is required
    const emailConfirmationRequired = !data.session;

    if (emailConfirmationRequired) {
      return createAuthSuccessResponse({
        requiresEmailConfirmation: true
      });
    }

    // Handle successful registration response
    return handleAuthResponse({
      request,
      redirect,
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          name: data.user?.user_metadata?.name || data.user?.email?.split("@")[0],
        }
      },
      redirectUrl: redirectUrl || "/dashboard"
    });
  } catch (error) {
    return createAuthErrorResponse("An unexpected error occurred during registration", 500);
  }
};
