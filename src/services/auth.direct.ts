import { createBrowserSupabaseClient } from "../lib/supabase.client";
import type { User } from "../types/auth.types";

// Login result interface
export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

/**
 * Direct login function that handles authentication with Supabase
 * No context dependency, suitable for use in Astro islands
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  if (typeof window === 'undefined') {
    console.warn('Login called on server side - this should only be called client-side');
    return { success: false, error: "Authentication service unavailable in server environment" };
  }
  
  // Create a fresh supabase client for this request
  const supabase = createBrowserSupabaseClient();
  
  try {
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Handle authentication errors
    if (error) {
      return { success: false, error: error.message };
    }

    // Verify we have user data
    if (!data?.user) {
      return { success: false, error: "No user data returned from authentication service" };
    }

    // Return successful result
    return { 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
      }
    };
  } catch (error) {
    // Handle unexpected errors
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unexpected authentication error" 
    };
  }
}

/**
 * Log out the current user
 */
export async function logout(): Promise<{success: boolean; error?: string}> {
  if (typeof window === 'undefined') {
    return { success: false, error: "Logout service unavailable in server environment" };
  }
  
  const supabase = createBrowserSupabaseClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unexpected logout error" 
    };
  }
}

/**
 * Get the current authenticated user
 * Can be used both client and server side (but returns different promises)
 */
export async function getCurrentUser(): Promise<User | null> {
  // Client-side implementation
  if (typeof window !== 'undefined') {
    const supabase = createBrowserSupabaseClient();
    
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        return null;
      }
      
      return {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }
  
  // Server-side: This will always return null since we shouldn't call this on server
  return null;
}