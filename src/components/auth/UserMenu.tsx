import { useState } from "react";
import { useDirectAuth } from "@/hooks/useDirectAuth";
import { logout } from "@/services/auth.direct";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

// TODO: Implement personal data management functionality (US-011)
// - Add user profile page with account settings
// - Implement data export functionality for GDPR compliance
// - Add account deletion option that removes all user data

export function UserMenu() {
  const { user, loading } = useDirectAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logout();

      if (result.success) {
        toast({
          title: "Wylogowano",
          description: "Zostałeś wylogowany z systemu",
        });

        window.location.href = "/login";
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się wylogować",
          variant: "destructive",
        });
        setIsLoggingOut(false);
      }
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error?.message || "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
      setIsLoggingOut(false);
    }
  };

  if (!user && !loading) {
    return (
      <Button variant="outline" asChild>
        <a href="/login">Zaloguj się</a>
      </Button>
    );
  }

  if (loading || !user) {
    return <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu-trigger">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
            data-testid="user-avatar"
          >
            {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase() || "U"}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" data-testid="user-menu-content">
        <DropdownMenuLabel>Moje konto</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 text-sm text-muted-foreground" data-testid="user-email">
          {user.email}
        </div>

        {user.name && (
          <div className="px-2 py-1.5 text-sm font-medium" data-testid="user-name">
            {user.name}
          </div>
        )}

        <DropdownMenuSeparator />

        <div className="relative flex cursor-default select-none items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
          <a href="/account" className="w-full" data-testid="profile-button">
            Profil
          </a>
        </div>

        <div className="relative flex cursor-default select-none items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
          <a href="/dashboard" className="w-full" data-testid="dashboard-button">
            Dashboard
          </a>
        </div>

        <DropdownMenuSeparator />

        <div className="relative flex cursor-default select-none items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full text-left cursor-pointer disabled:opacity-50"
            data-testid="logout-button"
          >
            {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
