import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useState, createContext, type ReactNode } from "react";

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
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null as { id?: string; name?: string } | null,
  });

  const login = () => {
    setAuthState({
      isAuthenticated: true,
      user: { id: "user-1", name: "Test User" },
    });
  };

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
    });
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="10xcards-theme">
      <AuthContext.Provider 
        value={{ 
          ...authState, 
          login, 
          logout 
        }}
      >
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster position="top-right" richColors />
        </div>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
