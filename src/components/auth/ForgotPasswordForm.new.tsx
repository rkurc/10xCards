import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle } from "lucide-react";
import { resetPassword } from "@/services/auth.direct";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { PasswordResetResult } from "@/services/auth.direct";

const formSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
});

type FormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const result: PasswordResetResult = await resetPassword(data.email);

      if (result.success) {
        setIsSubmitted(true);
      } else {
        setError(result.error || "Nie udało się wysłać linku resetującego hasło");
      }
    } catch (error: unknown) {
      setError("Wystąpił nieoczekiwany błąd");
      console.error("Password reset error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card data-testid="forgot-password-container">
      <CardHeader>
        <CardTitle>Odzyskaj dostęp do konta</CardTitle>
        <CardDescription>Podaj swój adres email, aby otrzymać instrukcję resetowania hasła</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div
            className="bg-destructive/10 text-destructive rounded-md p-3 mb-4"
            data-testid="error-message"
            role="alert"
          >
            {error}
          </div>
        )}
        {!isSubmitted ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="twoj@email.com"
                        disabled={isSubmitting}
                        data-testid="reset-email-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="reset-submit-button">
                {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-success mb-4" />
            <h3 className="text-lg font-semibold mb-2">Link wysłany!</h3>
            <p className="text-muted-foreground text-sm">
              Sprawdź swoją skrzynkę odbiorczą oraz folder spam. Link do resetowania hasła jest ważny przez 24 godziny.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline" data-testid="back-to-login-link">
            Powrót do strony logowania
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
