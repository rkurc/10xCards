import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase.server';

// Define endpoints that don't require authentication
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth-callback",  // Important! Add this to public paths
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/logout",
  "/api/debug/supabase-status",  // Debug endpoints should be public
  "/api/debug/auth-state",
  "/api/debug/echo",
];

// Change this value to false to use real Supabase authentication
const USE_MOCK_AUTH = false;

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
    console.log("🔒 Middleware processing request for:", url.pathname);
    
    // Check for mock auth token first if in mock mode
    if (USE_MOCK_AUTH && cookies.has('mock-auth-token')) {
      console.log("🔒 Using mock authentication in middleware");
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
      console.log("🔓 Public path, skipping auth check:", url.pathname);
      return next();
    }

    console.log("🔐 Protected path, checking auth:", url.pathname);
    
    // Get session first to ensure token refresh happens if needed
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    
    // Log session status for debugging
    console.log("🔑 Session exists:", !!session, "Session error:", !!sessionError);
    
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
      console.log("👤 User authenticated:", locals.user.email);
      return next();
    } else {
      console.log("❌ No authenticated user, redirecting to login");
      // Ensure unauthenticated users are redirected with return path for seamless post-login experience
      const returnUrl = encodeURIComponent(url.pathname + url.search);
      return redirect(`/login?redirect=${returnUrl}`);
    }
  }
);
