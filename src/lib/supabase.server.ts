import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "../types/database.types";

// Enhance security by using secure, httpOnly cookies
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  // Use secure cookies only in production to allow local development
  secure: import.meta.env.PROD,
  httpOnly: true, // Prevent JavaScript access to mitigate XSS attacks
  sameSite: "lax", // Changed from 'strict' to 'lax' to help with redirects
  maxAge: 7 * 24 * 60 * 60, // Set 7-day expiry for predictable session duration
};

// Helper function to parse cookie header
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  const cookies = cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });

  return cookies;
}

export const createSupabaseServerClient = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions,
      cookies: {
        get(name) {
          try {
            const value = context?.cookies?.get(name)?.value;

            return value ?? "";
          } catch (error) {
            console.error(`[DEBUG] cookie.get: Error reading cookie ${name}:`, error);
            return "";
          }
        },
        set(name, value, options) {
          try {
            context?.cookies?.set(name, value, options);
          } catch (error) {
            console.error(`[DEBUG] cookie.set: Error setting cookie ${name}:`, error);
          }
        },
        remove(name, options) {
          try {
            context?.cookies?.delete(name, options);
          } catch (error) {
            console.error(`[DEBUG] cookie.remove: Error removing cookie ${name}:`, error);
          }
        },
        getAll() {
          try {
            const cookieHeader = context?.headers?.get("Cookie") ?? "";
            const cookies = parseCookieHeader(cookieHeader);
            return cookies;
          } catch (error) {
            console.error("[DEBUG] cookie.getAll: Error getting cookies:", error);
            return [];
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet?.forEach(({ name, value, ...options }) => {
              context?.cookies?.set(name, value, options);
            });
          } catch (error) {
            console.error("[DEBUG] cookie.setAll: Error setting multiple cookies:", error);
          }
        },
      },
      detectSessionInUrl: false,
    }
  );

  return supabase;
};
