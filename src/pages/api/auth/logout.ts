import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase.server';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Create Supabase server client
  const supabase = createSupabaseServerClient({
    cookies,
    headers: request.headers,
  });

  // Sign out user - this will clear Supabase auth cookies
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Redirect to home page after successful logout
  return redirect('/');
};
