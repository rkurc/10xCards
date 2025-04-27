import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase.server';
import { mockAuth } from '../../../lib/auth-mock';

// Change to true if you want to use mock auth for debugging
const USE_MOCK_AUTH = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    console.log("🔑 API login endpoint called");
    
    // Parse the request body with more robust error handling
    let email, password, redirectUrl;
    try {
      // Handle both JSON and form data requests
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        const body = await request.json();
        email = body.email;
        password = body.password;
        redirectUrl = body.redirectUrl;
      } else if (contentType.includes('application/x-www-form-urlencoded') || 
                contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        email = formData.get('email')?.toString();
        password = formData.get('password')?.toString();
        redirectUrl = formData.get('redirectUrl')?.toString();
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
      
      console.log(`🔑 Login attempt for: ${email}, redirect: ${redirectUrl || 'none'}`);
    } catch (parseError) {
      console.error("❌ Error parsing request body:", parseError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid request format" 
      }), { 
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    
    if (!email || !password) {
      console.error("❌ Missing required fields");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Email and password are required" 
      }), { 
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // Use mock authentication for debugging
    if (USE_MOCK_AUTH) {
      console.log("🔒 Using mock authentication");
      const mockResult = await mockAuth.login(email, password);
      
      if (!mockResult.success) {
        console.error(`❌ Mock login failed:`, mockResult.error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: mockResult.error 
        }), { 
          status: 401,
          headers: {
            "Content-Type": "application/json"
          }
        });
      }

      console.log("✅ Mock login successful for:", email);
      
      // Set mock cookies to simulate logged in state
      cookies.set('mock-auth-token', 'mock-token-value', {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });
      
      // Support direct redirects
      if (redirectUrl && request.headers.get('accept')?.includes('text/html')) {
        console.log("🔄 Redirecting to:", redirectUrl);
        return redirect(redirectUrl);
      }

      // Return success response with user information
      return new Response(JSON.stringify({ 
        success: true,
        user: mockResult.user,
        redirectUrl: redirectUrl || '/dashboard' // Include redirect URL in response
      }), { 
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    
    // Create Supabase server client - Wrap in try/catch to handle any initialization errors
    console.log("Creating Supabase server client");
    let supabase;
    try {
      supabase = createSupabaseServerClient({ cookies, headers: request.headers });
    } catch (error) {
      console.error("❌ Failed to create Supabase client:", error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Authentication service initialization failed" 
      }), { 
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // Attempt login - Always use try/catch to handle Supabase errors
    console.log("Calling Supabase auth.signInWithPassword");
    let data, error;
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      data = result.data;
      error = result.error;
      
      // Important: Log the session data to verify it was created
      console.log("Session created:", !!data.session, "User authenticated:", !!data.user);
      
      // If successful, explicitly set the access token cookie for client-side access
      if (data.session) {
        // The ssr client should automatically handle setting cookies,
        // but we can log to confirm this is happening
        console.log("Auth cookies set automatically by Supabase SSR client");
      }
    } catch (supabaseError) {
      console.error("❌ Supabase login error:", supabaseError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Authentication service error" 
      }), { 
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    if (error) {
      console.error(`Login failed:`, error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), { 
        status: 401,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    console.log("Login successful for:", email);
    
    // IMPORTANT: For API requests, NEVER redirect - just return JSON
    // Only redirect for form submissions that accept HTML responses
    if (redirectUrl && request.headers.get('accept')?.includes('text/html')) {
      console.log("Redirecting to:", redirectUrl);
      return redirect(redirectUrl);
    }

    // Return success response with user information
    return new Response(JSON.stringify({ 
      success: true,
      redirectUrl: redirectUrl || '/dashboard',
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0]
      } : null
    }), { 
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    // Make sure we always return JSON, even for unexpected errors
    console.error("❌ Unexpected error during login:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "An unexpected error occurred during login" 
    }), { 
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
