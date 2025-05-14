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
  if (!cookieHeader) {
    return [];
  }

  const cookies = cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });

  return cookies;
}

interface CookieToSet {
  name: string;
  value: string;
  [key: string]: unknown;
}

export const createSupabaseServerClient = (context: { headers: Headers; cookies: AstroCookies }) => {
  if (!import.meta.env.PUBLIC_SUPABASE_URL || !import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables");
  }

  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        "X-Client-Info": "supabase-js-server",
      },
    },
    cookies: {
      get(name) {
        try {
          return context?.cookies?.get(name)?.value ?? "";
        } catch {
          return "";
        }
      },
      set(name, value, options) {
        try {
          context?.cookies?.set(name, value, options);
        } catch {
          throw new Error(`Failed to set cookie ${name}`);
        }
      },
      remove(name, options) {
        try {
          context?.cookies?.delete(name, options);
        } catch {
          throw new Error(`Failed to remove cookie ${name}`);
        }
      },
    },
    cookieOptions,
  });
};
