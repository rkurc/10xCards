import { useState, useEffect } from "react";
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

// Define LoginResult interface directly in this file to avoid import issues
interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

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
  const { login, user } = useAuth();

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
      window.location.href = redirectUrl;
    }
  }, [user, redirectUrl]);

  // Handle form submission
  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    try {
      // Attempt login through context
      const result = await login(data.email, data.password);

      if (result.success) {
        toast.success("Logowanie udane");

        // Verify authentication was successful by making a protected API call
        try {
          const authCheckResponse = await fetch("/api/debug/auth-state");
          if (authCheckResponse.ok) {
            const authCheckResult = await authCheckResponse.json();

            if (authCheckResult.user) {
              // Redirect after delay to let state update
              setTimeout(() => {
                window.location.href = redirectUrl;
              }, 1000);
            } else {
              toast.error("Problem z uwierzytelnianiem. Spróbuj ponownie.");
            }
          } else {
            // Auth check failed - don't redirect
            toast.error("Próba weryfikacji uwierzytelnienia nie powiodła się");
          }
        } catch (error) {
          // Error checking auth status
          toast.error("Problem z weryfikacją uwierzytelnienia");
        }
      } else {
        toast.error(result.error || "Niepoprawny email lub hasło");
      }
    } catch (error) {
      toast.error("Wystąpił błąd podczas logowania");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFormError(errors: any) {
    // Silent handling of form validation errors
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Zaloguj się, aby kontynuować naukę z 10xCards</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleFormError)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="twoj@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-sm text-right">
              <a href="/forgot-password" className="text-primary hover:underline">
                Zapomniałeś hasła?
              </a>
            </div>

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
        </Form>
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
