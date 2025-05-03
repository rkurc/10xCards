import type { MiddlewareHandler } from 'astro';
import { createSupabaseClient } from './db/supabase.service';
import { env, validateEnvironment } from './config/environment';
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

// Declare global variable to track environment validation
declare global {
  // eslint-disable-next-line no-var
  var __ENV_VALIDATED__: boolean;
}

export const onRequest: MiddlewareHandler = async ({ locals, request }, next) => {
  try {
    // Validate environment on first request in development
    if (env.isDevelopment && !global.__ENV_VALIDATED__) {
      validateEnvironment();
      global.__ENV_VALIDATED__ = true;
    }
    
    // Get auth token from request
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1];
    
    // Create Supabase client with or without auth token
    locals.supabase = createSupabaseClient(token);
    
    // Extract user from token if present
    if (token) {
      const { data, error } = await locals.supabase.auth.getUser(token);
      
      if (data.user && !error) {
        locals.user = data.user;
      }
    }
    
    // Check for session cookie if no token provided
    if (!token) {
      const { data, error } = await locals.supabase.auth.getSession();
      
      if (data.session && !error) {
        locals.user = data.session.user;
      }
    }
    
    // Add helper to check authentication
    locals.isAuthenticated = !!locals.user;
    
    // Log for development
    if (env.isDevelopment) {
      console.log(`Request to ${request.url}${locals.user ? ` (authenticated as ${locals.user.email})` : ' (unauthenticated)'}`);
    }
  } catch (error) {
    console.error('Middleware initialization error:', error);
  }
  
  return next();
};
