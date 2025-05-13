import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

// Form schema using zod
const formSchema = z.object({
  email: z.string().email("Podaj poprawny adres email"),
});

type FormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  // Initialize react-hook-form with zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  async function onSubmit(data: FormValues) {
    if (!resetPassword) return;

    setIsSubmitting(true);

    try {
      const result = await resetPassword(data.email);

      if (result.success) {
        toast.success("Instrukcja resetowania hasła została wysłana na podany email");
        setIsSubmitted(true);
      } else {
        toast.error(result.error || "Wystąpił błąd podczas wysyłania instrukcji resetowania hasła");
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Wystąpił błąd podczas wysyłania instrukcji resetowania hasła";
      toast.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="forgot-password-container">
      <CardHeader>
        <CardTitle>Odzyskaj dostęp do konta</CardTitle>
        <CardDescription>Podaj swój adres email, aby otrzymać instrukcję resetowania hasła</CardDescription>
      </CardHeader>
      <CardContent>
        {!isSubmitted ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="reset-email-label">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="twoj@email.com" {...field} data-testid="reset-email-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="reset-submit-button">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wysyłanie...
                  </>
                ) : (
                  "Wyślij instrukcję"
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="text-center py-4" data-testid="success-message">
            <p className="mb-4">Instrukcja resetowania hasła została wysłana na podany adres email.</p>
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
