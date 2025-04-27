import React, { createContext, useContext, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "../lib/supabase.client";
import { toast } from "sonner";

type User = {
  id: string;
  email: string;
  name?: string;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false, error: "Not implemented" }),
  register: async () => ({ success: false, error: "Not implemented" }),
  logout: async () => {},
  resetPassword: async () => ({ success: false, error: "Not implemented" }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode; initialUser?: User }> = ({ 
  children,
  initialUser 
}) => {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0],
          });
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (!initialUser) {
      checkUser();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log(`Attempting login for user: ${email}`);
      
      // Use direct API call for more reliable behavior
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email, password }),
        });
        
        // Handle non-JSON responses
        const responseText = await response.text();
        let result;
        
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", responseText);
          return { success: false, error: "Invalid server response format" };
        }
        
        if (!response.ok) {
          return { success: false, error: result.error || "Authentication failed" };
        }
        
        // If we have user data, update the state
        if (result.user) {
          setUser({
            id: result.user.id,
            email: result.user.email,
            name: result.user.name || result.user.email.split('@')[0],
          });
        }
        
        return { success: true };
        
      } catch (apiError) {
        console.error("API login error:", apiError);
        
        // Fallback to Supabase client
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Login error:", errorMessage);
      return { success: false, error: "Wystąpił błąd podczas logowania." };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      // For local Supabase development, we can set email confirmation to false
      // by passing the appropriate options
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This is the key option for local development
          emailRedirectTo: `${window.location.origin}/auth-callback`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // For local development with auto-confirm enabled, 
      // user will be immediately logged in
      if (data.session) {
        return { success: true };
      } else {
        // Email confirmation still required (if configured in Supabase)
        return { 
          success: true,
          requiresEmailConfirmation: true 
        };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "An error occurred during registration." };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Wylogowano pomyślnie");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Wystąpił błąd podczas wylogowywania");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
