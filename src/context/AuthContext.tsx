import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthService, LoginResult } from "../services/auth.service";
import { createBrowserSupabaseClient } from "../lib/supabase.client";
import { toast } from "sonner";

export type User = {
  id: string;
  name?: string;
  email: string;
};

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, options?: { name?: string }) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword?: (email: string) => Promise<any>;
};

// Provide a default empty context value to avoid the undefined error
const defaultContextValue: AuthContextType = {
  user: null,
  loading: false,
  error: null,
  login: async () => ({ success: false }),
  register: async () => {},
  logout: async () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const AuthProvider: React.FC<{ children: React.ReactNode; initialUser?: User }> = ({
  children,
  initialUser,
}) => {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState<Error | null>(null);

  // Only create services in browser environment
  const authService = typeof window !== "undefined" ? new AuthService(createBrowserSupabaseClient()) : null;

  useEffect(() => {
    // Skip server-side execution
    if (typeof window === "undefined" || !authService) return;

    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking auth status:", error);
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    if (!initialUser) {
      checkUser();
    }

    // Listen for auth changes if Supabase client is available
    if (authService?.supabase) {
      const {
        data: { subscription },
      } = authService.supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email?.split("@")[0],
          });
        } else {
          setUser(null);
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }
  }, [initialUser]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    if (!authService) {
      return { success: false, error: "Authentication service unavailable" };
    }

    const result = await authService.login(email, password);
    
    if (result.success) {
      toast.success("Logowanie udane");
    }
    
    return result;
  };

  const register = async (email: string, password: string, options?: { name?: string }) => {
    if (!authService) {
      return { success: false, error: "Authentication service unavailable" };
    }

    return await authService.register(email, password, options);
  };

  const logout = async () => {
    if (!authService) return;
    
    try {
      await authService.logout();
      toast.success("Wylogowano pomyślnie");
    } catch (error) {
      toast.error("Wystąpił błąd podczas wylogowywania");
      console.error("Logout error:", error);
    }
  };

  const resetPassword = async (email: string) => {
    if (!authService) {
      return { success: false, error: "Authentication service unavailable" };
    }

    return await authService.resetPassword(email);
  };

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
