import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase.server";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  console.log("LOGIN API ENDPOINT CALLED");
  console.log("Request headers:", Object.fromEntries(request.headers.entries()));
  
  try {
    // Parse the request body with more robust error handling
    console.log("[DEBUG] Parsing request body...");
    let email, password, redirectUrl;
    try {
      // Handle both JSON and form data requests
      const contentType = request.headers.get("content-type") || "";
      console.log("Login request content type:", contentType);

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
      console.error("[DEBUG] Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request format",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email and password are required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create Supabase client
    let supabase;
    try {
      supabase = createSupabaseServerClient({ cookies, headers: request.headers });
    } catch (error) {
      console.error("[DEBUG] Failed to create Supabase client:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication service initialization failed",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Attempt login
    let data, error;
    console.log("[DEBUG] Attempting login with email:", email);
    try {
      // Sign in with password
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Store result data and error for further processing
      data = result.data;
      error = result.error;
      
      // Add debug logging
      console.log("[DEBUG] Login attempt:", { 
        success: !!result.data.user, 
        userId: result.data.user?.id,
        error: result.error?.message 
      });
      
    } catch (supabaseError) {
      console.error("[DEBUG] Supabase login error:", supabaseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication service error",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle login errors
    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Verify we have a user and session
    if (!data.user || !data.session) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication failed - no user or session returned",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle redirect for form submissions or return JSON for API calls
    if (request.headers.get("accept")?.includes("application/json")) {
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0]
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Redirect after successful login
    return redirect(redirectUrl || "/dashboard");
  } catch (error) {
    console.error("[DEBUG] Unexpected login error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
