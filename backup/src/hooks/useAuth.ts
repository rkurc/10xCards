/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Use useDirectAuth from @/hooks/useDirectAuth directly instead.
 *
 * This is a temporary compatibility layer to facilitate migration from context-based auth to store-based auth.
 */
import { useDirectAuth } from "./useDirectAuth";
import type { User, LoginResult } from "../types/auth.types";
import { useEffect } from "react";

/**
 * A wrapper hook that forwards auth operations to useDirectAuth while maintaining
 * compatibility with the old AuthContext interface. This facilitates a smooth
 * migration from context-based auth to store-based auth.
 */
export function useAuth() {
  const {
    user,
    loading,
    authLoading,
    isAuthenticated,
    login: directLogin,
    register: directRegister,
    logout: directLogout,
    resetPassword: directResetPassword,
    updatePassword: directUpdatePassword,
    updateProfile: directUpdateProfile,
  } = useDirectAuth();

  // Error handling state
  const error: Error | null = null;

  // Logging to track migration progress (will be removed in cleanup phase)
  useEffect(() => {
    // TODO: Add any necessary side effects based on auth state changes
    console.debug("[Auth Debug]", {
      hasUser: !!user,
      loading,
      authLoading,
    });
  }, [user, loading, authLoading]);

  /**
   * Login handler that maintains API compatibility with AuthContext
   */
  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      return await directLogin(email, password);
    } catch (err) {
      console.error("[DEBUG] useAuth.login error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to login",
      };
    }
  };

  /**
   * Register handler that maintains API compatibility with AuthContext
   */
  const register = async (email: string, password: string, options?: { name?: string }) => {
    try {
      return await directRegister(email, password, options);
    } catch (err) {
      console.error("[DEBUG] useAuth.register error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to register",
      };
    }
  };

  /**
   * Logout handler that maintains API compatibility with AuthContext
   */
  const logout = async (): Promise<void> => {
    try {
      await directLogout();
    } catch (err) {
      console.error("[DEBUG] useAuth.logout error:", err);
      throw err;
    }
  };

  /**
   * Reset password handler that maintains API compatibility with AuthContext
   */
  const resetPassword = async (email: string) => {
    try {
      return await directResetPassword(email);
    } catch (err) {
      console.error("[DEBUG] useAuth.resetPassword error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to reset password",
      };
    }
  };

  return {
    user,
    loading: loading || authLoading, // Combine loading states for compatibility
    error, // Always null for now as errors are handled in individual functions
    login,
    register,
    logout,
    resetPassword,
    isAuthenticated, // Additional convenience property from direct auth
  };
}
