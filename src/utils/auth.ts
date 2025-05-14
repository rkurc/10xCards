import type { AstroGlobal } from "astro";
import { createSupabaseServerClient } from "../lib/supabase.server";

export interface User {
  id: string;
  name?: string;
  email: string;
}

export async function checkAuth(Astro?: AstroGlobal): Promise<User | null> {
  // If we have already user in locals, use it
  if (Astro?.locals.user) {
    return Astro.locals.user;
  }

  // If Astro is provided, use it to create a Supabase client
  if (Astro) {
    const supabase = createSupabaseServerClient({
      cookies: Astro.cookies,
      headers: Astro.request.headers,
    });

    try {
      // SECURE: Always use getUser() which verifies with the auth server
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.debug("Auth error:", error.message);
        return null;
      }

      if (!user) {
        return null;
      }

      // If we got this far, user.email should exist, but handle it safely
      if (!user.email) {
        throw new Error("User email is required but not provided");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split("@")[0],
      };
    } catch (error) {
      console.error("Unexpected error during auth check:", error);
      return null;
    }
  }

  return null;
}
