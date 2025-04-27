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
  const { login } = useAuth();

  // Initialize react-hook-form with zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Add an effect to initialize the form with test data in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      form.setValue("email", "test@example.com");
      form.setValue("password", "password123");
    }
  }, []);

  // Handle form submission
  async function onSubmit(data: FormValues) {
    console.debug(`Login attempt: ${data.email}`);
    setIsSubmitting(true);

    try {
      // Try direct API call first
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            email: data.email, 
            password: data.password,
            redirectUrl
          }),
        });
        
        // Check if response can be parsed as JSON
        const responseText = await response.text();
        let result;
        
        try {
          result = JSON.parse(responseText);
        } catch (jsonError) {
          console.error("Failed to parse response as JSON:", jsonError);
          toast.error("Invalid server response format");
          return;
        }
        
        if (!response.ok) {
          toast.error(result.error || "Login failed");
          return;
        }
        
        toast.success("Logowanie udane");
        
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);
        
      } catch (fetchError) {
        console.debug('Falling back to context login');
        const result = await login(data.email, data.password);
        
        if (result.success) {
          toast.success("Logowanie udane");
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1000);
        } else {
          toast.error(result.error || "Niepoprawny email lub hasło");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Wystąpił błąd podczas logowania");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>
          Zaloguj się, aby kontynuować naukę z 10xCards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-4"
          >
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
