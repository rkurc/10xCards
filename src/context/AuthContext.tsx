import React, { createContext, useContext, useEffect, useState } from "react";
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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        // SECURE: Always use getUser() which verifies with the auth server
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.debug("Error verifying user:", error.message);
          setUser(null);
          return;
        }
        
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      // Use direct API call
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ email, password }),
        });
        
        // Handle response
        const responseText = await response.text();
        let result;
        
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse response as JSON");
          return { success: false, error: "Invalid server response format" };
        }
        
        if (!response.ok) {
          return { success: false, error: result.error || "Authentication failed" };
        }
        
        // Update user state if we have user data
        if (result.user) {
          setUser({
            id: result.user.id,
            email: result.user.email,
            name: result.user.name || result.user.email.split('@')[0],
          });
        }
        
        return { success: true };
        
      } catch (apiError) {
        console.debug("API login error, falling back to Supabase client");
        
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
      console.error("Login error:", error);
      return { success: false, error: "Wystąpił błąd podczas logowania." };
    }
  };

  const register = async (email: string, password: string, options?: { name?: string }) => {
    try {
      // Use API endpoint for registration
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            email, 
            password, 
            userData: options 
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
          requiresEmailConfirmation: result.requiresEmailConfirmation
        };
      } catch (apiError) {
        console.debug("API registration error, falling back to direct Supabase");
        
        // Fallback to direct Supabase client
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: options,
            emailRedirectTo: `${window.location.origin}/auth-callback`
          }
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
            requiresEmailConfirmation: true 
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
