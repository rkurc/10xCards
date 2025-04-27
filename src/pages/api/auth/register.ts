import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase.server';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    console.log("🔑 API register endpoint called");

    // Parse the request body
    const { email, password, userData, redirectUrl } = await request.json();

    console.log(`🔑 Register attempt for: ${email}`);

    // Create Supabase client
    const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

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
      console.error("❌ Registration error:", error);
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
    console.log("✅ Registration successful, email confirmation required:", emailConfirmationRequired);
    
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
    // and redirect if a URL was provided
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
    console.error("❌ Unexpected registration error:", error);
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
