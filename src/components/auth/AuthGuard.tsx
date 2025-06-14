import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useDirectAuth } from "@/hooks/useDirectAuth";

interface AuthGuardProps {
  children: ReactNode;
  redirectUrl?: string;
}

export function AuthGuard({ children, redirectUrl = "/login" }: AuthGuardProps) {
  const { user, loading } = useDirectAuth();
  const [pathname, setPathname] = useState<string>("");

  useEffect(() => {
    // Get current path for redirect parameter
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }
  }, []);

  // Handle redirection if not authenticated
  useEffect(() => {
    if (!loading && !user && pathname) {
      // For Astro's progressive enhancement, we use window.location
      // instead of Next.js router
      window.location.href = `${redirectUrl}?redirect=${pathname}`;
    }
  }, [loading, user, pathname, redirectUrl]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" data-testid="auth-guard-loading">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not authenticated, show loading until redirect happens
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen" data-testid="auth-guard-redirecting">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Redirecting to login...</span>
      </div>
    );
  }

  // If authenticated, render children
  return <div data-testid="auth-guard-content">{children}</div>;
}
