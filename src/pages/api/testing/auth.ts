import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase.server";
import { createAuthErrorResponse, createAuthSuccessResponse } from "../../../utils/auth/responses";

/**
 * Test-only API endpoint for creating test users and managing test scenarios
 * This endpoint should only be accessible in test environments
 */
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Only allow this endpoint in test mode
  const isTestMode = 
    process.env.MODE === 'test' || 
    request.headers.get('x-test-environment') === 'true';
  
  if (!isTestMode) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "This endpoint is only available in test mode",
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
    // Parse the request body
    const body = await request.json();
    const { action, userData } = body;

    // Create Supabase client
    const supabase = createSupabaseServerClient({ 
      cookies, 
      headers: request.headers 
    });

    // Handle different test actions
    switch (action) {
      case 'create_test_user': {
        const { name, email, password } = userData;
        
        if (!email || !password) {
          return createAuthErrorResponse("Email and password are required", 400);
        }

        // First check if the user already exists
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("email")
          .eq("email", email)
          .maybeSingle();

        // If user exists, return their data instead of error
        if (existingUser) {
          return createAuthSuccessResponse({
            user: {
              email,
              id: existingUser.id || 'unknown',
              name: name || email.split('@')[0]
            },
            exists: true
          });
        }

        // Create a new user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${new URL(request.url).origin}/auth-callback`,
          },
        });

        if (error) {
          return createAuthErrorResponse(error.message, 400);
        }

        return createAuthSuccessResponse({
          user: {
            id: data.user?.id || 'unknown',
            email: data.user?.email || email,
            name: data.user?.user_metadata?.name || name || email.split('@')[0]
          },
          exists: false
        });
      }

      case 'simulate_login_error': {
        // Simulate a login error for testing error display
        return createAuthErrorResponse("Invalid login credentials", 401);
      }

      default:
        return createAuthErrorResponse(`Unknown test action: ${action}`, 400);
    }
  } catch (error) {
    return createAuthErrorResponse(`Test endpoint error: ${error.message}`, 500);
  }
};