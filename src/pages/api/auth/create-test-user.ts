import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase.server";

// Only enable this endpoint in development
const DEV_MODE = import.meta.env.DEV;

// IMPORTANT: This endpoint should only be used for testing
// It should be disabled in production
export const POST: APIRoute = async ({ request, cookies }) => {
  // Safety check - only available in development
  if (!DEV_MODE) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "This endpoint is only available in development mode",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    console.log("[DEBUG] Create test user endpoint called");
    
    // Create Supabase client
    const supabase = createSupabaseServerClient({ cookies, headers: request.headers });
    
    // Generate test user credentials
    const testEmail = "test@example.com";
    const testPassword = "password123";
    
    // Check if test user already exists by trying to sign in
    const { data: checkData, error: checkError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    // If sign in succeeds, user already exists
    if (checkData?.user) {
      console.log("[DEBUG] Test user already exists");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Test user already exists",
          user: {
            email: testEmail,
            password: testPassword, // Note: Only return this in dev mode
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
    
    // If sign in failed for a different reason than "User not found", return the error
    if (checkError && !checkError.message.includes("Invalid login credentials")) {
      console.error("[DEBUG] Unexpected error checking for test user:", checkError);
      return new Response(
        JSON.stringify({
          success: false,
          error: checkError.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Create test user
    console.log("[DEBUG] Creating test user...");
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: "Test User",
        },
      },
    });
    
    if (error) {
      console.error("[DEBUG] Error creating test user:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Auto-confirm the user if email confirmation is required
    // Note: This requires admin privileges or database access in a real setup
    // For this example, we're just reporting that confirmation is needed
    
    if (!data.session) {
      console.log("[DEBUG] User created but email confirmation required");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Test user created but requires email confirmation",
          user: {
            email: testEmail,
            password: testPassword, // Note: Only return this in dev mode
          },
          requiresEmailConfirmation: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    console.log("[DEBUG] Test user created successfully");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Test user created successfully",
        user: {
          id: data.user?.id,
          email: testEmail,
          password: testPassword, // Note: Only return this in dev mode
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    
  } catch (error) {
    console.error("[DEBUG] Unexpected error:", error);
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