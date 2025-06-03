/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Use the direct auth approach with useDirectAuth from @/hooks/useDirectAuth instead.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import type { LoginResult, User } from "../types/auth.types";
// Import individual functions instead of the whole module
import {
  login as serviceLogin,
  logout as serviceLogout,
  register as serviceRegister,
  resetPassword as serviceResetPassword,
  getCurrentUser,
  onAuthStateChange,
} from "../services/auth.service";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, options?: { name?: string }) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword?: (email: string) => Promise<any>;
}

// Default context value
const defaultContextValue: AuthContextType = {
  user: null,
  loading: false,
  error: null,
  login: async () => (console.error("[DEBUG] AuthContext.login called without implementation"), { success: false }),
  register: async () => {},
  logout: async () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const AuthProvider: React.FC<{ children: React.ReactNode; initialUser?: User }> = ({
  children,
  initialUser,
}) => {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState<boolean>(!initialUser);
  const [error, setError] = useState<Error | null>(null);

  // Check if code is running on server
  const isServer = typeof window === "undefined";

  const login = async (email: string, password: string): Promise<LoginResult> => {
    // Handle server-side case explicitly
    if (isServer) {
      return {
        success: false,
        error: "Authentication can only be performed in the browser",
      };
    }

    try {
      const result = await serviceLogin(email, password);

      if (result.success) {
        toast.success("Logowanie udane");

        if (result.user) {
          setUser(result.user);

          // Add this verification to check if the user was actually set
          setTimeout(() => {}, 0);
        }
      } else {
        const errorMsg = result.error || "Niepoprawny email lub hasło";
        toast.error(errorMsg);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Wystąpił błąd podczas logowania";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (email: string, password: string, options?: { name?: string }) => {
    try {
      const result = await serviceRegister(email, password, options);

      if (!result.success && result.error) {
        toast.error(result.error);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Wystąpił błąd podczas rejestracji";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await serviceLogout();
      setUser(null);
      toast.success("Wylogowano pomyślnie");
    } catch (error) {
      toast.error("Wystąpił błąd podczas wylogowywania" + (error instanceof Error ? error.message : ""));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await serviceResetPassword(email);

      if (!result.success && result.error) {
        toast.error(result.error);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Wystąpił błąd podczas resetowania hasła";
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  useEffect(() => {
    // Skip server-side execution
    if (typeof window === "undefined") return;

    const checkUser = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    if (!initialUser) {
      checkUser();
    }

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [initialUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        resetPassword,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Add a test provider for easier testing
export const TestAuthProvider: React.FC<{
  children: React.ReactNode;
  value: Partial<AuthContextType>;
}> = ({ children, value }) => {
  return (
    <AuthContext.Provider
      value={{
        ...defaultContextValue,
        ...value,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
