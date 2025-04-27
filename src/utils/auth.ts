import type { AstroGlobal } from 'astro';
import { createSupabaseServerClient } from '../lib/supabase.server';

export interface User {
  id: string;
  name?: string;
  email: string;
}

export async function checkAuth(Astro?: AstroGlobal): Promise<User | null> {
  // Jeśli mamy już usera w locals, użyj go
  if (Astro?.locals.user) {
    return Astro.locals.user;
  }
  
  // W przeciwnym razie użyj klienta Supabase
  if (Astro) {
    const supabase = createSupabaseServerClient({
      cookies: Astro.cookies,
      headers: Astro.request.headers,
    });
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }
      
      return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split('@')[0],
      };
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
  }
  
  // Dla kompatybilności z istniejącym kodem, gdy Astro nie jest dostępne
  return null;
}
