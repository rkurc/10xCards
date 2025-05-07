import { createBrowserSupabaseClient } from "../lib/supabase.client";
import type { LoginResult, RegisterResult, User } from "../types/auth.types";

// Don't create the Supabase client as a module-level variable
// Instead create it inside each function when needed
console.log(`[DEBUG] auth.service: Module loaded, typeof window = ${typeof window}`);

// Helper to get supabase client on demand
function getSupabaseClient() {
  if (typeof window === 'undefined') {
    console.log('[DEBUG] getSupabaseClient: Running server-side, returning null');
    return null;
  }
  
  console.log('[DEBUG] getSupabaseClient: Running client-side, creating client');
  const client = createBrowserSupabaseClient();
  return client;
}

/**
 * Login a user with email and password
 * @param email User email
 * @param password User password
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  console.log('[DEBUG] authService.login CALLED for email:', email);
  
  // Get client on demand instead of using module-level variable
  const supabase = getSupabaseClient();
  console.log('[DEBUG] authService.login supabase available:', !!supabase);
  
  if (!supabase) {
    console.error('[DEBUG] authService.login error: Supabase client not available (window not defined)');
    return { success: false, error: "Authentication service unavailable in server environment" };
  }

  try {
    console.log('[DEBUG] authService.login calling supabase.auth.signInWithPassword');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('[DEBUG] authService.login Supabase error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.user) {
      console.error('[DEBUG] authService.login error: No user data returned');
      return { success: false, error: "No user data returned from authentication" };
    }

    // Create user data object
    const userData = {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
    };

    console.log('[DEBUG] authService.login successful');
    return { success: true, user: userData };
  } catch (error) {
    console.error('[DEBUG] authService.login unhandled exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Wystąpił błąd podczas logowania." 
    };
  }
}

/**
 * Register a new user
 * @param email User email
 * @param password User password
 * @param options Additional user data
 */
export async function register(email: string, password: string, options?: { name?: string }): Promise<RegisterResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Authentication service unavailable" };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options,
        emailRedirectTo: `${window.location.origin}/auth-callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Check if email confirmation is required
    if (data.session) {
      return { success: true };
    } else {
      return {
        success: true,
        requiresEmailConfirmation: true,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Wystąpił błąd podczas rejestracji.",
    };
  }
}

/**
 * Log out the current user
 */
export async function logout(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

/**
 * Reset password for a user
 * @param email User email
 */
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Authentication service unavailable" };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Wystąpił błąd podczas resetowania hasła.",
    };
  }
}

/**
 * Update password with a reset token
 * @param password New password
 */
export async function updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: "Authentication service unavailable" };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Wystąpił błąd podczas aktualizacji hasła.",
    };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

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

/**
 * Verify if the user is authenticated
 */
export async function verifyAuthentication(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    return false;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): (() => void) | undefined {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.name || session.user.email?.split("@")[0],
      });
    } else {
      callback(null);
    }
  });

  return data.subscription.unsubscribe;
}
