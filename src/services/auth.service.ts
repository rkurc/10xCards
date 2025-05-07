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
 * Service for handling authentication operations using Supabase directly
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

      if (data.user) {
        const userData = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
        };

        return { success: true, user: userData };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Wystąpił błąd podczas logowania." };
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
    } catch (error) {
      return { success: false, error: "An error occurred during registration." };
    }
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      if (this.supabase) {
        await this.supabase.auth.signOut();
      }
    } catch (error) {
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
   * Get the current user
   * @returns The current authenticated user or null
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      if (!this.supabase) {
        return null;
      }

      const { data, error } = await this.supabase.auth.getUser();
      
      if (error || !data.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || data.user.email?.split("@")[0],
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify if the user is authenticated
   * @returns Promise that resolves to true if authenticated, false otherwise
   */
  async verifyAuthentication(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }
}