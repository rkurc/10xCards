import { useDirectAuth } from "@/hooks/useDirectAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthStatusProps {
  showLoginButton?: boolean;
  showName?: boolean;
  className?: string;
}

export function AuthStatus({ showLoginButton = true, showName = true, className = "" }: AuthStatusProps) {
  const { user, loading, isAuthenticated } = useDirectAuth();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-4 w-24" />
        {showLoginButton && <Skeleton className="h-8 w-20" />}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-muted-foreground">Nie zalogowano</span>
        {showLoginButton && (
          <Button variant="outline" size="sm" asChild>
            <a href="/login">Zaloguj się</a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showName && (
        <span className="text-sm">
          Zalogowano jako <span className="font-medium">{user?.name || user?.email}</span>
        </span>
      )}
      {!showName && <span className="text-sm text-muted-foreground">Zalogowano</span>}
    </div>
  );
}
