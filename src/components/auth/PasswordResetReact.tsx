import { useState } from "react";
import { resetPassword } from "@/services/auth.direct";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface PasswordResetProps {
  redirectUrl?: string;
}

export function PasswordResetReact({ redirectUrl = "/login" }: PasswordResetProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Direct call to auth service - no context needed
      const result = await resetPassword(email);

      if (result.success) {
        toast({
          title: "Link do resetowania hasła wysłany",
          description: "Sprawdź swoją skrzynkę email, aby zresetować hasło.",
          variant: "default",
        });
        setIsSuccess(true);
      } else {
        // Reset failure - show error message
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się wysłać linku resetującego hasło.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Link wysłany!</h1>
          <p className="text-sm text-gray-600 mt-4">
            Wysłaliśmy link do resetowania hasła na adres <strong>{email}</strong>. Sprawdź swoją skrzynkę email i
            postępuj zgodnie z instrukcjami.
          </p>
        </div>
        <div className="pt-4">
          <Button className="w-full" variant="outline" onClick={() => (window.location.href = redirectUrl)}>
            Wróć do strony logowania
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Resetowanie hasła</h1>
        <p className="text-sm text-gray-600 mt-2">
          Podaj adres email powiązany z Twoim kontem, a my wyślemy link do resetowania hasła.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
              placeholder="twoj@email.com"
              data-testid="email-input"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="reset-button">
          {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
        </Button>

        <div className="text-center mt-4">
          <a href="/login" className="font-medium text-primary hover:underline">
            Wróć do logowania
          </a>
        </div>
      </form>
    </div>
  );
}
