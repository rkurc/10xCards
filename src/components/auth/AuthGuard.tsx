import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <Card className="mx-auto max-w-md my-8">
        <CardHeader>
          <CardTitle>Dostęp wyłącznie dla zalogowanych</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Musisz być zalogowany, aby uzyskać dostęp do tej zawartości.</p>
          <Button asChild className="w-full">
            <a href={`${redirectUrl}?redirect=${window.location.pathname}`}>
              Zaloguj się
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
}
