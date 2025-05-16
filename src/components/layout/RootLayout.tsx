import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useState, createContext, type ReactNode } from "react";
import { GenerationProvider } from "@/contexts/generation-context";

// Create a simple auth context
interface AuthContextType {
  isAuthenticated: boolean;
  user: { id?: string; name?: string; email?: string } | null;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
});

export function RootLayout({ children }: { children: ReactNode }) {
  // Simple authentication state management
  const [authState, setAuthState] = useState(() => {
    // Check if we have auth state in localStorage
    const storedAuth = typeof window !== "undefined" ? localStorage.getItem("auth") : null;
    if (storedAuth) {
      try {
        return JSON.parse(storedAuth);
      } catch (e) {
        console.error("Failed to parse stored auth state", e);
      }
    }
    // Default state if no stored auth or parsing failed
    return {
      isAuthenticated: false,
      user: null as { id?: string; name?: string } | null,
    };
  });

  const login = () => {
    const newState = {
      isAuthenticated: true,
      user: { id: "user-1", name: "Test User" },
    };
    setAuthState(newState);
    // Store in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("auth", JSON.stringify(newState));
    }
  };

  const logout = () => {
    const newState = {
      isAuthenticated: false,
      user: null,
    };
    setAuthState(newState);
    // Remove from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth");
    }
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="10xcards-theme">
      <AuthContext.Provider
        value={{
          ...authState,
          login,
          logout,
        }}
      >
        <GenerationProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster position="top-right" richColors />
          </div>
        </GenerationProvider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
