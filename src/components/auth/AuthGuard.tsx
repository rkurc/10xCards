import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
  children: ReactNode;
  redirectUrl?: string;
}

export function AuthGuard({ children, redirectUrl = "/login" }: AuthGuardProps) {
  const { user, loading } = useAuth();
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
        <Spinner size="lg" />
      </div>
    );
  }

  // If not authenticated, show loading until redirect happens
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen" data-testid="auth-guard-redirecting">
        <Spinner size="lg" />
        <span className="ml-2">Redirecting to login...</span>
      </div>
    );
  }

  // If authenticated, render children
  return <div data-testid="auth-guard-content">{children}</div>;
}
