import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase.server';

// Define endpoints that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/logout",
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
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

    // Get session first to ensure token refresh happens if needed
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    
    // Handle session errors to prevent invalid authentication states
    if (sessionError) {
      console.error("Session error:", sessionError);
      
      // Clear invalid auth state to force re-authentication
      await supabase.auth.signOut();
      
      // Redirect to login with return URL for better user experience
      const returnUrl = encodeURIComponent(url.pathname + url.search);
      return redirect(`/login?redirect=${returnUrl}`);
    }
    
    // Proceed with valid session
    if (session?.user) {
      // Make user data available throughout the request lifecycle
      locals.user = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
      };
      return next();
    } else {
      // Ensure unauthenticated users are redirected with return path for seamless post-login experience
      const returnUrl = encodeURIComponent(url.pathname + url.search);
      return redirect(`/login?redirect=${returnUrl}`);
    }
  }
);
