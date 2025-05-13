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
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });
  let email: string | undefined;

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      email = body.email;
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      email = formData.get("email")?.toString();
    } else {
      return createAuthErrorResponse("Unsupported content type", 415);
    }

    if (!email) {
      return createAuthErrorResponse("Email is required", 400);
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.url.split("/api/")[0]}/reset-password`,
    });

    if (error) {
      return createAuthErrorResponse(error.message, 400);
    }

    return createAuthSuccessResponse({});
  } catch {
    return createAuthErrorResponse("An unexpected error occurred", 500);
  }
};
