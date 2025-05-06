import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Form schema using zod
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[a-zA-Z]/, "Hasło musi zawierać co najmniej jedną literę")
      .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
    passwordConfirm: z.string().min(8, "Powtórz hasło"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są identyczne",
    path: ["passwordConfirm"],
  });

type FormValues = z.infer<typeof formSchema>;

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Initialize react-hook-form with zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
  });

  // Handle form submission
  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    try {
      // This is where we would call the auth service in a real implementation
      console.log("Reset password form submitted:", { ...data, token });
      toast.success("Twoje hasło zostało zmienione");
      setIsSubmitted(true);

      // Add a small delay before redirecting to ensure the toast is visible
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Wystąpił błąd podczas resetowania hasła");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto" data-testid="reset-password-invalid-token">
        <CardHeader>
          <CardTitle>Nieprawidłowy link</CardTitle>
          <CardDescription>Link do resetowania hasła jest nieprawidłowy lub wygasł.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center">Spróbuj ponownie zresetować hasło.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <a href="/forgot-password" data-testid="reset-password-try-again">
              Resetuj hasło
            </a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="reset-password-container">
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło do swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        {!isSubmitted ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="reset-password-form">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="password" data-testid="reset-password-label">
                      Nowe hasło
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        data-testid="reset-password-input"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Minimum 8 znaków, w tym jedna litera i jedna cyfra</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="confirmPassword" data-testid="reset-password-confirm-label">
                      Powtórz hasło
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        data-testid="reset-password-confirm-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                data-testid="reset-password-submit-button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aktualizacja hasła...
                  </>
                ) : (
                  "Zapisz nowe hasło"
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="text-center py-4" data-testid="reset-password-success-message">
            <p className="mb-4">Twoje hasło zostało zmienione pomyślnie.</p>
            <p className="text-muted-foreground text-sm">Za chwilę zostaniesz przekierowany do strony logowania.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
