import { BaseService } from "./base.service";
import type { User } from "@/context/AuthContext";
import { toast } from "sonner";

/**
 * Interface for login results
 */
export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

/**
 * Interface for registration results
 */
export interface RegisterResult {
  success: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
}

/**
 * Service for handling authentication operations
 */
export class AuthService extends BaseService {
  /**
   * Login a user with email and password
   * @param email User email
   * @param password User password
   * @returns LoginResult with success status and user data if successful
   */
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      // Use API endpoint for login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important for cookies
      });

      // Handle response
      const responseText = await response.text();
      
      if (!responseText) {
        return { success: false, error: "Empty server response" };
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        return { success: false, error: "Invalid server response format" };
      }

      if (!response.ok) {
        return { success: false, error: result.error || "Authentication failed" };
      }

      // Return success with user data if available
      if (result.user) {
        const userData = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name || result.user.email.split("@")[0],
        };

        return { success: true, user: userData };
      }
      
      return { success: true };
    } catch (error) {
      // Fall back to Supabase client if API call fails
      try {
        if (!this.supabase) {
          return { success: false, error: "Authentication service unavailable" };
        }

        const { data, error: supabaseError } = await this.supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (supabaseError) {
          return { success: false, error: supabaseError.message };
        }

        return { success: true };
      } catch (fallbackError) {
        return { success: false, error: "Wystąpił błąd podczas logowania." };
      }
    }
  }

  /**
   * Register a new user
   * @param email User email
   * @param password User password
   * @param options Additional user data
   * @returns RegisterResult with success status
   */
  async register(email: string, password: string, options?: { name?: string }): Promise<RegisterResult> {
    try {
      // Use API endpoint for registration
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          userData: options,
        }),
      });

      // Parse response
      const responseText = await response.text();
      let result;

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        return { success: false, error: "Invalid server response format" };
      }

      return {
        success: result.success,
        error: result.error,
        requiresEmailConfirmation: result.requiresEmailConfirmation,
      };
    } catch (error) {
      // Fall back to direct Supabase client
      try {
        if (!this.supabase) {
          return { success: false, error: "Authentication service unavailable" };
        }

        const { data, error: supabaseError } = await this.supabase.auth.signUp({
          email,
          password,
          options: {
            data: options,
            emailRedirectTo: `${window.location.origin}/auth-callback`,
          },
        });

        if (supabaseError) {
          return { success: false, error: supabaseError.message };
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
      } catch (fallbackError) {
        return { success: false, error: "An error occurred during registration." };
      }
    }
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      if (this.supabase) {
        await this.supabase.auth.signOut();
        toast.success("Wylogowano pomyślnie");
      }
    } catch (error) {
      toast.error("Wystąpił błąd podczas wylogowywania");
      throw error;
    }
  }

  /**
   * Reset password for a user
   * @param email User email
   * @returns Object with success status
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.supabase) {
        return { success: false, error: "Authentication service unavailable" };
      }

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Wystąpił błąd podczas resetowania hasła." };
    }
  }

  /**
   * Verify if the user is authenticated
   * @returns Promise that resolves to true if authenticated, false otherwise
   */
  async verifyAuthentication(): Promise<boolean> {
    try {
      const response = await fetch("/api/debug/auth-state");
      if (!response.ok) {
        return false;
      }
      
      const result = await response.json();
      return !!result.user;
    } catch (error) {
      return false;
    }
  }
}