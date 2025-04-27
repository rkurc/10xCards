import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase.server';

// Define endpoints that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth-callback",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/logout",
];

// Change this value to false to use real Supabase authentication
const USE_MOCK_AUTH = false;

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    console.debug("Processing request for:", url.pathname);
    
    // Check for mock auth token first if in mock mode
    if (USE_MOCK_AUTH && cookies.has('mock-auth-token')) {
      locals.user = {
        id: "mock-user-id",
        email: "test@example.com",
        name: "Test User"
      };
      return next();
    }

    // Initialize Supabase for each request to ensure fresh auth state
    const supabase = createSupabaseServerClient({
      cookies,
      headers: request.headers,
    });
    
    // Make Supabase available throughout the request lifecycle
    locals.supabase = supabase;
    
    // Allow public access to certain paths without authentication
    const isPublicPath = PUBLIC_PATHS.some(path => 
      url.pathname === path || url.pathname.startsWith(`${path}/`)
    );
    
    // Skip auth checks for public paths to avoid unnecessary redirects
    if (isPublicPath) {
      return next();
    }

    // SECURE: Always use getUser() which verifies with the auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Handle auth errors
    if (userError) {
      console.debug("Auth error:", userError.message);
      
      // Clear invalid auth state to force re-authentication
      await supabase.auth.signOut();
      
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(url.pathname + url.search);
      return redirect(`/login?redirect=${returnUrl}`);
    }
    
    // Proceed with valid authentication
    if (user) {
      // Make user data available throughout the request lifecycle
      locals.user = {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split('@')[0],
      };
      return next();
    } else {
      // Ensure unauthenticated users are redirected with return path
      const returnUrl = encodeURIComponent(url.pathname + url.search);
      return redirect(`/login?redirect=${returnUrl}`);
    }
  }
);
