import { useState } from "react";
import { register } from "@/services/auth.direct";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
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
    
    try {
      // Direct call to auth service - no context needed
      const result = await register(email, password, { name });
      
      if (result.success) {
        toast({
          title: "Rejestracja udana",
          description: result.requiresEmailConfirmation 
            ? "Sprawdź swoją skrzynkę email, aby potwierdzić rejestrację."
            : "Konto zostało utworzone. Możesz się teraz zalogować.",
          variant: "default",
        });
        
        // Redirect to success page with appropriate parameters
        const url = new URL(redirectUrl, window.location.origin);
        if (result.requiresEmailConfirmation) {
          url.searchParams.set('confirmation', 'true');
        }
        window.location.href = url.toString();
      } else {
        // Registration failure - show error message
        toast({
          title: "Błąd rejestracji",
          description: result.error || "Niepoprawne dane rejestracyjne",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      // Unexpected error
      console.error("Registration error:", error);
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd podczas rejestracji",
        variant: "destructive",
      });
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
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 8 znaków
            </p>
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
              Akceptuję <a href="/terms" className="text-primary hover:underline">regulamin</a> i{" "}
              <a href="/privacy" className="text-primary hover:underline">politykę prywatności</a>
            </Label>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
          data-testid="register-button"
        >
          {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
        </Button>

        <div className="text-center mt-4">
          <span className="text-sm text-gray-600">Masz już konto? </span>
          <a href="/login" className="font-medium text-primary hover:underline">
            Zaloguj się
          </a>
        </div>
      </form>
    </div>
  );
}