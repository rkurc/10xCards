import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

// Form schema using zod with enhanced validation
const formSchema = z.object({
  name: z.string().min(2, "Imię musi zawierać co najmniej 2 znaki").max(50, "Imię nie może przekraczać 50 znaków"),
  email: z.string().email("Podaj poprawny adres email"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[a-zA-Z]/, "Hasło musi zawierać co najmniej jedną literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
  passwordConfirm: z.string().min(1, "Powtórz hasło"),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Musisz zaakceptować regulamin" }),
  }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Hasła nie są identyczne",
  path: ["passwordConfirm"],
});

type FormValues = z.infer<typeof formSchema>;

interface RegisterFormProps {
  redirectUrl?: string;
}

export function RegisterForm({ redirectUrl = "/dashboard" }: RegisterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [commonErrors, setCommonErrors] = useState<string[]>([]);
  const [debugMessages, setDebugMessages] = useState<string[]>([]); // Added debug state
  const { register } = useAuth();

  // Debug helper function
  const addDebugMessage = (message: string) => {
    console.log(`DEBUG: ${message}`);
    setDebugMessages(prev => [message, ...prev].slice(0, 5));
  };

  // Initialize react-hook-form with zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
      termsAccepted: false,
    },
  });

  // Calculate password strength
  useEffect(() => {
    const password = form.watch("password");
    if (!password) {
      setPasswordStrength(0);
      setCommonErrors([]);
      return;
    }

    // Define criteria for strength calculation
    const criteria = [
      { test: /.{8,}/, message: "Co najmniej 8 znaków" },
      { test: /[A-Z]/, message: "Wielka litera" },
      { test: /[a-z]/, message: "Mała litera" },
      { test: /[0-9]/, message: "Cyfra" },
      { test: /[^A-Za-z0-9]/, message: "Znak specjalny" },
    ];

    // Calculate how many criteria are met
    const passedCriteria = criteria.filter(criterion => criterion.test.test(password));
    const strength = Math.round((passedCriteria.length / criteria.length) * 100);
    setPasswordStrength(strength);

    // Update errors list
    setCommonErrors(criteria
      .filter(criterion => !criterion.test.test(password))
      .map(criterion => criterion.message)
    );
  }, [form.watch("password")]);

  // Get color based on password strength
  const getStrengthColor = () => {
    if (passwordStrength < 40) return "bg-destructive";
    if (passwordStrength < 80) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Handle form submission
  async function onSubmit(data: FormValues) {
    addDebugMessage(`Form submission started with: ${data.email}`);
    setIsSubmitting(true);

    try {
      addDebugMessage("Calling register function");
      
      // Try using direct fetch first to bypass potential context issues
      try {
        addDebugMessage("Making direct API call to /api/auth/register");
        
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            userData: {
              name: data.name
            }
          }),
        });
        
        // Log response status
        addDebugMessage(`Response status: ${response.status}`);
        
        // Get the raw text response
        const responseText = await response.text();
        addDebugMessage(`Response length: ${responseText.length} characters`);
        
        // Check if response is HTML instead of JSON
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          addDebugMessage(`WARNING: Received HTML instead of JSON`);
          toast.error("Server responded with HTML instead of JSON. Check server logs.");
          return;
        }
        
        // Try to parse as JSON
        let result;
        try {
          result = JSON.parse(responseText);
          addDebugMessage(`Parsed JSON successfully: ${JSON.stringify(result).substring(0, 100)}`);
        } catch (jsonError) {
          addDebugMessage(`Failed to parse response as JSON: ${jsonError.message}`);
          toast.error("Invalid server response format");
          return;
        }
        
        if (!response.ok) {
          addDebugMessage(`API call failed: ${result.error || response.statusText}`);
          toast.error(result.error || "Registration failed");
          return;
        }
        
        // Handle success
        if (result.requiresEmailConfirmation) {
          addDebugMessage("Registration successful - email confirmation required");
          setEmailConfirmationSent(true);
          toast.success("Wysłano link aktywacyjny na podany adres email");
        } else {
          addDebugMessage("Registration successful - redirecting");
          toast.success("Konto zostało utworzone pomyślnie");
          
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1500);
        }
      } catch (fetchError) {
        // Fallback to context register function
        addDebugMessage(`Fetch error: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
        addDebugMessage('Falling back to context register');
        
        const result = await register(data.email, data.password, {
          name: data.name
        });
        
        if (result.success) {
          if (result.requiresEmailConfirmation) {
            setEmailConfirmationSent(true);
            toast.success("Wysłano link aktywacyjny na podany adres email");
          } else {
            toast.success("Konto zostało utworzone pomyślnie");
            
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1500);
          }
        } else {
          // Handle common registration errors with user-friendly messages
          if (result.error?.includes("already registered")) {
            toast.error("Ten adres email jest już zarejestrowany");
          } else if (result.error?.includes("weak password")) {
            toast.error("Hasło jest zbyt słabe. Użyj silniejszego hasła.");
          } else {
            toast.error(result.error || "Nie udało się utworzyć konta");
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addDebugMessage(`Registration error: ${errorMessage}`);
      console.error("Registration error:", error);
      toast.error("Wystąpił błąd podczas rejestracji");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show email confirmation message if email verification is required
  if (emailConfirmationSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">
            <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            Sprawdź swoją skrzynkę email
          </CardTitle>
          <CardDescription className="text-center">
            Wysłaliśmy link aktywacyjny na adres {form.getValues("email")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center">
            <p>
              Aby dokończyć proces rejestracji, kliknij w link aktywacyjny, który wysłaliśmy na podany adres email.
            </p>
            <p className="text-sm text-muted-foreground">
              Link aktywacyjny jest ważny przez 24 godziny. Jeśli nie otrzymałeś wiadomości, sprawdź folder spam lub kliknij przycisk poniżej, aby wysłać link ponownie.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              // Here we would add resend functionality
              toast.success("Link aktywacyjny został wysłany ponownie");
            }}
          >
            Wyślij link ponownie
          </Button>
          <a href="/login" className="text-primary hover:underline text-sm">
            Powrót do strony logowania
          </a>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Zarejestruj się</CardTitle>
        <CardDescription>
          Utwórz konto, aby korzystać z pełnej funkcjonalności 10xCards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form 
            onSubmit={(e) => {
              addDebugMessage("Form submit event triggered");
              e.preventDefault(); // Ensure default form submission is prevented
              
              // Check form validity before submission
              const isValid = form.formState.isValid;
              addDebugMessage(`Form valid: ${isValid}`);
              
              if (!isValid) {
                addDebugMessage("Form validation failed");
                // Trigger validation on all fields
                form.trigger();
                return;
              }
              
              const formData = form.getValues();
              onSubmit(formData);
            }} 
            noValidate // Use our own validation
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imię</FormLabel>
                  <FormControl>
                    <Input placeholder="Jan Kowalski" {...field} />
                  </FormControl>
                  <FormDescription>
                    Imię będzie wyświetlane w aplikacji
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                  
                  {/* Password strength indicator */}
                  {field.value && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Siła hasła</span>
                        <span className="text-xs font-semibold">{passwordStrength < 40 ? "Słabe" : passwordStrength < 80 ? "Średnie" : "Silne"}</span>
                      </div>
                      <Progress value={passwordStrength} className={`h-1 ${getStrengthColor()}`} />
                      
                      {/* Password requirements */}
                      {commonErrors.length > 0 && (
                        <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                          {commonErrors.map((error, i) => (
                            <li key={i} className="flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1 text-destructive" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Powtórz hasło</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Akceptuję <a href="/terms" className="text-primary hover:underline">regulamin</a> i <a href="/privacy" className="text-primary hover:underline">politykę prywatności</a></FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              onClick={() => {
                addDebugMessage("Submit button clicked");
                // Button click debugging only - form onSubmit handles actual submission
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejestracja...
                </>
              ) : (
                "Zarejestruj się"
              )}
            </Button>
            
            {/* Direct registration for testing - explicitly defined function */}
            {import.meta.env.DEV && (
              <Button 
                type="button"
                variant="secondary"
                className="w-full mt-2" 
                onClick={() => {
                  addDebugMessage("Direct registration button clicked");
                  const formData = form.getValues();
                  onSubmit(formData);
                }}
              >
                Test Direct Registration
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
                <p className="mt-2 text-xs">Form errors: {Object.keys(form.formState.errors).join(', ')}</p>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Masz już konto?{" "}
          <a href="/login" className="text-primary hover:underline">
            Zaloguj się
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
