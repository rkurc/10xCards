import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase.server";

/**
 * @deprecated This API route is deprecated and will be removed in a future release.
 * Use the AuthService or AuthContext directly with Supabase client instead.
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  console.log("🔑 Logout API endpoint called (DEPRECATED)");
  console.warn("This API route is deprecated. Use AuthService directly with Supabase client instead.");

  try {
    // For mock auth, clear the cookie directly
    if (cookies.has("mock-auth-token")) {
      console.log("🔒 Clearing mock auth token");
      cookies.delete("mock-auth-token", { path: "/" });

      // Return success response for XHR requests with JSON expected
      if (request.headers.get("accept")?.includes("application/json")) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Otherwise redirect for form submissions
      console.log("🔄 Redirecting to home page");
      return redirect("/");
    }

    // Create Supabase server client
    console.log("🔧 Creating Supabase server client for logout");
    const supabase = createSupabaseServerClient({
      cookies,
      headers: request.headers,
    });

    // Sign out user - this will clear Supabase auth cookies
    console.log("🔑 Calling Supabase auth.signOut()");
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("❌ Logout error:", error);

      // Return error response for XHR requests
      if (request.headers.get("accept")?.includes("application/json")) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // For form submissions, redirect to home with error param
      return redirect(`/?logout_error=${encodeURIComponent(error.message)}`);
    }

    // Success handling
    console.log("✅ Logout successful");

    // Check if this is an AJAX request or form submission
    if (request.headers.get("accept")?.includes("application/json")) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Redirect to home page after successful logout for form submissions
    console.log("🔄 Redirecting to home page after logout");
    return redirect("/");
  } catch (error) {
    console.error("❌ Unexpected error during logout:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred during logout",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
