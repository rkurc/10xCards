import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

// Only enable this endpoint in development
const DEV_MODE = import.meta.env.DEV;

// IMPORTANT: This endpoint should only be used for testing
// It should be disabled in production
export const POST: APIRoute = async ({ request }) => {
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
    console.log("[DEBUG] Confirm test user endpoint called");
    
    // Parse request body to get email
    let email;
    try {
      const body = await request.json();
      email = body.email || "test@example.com"; // Default to test user if not provided
    } catch (error) {
      // If no body provided, use default test user
      email = "test@example.com";
    }
    
    console.log(`[DEBUG] Attempting to confirm user with email: ${email}`);
    
    // Create a Supabase admin client using service role
    // IMPORTANT: This uses the SUPABASE_SERVICE_ROLE_KEY which gives full admin access
    // Never expose this key in client-side code
    const supabaseAdmin = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // First, try to get the user by email to confirm they exist
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("[DEBUG] Error listing users:", userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to access user list: " + userError.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Find user by email
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`[DEBUG] User with email ${email} not found`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `User with email ${email} not found`,
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Update user to be confirmed (if they're not already)
    if (!user.email_confirmed_at) {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirmed: true }
      );
      
      if (error) {
        console.error("[DEBUG] Error confirming user:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to confirm user: " + error.message,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
      
      console.log("[DEBUG] User confirmed successfully:", data);
      return new Response(
        JSON.stringify({
          success: true,
          message: `User ${email} confirmed successfully`,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      // User already confirmed
      console.log("[DEBUG] User already confirmed:", user.email);
      return new Response(
        JSON.stringify({
          success: true,
          message: `User ${email} was already confirmed`,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
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