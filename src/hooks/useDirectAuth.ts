import { useState, useEffect, useCallback } from "react";
import {
  authStore,
  getCurrentUser,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  resetPassword as authResetPassword,
  updatePassword as authUpdatePassword,
  updateProfile as authUpdateProfile,
  type LoginResult,
  type RegisterResult,
  type PasswordResetResult,
  type UpdateProfileResult,
} from "@/services/auth.direct";
import type { User } from "@/types/auth.types";
import { toast } from "sonner";

/**
 * React hook for accessing authentication state without context
 * Works with the auth.direct.ts auth store
 */
export function useDirectAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    // First try to get user from store immediately
    if (authStore) {
      const currentUser = authStore.getCurrentUser();
      if (currentUser !== null) {
        setUser(currentUser);
        setLoading(false);
      }

      // Then subscribe to changes
      const unsubscribe = authStore.subscribe((updatedUser) => {
        setUser(updatedUser);
        setLoading(false);
      });

      return unsubscribe;
    } else {
      // Fallback in case authStore isn't available
      getCurrentUser().then((fetchedUser) => {
        setUser(fetchedUser);
        setLoading(false);
      });
    }
  }, []);

  // Login function with UI feedback
  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    setAuthLoading(true);
    try {
      const result = await authLogin(email, password);

      if (result.success) {
        toast.success("Logowanie udane");
      } else if (result.error) {
        toast.error(result.error);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Wystąpił błąd podczas logowania";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Register function with UI feedback
  const register = useCallback(
    async (email: string, password: string, options?: { name?: string }): Promise<RegisterResult> => {
      setAuthLoading(true);
      try {
        const result = await authRegister(email, password, options);

        if (result.success) {
          if (result.requiresEmailConfirmation) {
            toast.success("Rejestracja udana. Sprawdź swoją skrzynkę email, aby potwierdzić konto.");
          } else {
            toast.success("Rejestracja udana.");
          }
        } else if (result.error) {
          toast.error(result.error);
        }

        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Wystąpił błąd podczas rejestracji";
        toast.error(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  // Logout function with UI feedback
  const logout = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true);
    try {
      await authLogout();
      toast.success("Wylogowano pomyślnie");
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Wystąpił błąd podczas wylogowywania";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Reset password function with UI feedback
  const resetPassword = useCallback(async (email: string): Promise<PasswordResetResult> => {
    setAuthLoading(true);
    try {
      const result = await authResetPassword(email);

      if (result.success) {
        toast.success("Instrukcje resetowania hasła zostały wysłane na Twój adres email.");
      } else if (result.error) {
        toast.error(result.error);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Wystąpił błąd podczas resetowania hasła";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Update password function with UI feedback
  const updatePassword = useCallback(async (password: string): Promise<PasswordResetResult> => {
    setAuthLoading(true);
    try {
      const result = await authUpdatePassword(password);

      if (result.success) {
        toast.success("Hasło zostało zaktualizowane.");
      } else if (result.error) {
        toast.error(result.error);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Wystąpił błąd podczas aktualizacji hasła";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Update profile function with UI feedback
  const updateProfile = useCallback(async (profile: { name?: string }): Promise<UpdateProfileResult> => {
    setAuthLoading(true);
    try {
      const result = await authUpdateProfile(profile);

      if (result.success) {
        toast.success("Profil został zaktualizowany.");
      } else if (result.error) {
        toast.error(result.error);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Wystąpił błąd podczas aktualizacji profilu";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    authLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
  };
}
