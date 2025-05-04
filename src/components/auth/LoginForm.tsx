import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { showAuthError } from "@/utils/auth-error-handler";

// Import the AuthService for direct use
import { AuthService } from "@/services/auth.service";
import { createBrowserSupabaseClient } from "@/lib/supabase.client";

// Form schema using zod
const formSchema = z.object({
  email: z.string().email("Podaj poprawny adres email"),
  password: z.string().min(1, "Podaj hasło"),
});

type FormValues = z.infer<typeof formSchema>;

interface LoginFormProps {
  redirectUrl?: string;
}

export function LoginForm({ redirectUrl = "/dashboard" }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { login, user } = useAuth();

  // Create an instance of the auth service for direct use if needed
  const authService = typeof window !== "undefined" ? new AuthService(createBrowserSupabaseClient()) : null;

  // Initialize react-hook-form with zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Check if user is already authenticated and redirect if needed
  useEffect(() => {
    if (user) {
      navigateToUrl(redirectUrl);
    }
  }, [user, redirectUrl]);

  // Safe navigation function that works more reliably
  const navigateToUrl = (url: string) => {
    try {
      // Always reset loading state before navigation
      setIsSubmitting(false);

      if (typeof window !== "undefined") {
        // Use direct location change for reliability
        window.location.href = url;
      }
    } catch (_) {
      // Ensure loading state is reset even if navigation fails
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      // First try the context login
      const result = await login(data.email, data.password);

      if (result.success) {
        setMessage("Logowanie udane! Przekierowywanie...");
        toast.success("Logowanie udane");

        // Short delay before redirect to ensure toast is visible
        setTimeout(() => {
          navigateToUrl(redirectUrl);
        }, 800);
      } else if (authService) {
        // If context login fails, try direct auth service as fallback
        try {
          const directResult = await authService.login(data.email, data.password);

          if (directResult.success) {
            setMessage("Logowanie udane! Przekierowywanie...");
            toast.success("Logowanie udane");

            setTimeout(() => {
              navigateToUrl(redirectUrl);
            }, 800);
          } else {
            setError(directResult.error || "Niepoprawny email lub hasło");
            toast.error(directResult.error || "Niepoprawny email lub hasło");
          }
        } catch (directError) {
          showAuthError(directError, "Wystąpił błąd podczas logowania");
          setError(directError instanceof Error ? directError.message : "Wystąpił błąd podczas logowania");
        }
      } else {
        setError("Nie można użyć usługi uwierzytelniania");
      }
    } catch (submitError) {
      showAuthError(submitError, "Wystąpił błąd podczas logowania");
      setError(submitError instanceof Error ? submitError.message : "Wystąpił błąd podczas logowania");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Zaloguj się, aby kontynuować naukę z 10xCards</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <div>
                  <Input type="email" placeholder="twoj@email.com" id="email" {...field} />
                  {fieldState.error && <div className="text-sm text-red-500 mt-1">{fieldState.error.message}</div>}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Hasło
            </label>
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <div>
                  <Input type="password" placeholder="••••••••" id="password" {...field} />
                  {fieldState.error && <div className="text-sm text-red-500 mt-1">{fieldState.error.message}</div>}
                </div>
              )}
            />
          </div>

          <div className="text-sm text-right">
            <a href="/forgot-password" className="text-primary hover:underline">
              Zapomniałeś hasła?
            </a>
          </div>

          {message && <div className="text-sm p-3 bg-green-50 text-green-700 rounded-md">{message}</div>}
          {error && <div className="text-sm p-3 bg-red-50 text-red-500 rounded-md">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logowanie...
              </>
            ) : (
              "Zaloguj się"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Nie masz konta?{" "}
          <a href="/register" className="text-primary hover:underline">
            Zarejestruj się
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
