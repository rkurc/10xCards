import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[a-z]/, "Hasło musi zawierać małą literę")
      .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
      .regex(/[0-9]/, "Hasło musi zawierać cyfrę"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const calculatePasswordStrength = (password: string) => {
    if (password.length < 8) return "weak";
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    return score <= 2 ? "weak" : score === 3 ? "medium" : "strong";
  };

  const onSubmit = async (data: FormValues) => {
    if (!token) {
      toast.error("Brak tokenu resetowania hasła");
      return;
    }

    setIsSubmitting(true);
    try {
      // Call your reset password API here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Hasło zostało zresetowane");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Nie udało się zresetować hasła");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resetowanie hasła</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nowe hasło</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      data-testid="new-password-input"
                      onChange={(e) => {
                        field.onChange(e);
                        setPasswordStrength(calculatePasswordStrength(e.target.value));
                      }}
                    />
                  </FormControl>
                  <div className="mt-2" data-testid="password-strength">
                    <div className="h-2 w-full bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          passwordStrength === "weak"
                            ? "w-1/3 bg-red-500"
                            : passwordStrength === "medium"
                              ? "w-2/3 bg-yellow-500"
                              : "w-full bg-green-500"
                        }`}
                      />
                    </div>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {passwordStrength === "weak"
                        ? "Słabe hasło"
                        : passwordStrength === "medium"
                          ? "Średnie hasło"
                          : "Mocne hasło"}
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potwierdź hasło</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} data-testid="confirm-password-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="submit-button">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetowanie hasła...
                </>
              ) : (
                "Resetuj hasło"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline" data-testid="login-link">
            Powrót do logowania
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
