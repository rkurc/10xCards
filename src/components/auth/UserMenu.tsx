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
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        // After successful logout, forcefully reload the page to reset all state
        console.log("Logout successful, reloading page");
        window.location.href = '/';
        return;
      }
      
      // Fallback to context logout if API call fails
      console.log("API logout failed, using context logout");
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {user.name ? user.name[0].toUpperCase() : "U"}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>Moje konto</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span>{user.name || user.email}</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/account" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            <span>Ustawienia konta</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="flex items-center gap-2 cursor-pointer"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Wylogowywanie...</span>
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              <span>Wyloguj się</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
