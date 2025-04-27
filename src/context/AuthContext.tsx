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
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Wystąpił błąd podczas logowania." };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Wystąpił błąd podczas rejestracji." };
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
