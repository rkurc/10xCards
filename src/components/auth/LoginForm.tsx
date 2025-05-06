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
            const errorMessage = directResult.error || "Niepoprawny email lub hasło";
            setError(errorMessage);
            toast.error(errorMessage);
          }
        } catch (directError) {
          const errorMessage = directError instanceof Error ? directError.message : "Wystąpił błąd podczas logowania";
          showAuthError(directError, "Wystąpił błąd podczas logowania");
          setError(errorMessage);
        }
      } else {
        setError("Nie można użyć usługi uwierzytelniania");
      }
    } catch (submitError) {
      const errorMessage = submitError instanceof Error ? submitError.message : "Wystąpił błąd podczas logowania";
      showAuthError(submitError, "Wystąpił błąd podczas logowania");
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div data-testid="login-form-container">
      <form onSubmit={form.handleSubmit(onSubmit)} data-testid="login-form">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email" data-testid="login-email-label">
              Email
            </label>
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <div>
                  <Input
                    type="email"
                    placeholder="twoj@email.com"
                    id="email"
                    name="email"
                    data-testid="login-email-input"
                    {...field}
                  />
                  {fieldState.error && (
                    <div className="text-sm text-red-500 mt-1" data-testid="login-email-error">
                      {fieldState.error.message}
                    </div>
                  )}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password" data-testid="login-password-label">
              Hasło
            </label>
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    id="password"
                    name="password"
                    data-testid="login-password-input"
                    {...field}
                  />
                  {fieldState.error && (
                    <div className="text-sm text-red-500 mt-1" data-testid="login-password-error">
                      {fieldState.error.message}
                    </div>
                  )}
                </div>
              )}
            />
          </div>

          <div className="text-sm text-right">
            <a href="/forgot-password" className="text-primary hover:underline" data-testid="login-forgot-password-link">
              Zapomniałeś hasła?
            </a>
          </div>

          {message && (
            <div className="text-sm p-3 bg-green-50 text-green-700 rounded-md" data-testid="success-message">
              {message}
            </div>
          )}
          {error && (
            <div className="text-sm p-3 bg-red-50 text-red-500 rounded-md" data-testid="error-message" aria-live="polite">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
            data-testid="login-submit-button"
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
        </div>
      </form>

      <div className="mt-4 text-center" data-testid="login-links">
        <a href="/register" className="text-sm text-primary hover:underline" data-testid="login-register-link">
          Nie masz konta? Zarejestruj się
        </a>
      </div>
    </div>
  );
}
