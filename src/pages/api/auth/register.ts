import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase.server';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { email, password, redirectUrl } = await request.json();

  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // For local development
      emailRedirectTo: `${new URL(request.url).origin}/auth-callback`
    }
  });

  if (error) {
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
  // and redirect if a URL was provided
  if (redirectUrl) {
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
};
