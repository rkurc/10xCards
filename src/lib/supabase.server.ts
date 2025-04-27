import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { Database } from '../types/database.types';

// Zwiększamy bezpieczeństwo cookie - wymuszamy secure i httpOnly
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: true, // Wymusza protokół HTTPS
  httpOnly: true, // Zapobiega dostępowi przez JavaScript
  sameSite: 'strict', // Dodatkowa ochrona przed CSRF
  maxAge: 7 * 24 * 60 * 60, // 7 dni, określamy jednoznaczny czas życia cookies
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

export const createSupabaseServerClient = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions,
      cookies: {
        // Używamy tylko getAll i setAll zgodnie z zaleceniami @supabase/ssr
        getAll() {
          return parseCookieHeader(context.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options),
          );
        },
      },
      // Dodajemy automatyczne odświeżanie tokenów
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    },
  );

  return supabase;
};
