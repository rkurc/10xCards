import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User as UserIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { toast } from "sonner"; // Changed from react-toastify to sonner

interface UserMenuProps {
  user: {
    name?: string;
    email: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // First try direct API call
      console.log("Sending logout request to API");
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        // After successful logout, forcefully reload the page to reset all state
        console.log("Logout successful, reloading page");
        window.location.href = "/";
        return;
      }

      // Fallback to context logout if API call fails
      console.log("API logout failed, using context logout");
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div data-testid="user-menu">
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
        <DropdownMenuContent align="end" data-testid="user-menu-dropdown">
          <DropdownMenuLabel data-testid="user-menu-email">{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild data-testid="user-menu-profile-link">
            <a href="/profile">Profile</a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild data-testid="user-menu-settings-link">
            <a href="/settings">Settings</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} data-testid="user-menu-logout-button">
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              "Log out"
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
