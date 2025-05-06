import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase.server";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  console.log("LOGIN API ENDPOINT CALLED - " + new Date().toISOString());
  console.log("Request headers:", Object.fromEntries(request.headers.entries()));

  // Fix: Astro cookies object doesn't have a getAll() method
  // Log cookies in a safe way
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    console.log("Cookies header:", cookieHeader);
  } catch (error) {
    console.error("Error accessing cookies:", error);
  }

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
        console.log("[DEBUG] Parsed JSON body keys:", Object.keys(body));
        email = body.email;
        password = body.password;
        redirectUrl = body.redirectUrl;
        console.log("[DEBUG] Email present:", !!email, "Password present:", !!password);
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
          error: "Invalid request format: " + parseError.message,
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
      console.error("[DEBUG] Missing required fields. Email present:", !!email, "Password present:", !!password);
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
      console.log("[DEBUG] Creating Supabase server client...");
      supabase = createSupabaseServerClient({ cookies, headers: request.headers });
      console.log("[DEBUG] Supabase client created successfully");
    } catch (error) {
      console.error("[DEBUG] Failed to create Supabase client:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Authentication service initialization failed: " + (error instanceof Error ? error.message : String(error)),
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
      console.log("[DEBUG] Calling supabase.auth.signInWithPassword...");
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("[DEBUG] Supabase auth result received");

      // Store result data and error for further processing
      data = result.data;
      error = result.error;

      // Add detailed debug logging
      console.log("[DEBUG] Login attempt result:", {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        userId: data?.user?.id,
        email: data?.user?.email?.substring(0, 3) + "...",
        error: error?.message,
        errorCode: error?.status,
      });
    } catch (supabaseError) {
      console.error("[DEBUG] Supabase login error:", supabaseError);
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Authentication service error: " +
            (supabaseError instanceof Error ? supabaseError.message : String(supabaseError)),
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
      console.error("[DEBUG] Authentication error:", error.message, "Status:", error.status);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          status: error.status,
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
      console.error("[DEBUG] No user or session returned:", {
        hasUser: !!data.user,
        hasSession: !!data.session,
      });
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

    console.log("[DEBUG] Authentication successful, preparing response");

    // Handle redirect for form submissions or return JSON for API calls
    if (request.headers.get("accept")?.includes("application/json")) {
      console.log("[DEBUG] Returning JSON response for successful login");
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
          },
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
    console.log("[DEBUG] Redirecting to:", redirectUrl || "/dashboard");
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
