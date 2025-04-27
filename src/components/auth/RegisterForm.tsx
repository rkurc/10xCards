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
const formSchema = z.object({
  email: z.string().email("Podaj poprawny adres email"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[a-zA-Z]/, "Hasło musi zawierać co najmniej jedną literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
  passwordConfirm: z.string().min(8, "Powtórz hasło"),
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

  // Initialize react-hook-form with zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  // Handle form submission
  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    try {
      // This is where we would call the auth service in a real implementation
      console.log("Register form submitted:", data);
      toast.success("Konto zostało utworzone. Możesz się teraz zalogować.");
      
      // Add a small delay before redirecting to ensure the toast is visible
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Wystąpił błąd podczas rejestracji");
    } finally {
      setIsSubmitting(false);
    }
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FormDescription>
                    Minimum 8 znaków, w tym jedna litera i jedna cyfra
                  </FormDescription>
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejestracja...
                </>
              ) : (
                "Zarejestruj się"
              )}
            </Button>
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
