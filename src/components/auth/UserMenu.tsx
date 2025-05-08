import { useState } from "react";
import { useDirectAuth } from "@/hooks/useDirectAuth";
import { logout } from "@/services/auth.direct";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

export function UserMenu() {
  const { user, loading } = useDirectAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logout();

      if (result.success) {
        toast({
          title: "Wylogowano",
          description: "Zostałeś wylogowany z systemu",
        });

        // Redirect to login page after logout
        window.location.href = "/login";
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się wylogować",
          variant: "destructive",
        });
        setIsLoggingOut(false);
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
      setIsLoggingOut(false);
    }
  };

  // Show login button when not authenticated
  if (!user && !loading) {
    return (
      <Button variant="outline" asChild>
        <a href="/login">Zaloguj się</a>
      </Button>
    );
  }

  // Show loading state
  if (loading) {
    return <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>;
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return "?";

    if (user.name) {
      return user.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }

    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu-button">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
            data-testid="user-avatar"
          >
            {user.name ? user.name[0].toUpperCase() : "U"}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Moje konto</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/account" className="cursor-pointer w-full">
            Profil
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/dashboard" className="cursor-pointer w-full">
            Dashboard
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer">
          {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
