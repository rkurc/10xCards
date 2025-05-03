import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase.server';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    console.log("[DEBUG] Login endpoint called");
    
    // Parse the request body with more robust error handling
    let email, password, redirectUrl;
    try {
      // Handle both JSON and form data requests
      const contentType = request.headers.get('content-type') || '';
      console.log("[DEBUG] Login request content type:", contentType);
      
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
    } catch (parseError) {
      console.error("[DEBUG] Error parsing request body:", parseError);
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

    // Validate required fields
    if (!email || !password) {
      console.log("[DEBUG] Missing required fields:", { hasEmail: !!email, hasPassword: !!password });
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

    // Create Supabase client
    let supabase;
    try {
      console.log("[DEBUG] Creating Supabase client");
      supabase = createSupabaseServerClient({ cookies, headers: request.headers });
    } catch (error) {
      console.error("[DEBUG] Failed to create Supabase client:", error);
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

    // Attempt login
    let data, error;
    try {
      console.log("[DEBUG] Attempting login for email:", email);
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      data = result.data;
      error = result.error;
    } catch (supabaseError) {
      console.error("[DEBUG] Supabase login error:", supabaseError);
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
      console.error(`[DEBUG] Login failed for ${email}:`, error);
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

    console.log("[DEBUG] Login successful for:", email);
    
    // Handle redirect for form submissions or return JSON for API calls
    if (request.headers.get('accept')?.includes('application/json')) {
      console.log("[DEBUG] Returning JSON response");
      return new Response(
        JSON.stringify({
          success: true,
          user: data.user
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    // Redirect after successful login
    console.log("[DEBUG] Redirecting to:", redirectUrl || '/dashboard');
    return redirect(redirectUrl || '/dashboard');
    
  } catch (error) {
    console.error("[DEBUG] Unexpected login error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    }), { 
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
