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
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const { login } = useAuth();

  // Debug helper
  const addDebugMessage = (message: string) => {
    console.log(`DEBUG: ${message}`);
    setDebugMessages(prev => [message, ...prev].slice(0, 5));
  };

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

  // Handle form submission with enhanced debugging
  async function onSubmit(data: FormValues) {
    addDebugMessage(`Form submission started: ${data.email}`);
    
    setIsSubmitting(true);

    try {
      addDebugMessage(`Calling login function with: ${data.email}`);
      
      try {
        addDebugMessage('Making direct API call to /api/auth/login');
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Explicitly request JSON only, not HTML
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            email: data.email, 
            password: data.password,
            redirectUrl
          }),
        });
        
        // Log response status
        addDebugMessage(`Response status: ${response.status}`);
        
        let responseText;
        try {
          // Get the raw text response
          responseText = await response.text();
          addDebugMessage(`Response length: ${responseText.length} characters`);
          
          // Check if response looks like HTML (quick check for common HTML indicators)
          if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            addDebugMessage(`WARNING: Received HTML instead of JSON`);
            toast.error("Server responded with HTML instead of JSON. Check server logs.");
            return;
          }

          // Limit response text display to avoid overwhelming the UI
          const truncatedResponse = responseText.length > 100 
            ? responseText.substring(0, 100) + '...' 
            : responseText;
          addDebugMessage(`Response: ${truncatedResponse}`);
          
          // Try to parse as JSON
          const result = JSON.parse(responseText);
          addDebugMessage(`Parsed JSON successfully`);
          
          if (!response.ok) {
            addDebugMessage(`API call failed: ${result.error || response.statusText}`);
            toast.error(result.error || "Login failed");
            return;
          }
          
          addDebugMessage(`Login successful, redirecting to: ${redirectUrl}`);
          toast.success("Logowanie udane");
          
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1500);
        } catch (jsonError) {
          addDebugMessage(`Failed to parse response as JSON: ${jsonError.message}`);
          addDebugMessage(`Response: ${responseText?.substring(0, 100)}...`); 
          toast.error("Invalid server response format");
        }
      } catch (fetchError) {
        addDebugMessage(`Fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        
        // Fallback to context login function
        addDebugMessage('Falling back to context login');
        const result = await login(data.email, data.password);
        
        if (result.success) {
          toast.success("Logowanie udane");
          
          // Add a small delay before redirecting
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1000);
        } else {
          toast.error(result.error || "Niepoprawny email lub hasło");
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugMessage(`Login error: ${errorMessage}`);
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
            onSubmit={(e) => {
              addDebugMessage("Native form submit event triggered");
              form.handleSubmit(onSubmit)(e);
            }} 
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

            {/* Make sure button is not outlined variant */}
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
            
            {/* Direct login for testing - explicitly defined function */}
            {import.meta.env.DEV && (
              <Button 
                type="button"
                variant="secondary"
                className="w-full mt-2" 
                onClick={() => {
                  addDebugMessage("Direct login button clicked");
                  const formData = form.getValues();
                  onSubmit(formData);
                }}
              >
                Test Direct Login
              </Button>
            )}
            
            {/* Debug info section */}
            {import.meta.env.DEV && debugMessages.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p className="font-medium mb-1">Debug log:</p>
                <ul className="space-y-1">
                  {debugMessages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}
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
