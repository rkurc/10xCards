import React, { createContext, useContext, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "../lib/supabase.client";
import { toast } from "sonner";

export type User = {
  id: string;
  name?: string;
  email: string;
};

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string) => Promise<void>;
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

  // Only create Supabase client in browser environment
  const supabase = typeof window !== "undefined" ? createBrowserSupabaseClient() : null;

  useEffect(() => {
    // Skip server-side execution
    if (typeof window === "undefined" || !supabase) return;

    const checkUser = async () => {
      try {
        // SECURE: Always use getUser() which verifies with the auth server
        const {
          data: { user: supabaseUser },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.debug("Error verifying user:", error.message);
          setUser(null);
          return;
        }

        if (supabaseUser) {
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0],
          });
        }
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

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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
  }, [initialUser]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    console.log("LOGIN FUNCTION STARTED with email:", email);
    let loginResult: LoginResult = { success: false };

    try {
      if (!supabase) {
        console.error("Supabase client not available");
        loginResult = { success: false, error: "Authentication service unavailable" };
        return loginResult;
      }

      // Use direct API call
      try {
        console.log("Making fetch request to /api/auth/login");
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email, password }),
          credentials: "include", // Important for cookies
        });

        console.log("Login API response status:", response.status);

        // Handle response
        const responseText = await response.text();
        console.log("Login API raw response:", responseText);

        if (!responseText) {
          console.error("Empty response from server");
          loginResult = { success: false, error: "Empty server response" };
          return loginResult;
        }

        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", parseError);
          loginResult = { success: false, error: "Invalid server response format" };
          return loginResult;
        }

        if (!response.ok) {
          loginResult = { success: false, error: result.error || "Authentication failed" };
          return loginResult;
        }

        // Update user state if we have user data
        if (result.user) {
          const userData = {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name || result.user.email.split("@")[0],
          };

          console.log("Setting user state with:", userData);
          setUser(userData);
          loginResult = { success: true, user: userData };
        } else {
          console.log("Login successful but no user data returned");
          loginResult = { success: true };
        }

        return loginResult;
      } catch (apiError) {
        console.error("API login error, falling back to Supabase client:", apiError);

        // Fallback to Supabase client
        console.log("Attempting direct Supabase login");
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Supabase login error:", error);
          loginResult = { success: false, error: error.message };
          return loginResult;
        }

        console.log("Supabase login successful");
        loginResult = { success: true };
        return loginResult;
      }
    } catch (error) {
      console.error("Unhandled login error:", error);
      loginResult = { success: false, error: "Wystąpił błąd podczas logowania." };
      return loginResult;
    } finally {
      console.log("LOGIN FUNCTION COMPLETED with result:", loginResult);
    }
  };

  const register = async (email: string, password: string, options?: { name?: string }) => {
    try {
      // Use API endpoint for registration
      try {
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
          console.error("Failed to parse response as JSON");
          return { success: false, error: "Invalid server response format" };
        }

        return {
          success: result.success,
          error: result.error,
          requiresEmailConfirmation: result.requiresEmailConfirmation,
        };
      } catch (apiError) {
        console.debug("API registration error, falling back to direct Supabase");

        // Fallback to direct Supabase client
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
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "An error occurred during registration." };
    }
  };

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
        toast.success("Wylogowano pomyślnie");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Wystąpił błąd podczas wylogowywania");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      if (!supabase) throw new Error("Supabase client not available");

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: "Wystąpił błąd podczas resetowania hasła." };
    }
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
  // Since we're now providing a default context value, we can simplify this check
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
