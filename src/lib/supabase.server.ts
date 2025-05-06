import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "../types/database.types";

// Enhance security by using secure, httpOnly cookies
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  // Use secure cookies only in production to allow local development
  secure: false, // Temporarily disable secure flag for debugging
  httpOnly: true, // Prevent JavaScript access to mitigate XSS attacks
  sameSite: "lax", // Changed from 'strict' to 'lax' to help with redirects
  maxAge: 7 * 24 * 60 * 60, // Set 7-day expiry for predictable session duration
};

// Helper function to parse cookie header
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  console.log("[DEBUG] Parsing cookie header:", cookieHeader ? cookieHeader.substring(0, 30) + "..." : "empty");

  if (!cookieHeader) {
    return [];
  }

  try {
    const cookies = cookieHeader.split(";").map((cookie) => {
      const [name, ...rest] = cookie.trim().split("=");
      return { name, value: rest.join("=") };
    });

    console.log("[DEBUG] Parsed cookies count:", cookies.length);
    return cookies;
  } catch (error) {
    console.error("[DEBUG] Error parsing cookie header:", error);
    return [];
  }
}

export const createSupabaseServerClient = (context: { headers: Headers; cookies: AstroCookies }) => {
  console.log("[DEBUG] Creating Supabase server client...");
  console.log("[DEBUG] Environment variables available:", {
    supabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  });

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
            return "";
          }
        },
        set(name, value, options) {
          try {
            console.log(`[DEBUG] cookie.set: Setting cookie '${name}' with options:`, options);
            context?.cookies?.set(name, value, options);
            console.log(`[DEBUG] cookie.set: Cookie '${name}' set successfully`);
          } catch (error) {
            console.error(`[DEBUG] cookie.set: Error setting cookie ${name}:`, error);
          }
        },
        remove(name, options) {
          try {
            console.log(`[DEBUG] cookie.remove: Removing cookie '${name}'`);
            context?.cookies?.delete(name, options);
            console.log(`[DEBUG] cookie.remove: Cookie '${name}' removed successfully`);
          } catch (error) {
            console.error(`[DEBUG] cookie.remove: Error removing cookie ${name}:`, error);
          }
        },
        getAll() {
          try {
            console.log("[DEBUG] cookie.getAll: Getting all cookies from header");
            const cookieHeader = context?.headers?.get("Cookie") ?? "";
            const cookies = parseCookieHeader(cookieHeader);
            console.log("[DEBUG] cookie.getAll: Cookies found:", cookies.map((c) => c.name).join(", "));
            return cookies;
          } catch (error) {
            console.error("[DEBUG] cookie.getAll: Error getting cookies:", error);
            return [];
          }
        },
        setAll(cookiesToSet) {
          try {
            console.log("[DEBUG] cookie.setAll: Setting multiple cookies:", cookiesToSet.map((c) => c.name).join(", "));
            cookiesToSet?.forEach(({ name, value, ...options }) => {
              context?.cookies?.set(name, value, options);
            });
            console.log("[DEBUG] cookie.setAll: All cookies set successfully");
          } catch (error) {
            console.error("[DEBUG] cookie.setAll: Error setting multiple cookies:", error);
          }
        },
      },
      detectSessionInUrl: false,
    }
  );

  console.log("[DEBUG] Supabase server client created successfully");
  return supabase;
};
