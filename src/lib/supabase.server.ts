import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { Database } from '../types/database.types';

// Enhance security by using secure, httpOnly cookies
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: true, // Prevent exposure over non-HTTPS connections
  httpOnly: true, // Prevent JavaScript access to mitigate XSS attacks
  sameSite: 'strict', // Protect against CSRF attacks
  maxAge: 7 * 24 * 60 * 60, // Set 7-day expiry for predictable session duration
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
        // Follow Supabase SSR best practices to avoid cookie conflicts
        getAll() {
          return parseCookieHeader(context.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options),
          );
        },
      },
      // Enable automatic token refresh for seamless user experience
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    },
  );

  return supabase;
};
