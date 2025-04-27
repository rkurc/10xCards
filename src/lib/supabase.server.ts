import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import type { Database } from '../types/database.types';

// Enhance security by using secure, httpOnly cookies
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  // Use secure cookies only in production to allow local development
  secure: import.meta.env.PROD, 
  httpOnly: true, // Prevent JavaScript access to mitigate XSS attacks
  sameSite: 'lax', // Changed from 'strict' to 'lax' to help with redirects
  maxAge: 7 * 24 * 60 * 60, // Set 7-day expiry for predictable session duration
};

// Helper function to parse cookie header
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
        get(name) {
          const value = context.cookies.get(name)?.value;
          return value ?? '';
        },
        set(name, value, options) {
          // Log cookie operations for debugging
          console.log(`Setting cookie: ${name} (expiry: ${options?.maxAge || 'session'})`);
          context.cookies.set(name, value, options);
        },
        remove(name, options) {
          console.log(`Removing cookie: ${name}`);
          context.cookies.delete(name, options);
        },
        // The getAll method is used by Supabase for initial cookie reading
        getAll() {
          const cookieHeader = context.headers.get('Cookie') ?? '';
          return parseCookieHeader(cookieHeader);
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
