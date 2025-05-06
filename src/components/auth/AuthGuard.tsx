import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface AuthGuardProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  children: ReactNode;
  redirectUrl?: string;
}

export function AuthGuard({ 
  isAuthenticated, 
  isLoading, 
  children, 
  redirectUrl = "/login" 
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = window.location.pathname;

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen" data-testid="auth-guard-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  // If not authenticated, navigate to login
  if (!isAuthenticated) {
    useEffect(() => {
      router.push(`${redirectUrl}?redirect=${pathname}`);
    }, [pathname, router, redirectUrl]);
    
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
