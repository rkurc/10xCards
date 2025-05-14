import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase.server";

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client
    const supabase = createSupabaseServerClient({
      cookies,
      headers: request.headers,
    });

    // Check session and user state (without exposing sensitive data)
    const { data: sessionData } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();

    // Prepare sanitized response
    const authState = {
      hasSession: !!sessionData?.session,
      sessionExpires: sessionData?.session?.expires_at
        ? new Date(sessionData.session.expires_at * 1000).toISOString()
        : null,
      hasUser: !!userData?.user,
      userEmail: userData?.user?.email
        ? userData.user.email.substring(0, 3) + "***" + userData.user.email.split("@")[1]
        : null,
      userId: userData?.user?.id ? userData.user.id.substring(0, 6) + "***" : null,
      authState: {
        authenticated: !!userData?.user,
        emailConfirmed: userData?.user?.email_confirmed_at ? true : false,
      },
    };

    return new Response(
      JSON.stringify({
        success: true,
        authState,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
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
