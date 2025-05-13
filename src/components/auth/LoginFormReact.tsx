import { useState } from "react";
import { login } from "@/services/auth.direct";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

// Simple props interface - just the redirect URL
interface LoginFormProps {
  redirectUrl?: string;
}

export function LoginFormReact({ redirectUrl = "/dashboard" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Direct call to auth service - no context needed
      const result = await login(email, password);

      if (result.success && result.user) {
        // Success - show toast and redirect
        toast({
          title: "Zalogowano pomyślnie",
          description: "Przekierowujemy Cię do aplikacji...",
          variant: "default",
        });

        // Add small delay for better UX and to ensure auth is established
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 300);
      } else {
        // Login failure - show error message
        toast({
          title: "Błąd logowania",
          description: result.error || "Niepoprawny email lub hasło",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      // Unexpected error
      console.error("Login error:", error);
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd podczas logowania",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Logowanie</h1>
        <p className="text-sm text-gray-600 mt-2">Wprowadź dane logowania, aby kontynuować</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              autoComplete="email"
              data-testid="email-input"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Hasło</Label>
              <a href="/reset-password" className="text-xs text-primary-600 hover:underline">
                Zapomniałeś hasła?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              autoComplete="current-password"
              data-testid="password-input"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="submit-button">
          {isSubmitting ? "Logowanie..." : "Zaloguj się"}
        </Button>

        <div className="text-center mt-4">
          <a
            href="/forgot-password"
            className="text-xs text-primary-600 hover:underline"
            data-testid="forgot-password-link"
          >
            Zapomniałeś hasła?
          </a>
        </div>

        <div className="text-center mt-4">
          <span className="text-sm text-gray-600">Nie masz jeszcze konta? </span>
          <a href="/register" className="font-medium text-primary-600 hover:underline" data-testid="register-link">
            Zarejestruj się
          </a>
        </div>
      </form>
    </div>
  );
}
