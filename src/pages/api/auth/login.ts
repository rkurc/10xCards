import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase.server';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const { email, password, redirectUrl } = await request.json();

  const supabase = createSupabaseServerClient({ cookies, headers: request.headers });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
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

  // Zamiast przekazywania informacji o sukcesie, przekierowujemy bezpośrednio
  // Ta trasa będzie wykorzystywana tylko w przypadku gdy JavaScript jest wyłączony
  if (redirectUrl) {
    return redirect(redirectUrl);
  }

  return new Response(JSON.stringify({ 
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0]
    }
  }), { 
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};
