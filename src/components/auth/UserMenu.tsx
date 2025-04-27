import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

interface UserMenuProps {
  user: {
    name?: string;
    email: string;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const handleLogout = async () => {
    try {
      // This is where we would call the auth service in a real implementation
      console.log("Logging out");
      toast.success("Wylogowano pomyślnie");
      
      // Add a small delay before redirecting to ensure the toast is visible
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Wystąpił błąd podczas wylogowywania");
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
        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer">
          <LogOut className="h-4 w-4" />
          <span>Wyloguj się</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
