import type { AstroGlobal } from 'astro';
import { createSupabaseServerClient } from '../lib/supabase.server';

export interface User {
  id: string;
  name?: string;
  email: string;
}

export async function checkAuth(Astro?: AstroGlobal): Promise<User | null> {
  console.log("checkAuth called");
  
  // If we have already user in locals, use it
  if (Astro?.locals.user) {
    console.log("checkAuth: Using user from locals");
    return Astro.locals.user;
  }
  
  // If Astro is provided, use it to create a Supabase client
  if (Astro) {
    console.log("checkAuth: Creating Supabase client");
    const supabase = createSupabaseServerClient({
      cookies: Astro.cookies,
      headers: Astro.request.headers,
    });
    
    try {
      // SECURE: Always use getUser() which verifies with the auth server
      console.log("checkAuth: Securely getting user from Supabase");
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("checkAuth: Auth error:", error);
        return null;
      }
      
      if (!user) {
        console.log("checkAuth: No user found");
        return null;
      }
      
      console.log("checkAuth: User found", user.email);
      return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split('@')[0],
      };
    } catch (error) {
      console.error('checkAuth: Unexpected error:', error);
      return null;
    }
  }
  
  console.log("checkAuth: No Astro context provided, returning null");
  return null;
}
