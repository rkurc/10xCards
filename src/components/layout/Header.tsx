import { useContext } from "react";
import { AuthContext } from "./RootLayout";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme/ModeToggle";

export function Header() {
  const { isAuthenticated, user, login, logout } = useContext(AuthContext);

  // Log auth state for debugging
  console.log("Auth state:", { isAuthenticated, user });

  return (
    <header className="border-b sticky top-0 z-40 bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="font-bold text-lg mr-6">
            10xCards
          </a>

          {isAuthenticated && (
            <nav className="hidden md:flex space-x-4">
              <a href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </a>
              <a href="/sets" className="text-muted-foreground hover:text-foreground">
                Zestawy
              </a>
              <a href="/generate" className="text-muted-foreground hover:text-foreground">
                Generuj
              </a>
              <a href="/learn" className="text-muted-foreground hover:text-foreground">
                Nauka
              </a>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <ModeToggle />

          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm hidden md:inline-block">Witaj, {user?.name}</span>
              <Button onClick={logout} variant="outline" size="sm">
                Wyloguj
              </Button>
            </div>
          ) : (
            <Button onClick={login} size="sm">
              Zaloguj
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
