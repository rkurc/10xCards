import { useState, useEffect } from "react";
import { register } from "@/services/auth.direct";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";

interface RegisterFormProps {
  redirectUrl?: string;
}

export function RegisterFormReact({ redirectUrl = "/registration-success" }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { toast } = useToast();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      setPasswordErrors([]);
      return;
    }

    const requirements = [
      { test: /.{8,}/, message: "Co najmniej 8 znaków" },
      { test: /[A-Z]/, message: "Wielka litera" },
      { test: /[a-z]/, message: "Mała litera" },
      { test: /[0-9]/, message: "Cyfra" },
      { test: /[^A-Za-z0-9]/, message: "Znak specjalny" },
    ];

    const passedRequirements = requirements.filter((req) => req.test.test(password));
    const strength = Math.round((passedRequirements.length / requirements.length) * 100);

    setPasswordStrength(strength);
    setPasswordErrors(requirements.filter((req) => !req.test.test(password)).map((req) => req.message));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordStrength < 40) {
      toast({
        title: "Błąd",
        description: "Hasło jest zbyt słabe. Spełnij wymagania bezpieczeństwa.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Błąd",
        description: "Hasło musi mieć przynajmniej 6 znaków. Spełnij wymagania bezpieczeństwa.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Błąd",
        description: "Hasła nie są identyczne",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Błąd",
        description: "Musisz zaakceptować regulamin",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await register(email, password, { name });

      if (result.success) {
        toast({
          title: "Rejestracja udana",
          description: result.requiresEmailConfirmation
            ? "Sprawdź swoją skrzynkę email, aby potwierdzić rejestrację."
            : "Konto zostało utworzone. Możesz się teraz zalogować.",
          variant: "default",
        });

        // Ensure toast is visible before redirect
        
        if (result.requiresEmailConfirmation) {
          window.location.href = `/registration-success?email=${encodeURIComponent(email)}`;
        } else {
          window.location.href = redirectUrl;
        }
      } else {
        const errorMessage = result.error || "Niepoprawne dane rejestracyjne";
        toast({
          title: "Błąd rejestracji",
          description: errorMessage,
          variant: "destructive",
        });
        setError(errorMessage);
        setIsSubmitting(false);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Registration error:", error);
      const errorMessage = "Wystąpił nieoczekiwany błąd podczas rejestracji";
      toast({
        title: "Błąd",
        description: errorMessage,
        variant: "destructive",
      });
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Rejestracja</h1>
        <p className="text-sm text-gray-600 mt-2">Stwórz konto i zacznij efektywną naukę</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Imię (opcjonalnie)</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              autoComplete="name"
              placeholder="Twoje imię"
              data-testid="name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              autoComplete="email"
              placeholder="twoj@email.com"
              data-testid="email-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
              autoComplete="new-password"
              data-testid="password-input"
            />

            {password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Siła hasła:</span>
                  <span className="text-xs font-semibold" data-testid="password-strength">
                    {passwordStrength < 40 ? "Słabe" : passwordStrength < 80 ? "Średnie" : "Silne"}
                  </span>
                </div>

                <Progress
                  value={passwordStrength}
                  className={`h-1 ${
                    passwordStrength < 40 ? "bg-destructive" : passwordStrength < 80 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  data-testid="password-strength-bar"
                />

                {passwordErrors.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1" data-testid="password-requirements">
                    {passwordErrors.map((error, i) => (
                      <li key={i} className="flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1 text-destructive" />
                        {error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1"
              autoComplete="new-password"
              data-testid="confirm-password-input"
            />
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              data-testid="terms-checkbox"
            />
            <Label htmlFor="terms" className="text-sm">
              Akceptuję{" "}
              <a href="/terms" className="text-primary hover:underline">
                regulamin
              </a>{" "}
              i{" "}
              <a href="/privacy" className="text-primary hover:underline">
                politykę prywatności
              </a>
            </Label>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="submit-button">
          {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
        </Button>

        <div className="text-center mt-4">
          <span className="text-sm text-gray-600">Masz już konto? </span>
          <a href="/login" className="font-medium text-primary hover:underline" data-testid="login-link">
            Zaloguj się
          </a>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 border border-destructive rounded-md bg-destructive/10" data-testid="error-message">
          {error}
        </div>
      )}

      {/* Success message */}
      {isSubmitting && (
        <div className="mt-4 p-4 border border-primary rounded-md bg-primary/10" data-testid="success-message">
          Rejestracja w toku...
        </div>
      )}
    </div>
  );
}
