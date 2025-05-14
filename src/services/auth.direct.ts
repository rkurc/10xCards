import { createBrowserSupabaseClient } from "../lib/supabase.client";
import type { User } from "../types/auth.types";

// Login result interface
export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

// Registration result interface
export interface RegisterResult {
  success: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
  user?: User;
}

// Profile update result interface
export interface UpdateProfileResult {
  success: boolean;
  error?: string;
  user?: User;
}

// Password reset result interface
export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

/**
 * Direct login function that handles authentication with Supabase
 * No context dependency, suitable for use in Astro islands
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  if (typeof window === "undefined") {
    console.warn("Login called on server side - this should only be called client-side");
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
        email: data.user.email || "",
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
      },
    };
  } catch (error) {
    // Handle unexpected errors
    console.error("Login error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected authentication error",
    };
  }
}

/**
 * Register a new user without context dependency
 * @param email User email
 * @param password User password
 * @param options Additional user data like name
 */
export async function register(email: string, password: string, options?: { name?: string }): Promise<RegisterResult> {
  if (typeof window === "undefined") {
    return { success: false, error: "Registration service unavailable in server environment" };
  }

  const supabase = createBrowserSupabaseClient();

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
      return {
        success: true,
        user: data.user
          ? {
              id: data.user.id,
              email: data.user.email || "",
              name: options?.name || data.user.email?.split("@")[0] || "User",
            }
          : undefined,
      };
    } else {
      return {
        success: true,
        requiresEmailConfirmation: true,
      };
    }
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected registration error",
    };
  }
}

/**
 * Log out the current user
 */
export async function logout(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") {
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
      error: error instanceof Error ? error.message : "Unexpected logout error",
    };
  }
}

/**
 * Get the current authenticated user
 * Can be used both client and server side (but returns different promises)
 */
export async function getCurrentUser(): Promise<User | null> {
  // Client-side implementation
  if (typeof window !== "undefined") {
    const supabase = createBrowserSupabaseClient();

    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  // Server-side: This will always return null since we shouldn't call this on server
  return null;
}

/**
 * Update user profile information
 * @param profile Profile data to update
 */
export async function updateProfile(profile: Partial<User>): Promise<UpdateProfileResult> {
  if (typeof window === "undefined") {
    return { success: false, error: "Profile update service unavailable in server environment" };
  }

  const supabase = createBrowserSupabaseClient();

  try {
    const { data, error } = await supabase.auth.updateUser({
      data: profile,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "No user data returned after update" };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
      },
    };
  } catch (error) {
    console.error("Profile update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected profile update error",
    };
  }
}

/**
 * Initiate password reset for a user
 * @param email User email
 */
export async function resetPassword(email: string): Promise<PasswordResetResult> {
  if (typeof window === "undefined") {
    return { success: false, error: "Password reset service unavailable in server environment" };
  }

  const supabase = createBrowserSupabaseClient();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected password reset error",
    };
  }
}

/**
 * Complete password reset/update with a new password
 * @param password New password
 */
export async function updatePassword(password: string): Promise<PasswordResetResult> {
  if (typeof window === "undefined") {
    return { success: false, error: "Password update service unavailable in server environment" };
  }

  const supabase = createBrowserSupabaseClient();

  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Password update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected password update error",
    };
  }
}

/**
 * Check if a user's email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const supabase = createBrowserSupabaseClient();

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return false;
    }

    // Check if email is confirmed based on Supabase user data
    return !!data.user.email_confirmed_at;
  } catch (error) {
    console.error("Email verification check error:", error);
    return false;
  }
}

/**
 * Create a lightweight auth store for tracking authentication state
 * This provides an alternative to React context for auth state
 */
type AuthStateListener = (user: User | null) => void;

export function createAuthStore() {
  let currentUser: User | null = null;
  const listeners = new Set<AuthStateListener>();

  // Initial check for current user
  getCurrentUser().then((user) => {
    currentUser = user;
    notifyListeners();
  });

  // Set up auth state change listener
  const supabase = createBrowserSupabaseClient();
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      currentUser = {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
      };
    } else {
      currentUser = null;
    }

    notifyListeners();
  });

  function notifyListeners() {
    listeners.forEach((listener) => listener(currentUser));
  }

  return {
    getCurrentUser: () => currentUser,
    subscribe: (callback: AuthStateListener) => {
      listeners.add(callback);
      callback(currentUser); // Initial call with current state

      // Return unsubscribe function
      return () => {
        listeners.delete(callback);
      };
    },
    cleanup: () => {
      data?.subscription?.unsubscribe();
      listeners.clear();
    },
  };
}

// Create a singleton instance for the app
export const authStore = typeof window !== "undefined" ? createAuthStore() : null;
