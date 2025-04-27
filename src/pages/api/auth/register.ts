import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase.server';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    console.debug("Register endpoint called");

    // Parse the request body
    let email, password, userData, redirectUrl;
    try {
      // Handle both JSON and form data requests
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        const body = await request.json();
        email = body.email;
        password = body.password;
        userData = body.userData;
        redirectUrl = body.redirectUrl;
      } else if (contentType.includes('application/x-www-form-urlencoded') || 
                contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        email = formData.get('email')?.toString();
        password = formData.get('password')?.toString();
        userData = formData.get('userData') ? JSON.parse(formData.get('userData')?.toString() || '{}') : {};
        redirectUrl = formData.get('redirectUrl')?.toString();
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (parseError) {
      console.error("Error parsing register request:", parseError);
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
      supabase = createSupabaseServerClient({ cookies, headers: request.headers });
    } catch (error) {
      console.error("Failed to create Supabase client:", error);
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

    // Attempt registration with metadata for user's name
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData, // This will include the name field
        emailRedirectTo: `${new URL(request.url).origin}/auth-callback`
      }
    });
    
    if (error) {
      console.error("Registration error:", error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), { 
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // Check if email confirmation is required
    const emailConfirmationRequired = !data.session;
    
    if (emailConfirmationRequired) {
      return new Response(JSON.stringify({ 
        success: true,
        requiresEmailConfirmation: true,
      }), { 
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }

    // If email confirmation is not required, immediately log the user in
    // and redirect if a URL was provided and client accepts HTML
    if (redirectUrl && request.headers.get('accept')?.includes('text/html')) {
      return redirect(redirectUrl);
    }

    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name || data.user?.email?.split('@')[0]
      }
    }), { 
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Unexpected registration error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: "An unexpected error occurred during registration" 
    }), { 
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
