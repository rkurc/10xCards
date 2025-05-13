import { useState } from "react";
import { useForm, type Control, type ControllerRenderProps } from "react-hook-form";
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
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła muszą być takie same",
    path: ["passwordConfirm"],
  });

type FormValues = z.infer<typeof formSchema>;

interface Props {
  token: string;
}

interface PasswordFieldProps {
  field: ControllerRenderProps<FormValues, "password" | "passwordConfirm">;
  showStrength?: boolean;
  label: string;
  testId: string;
}

function PasswordField({ field, showStrength = false, label, testId }: PasswordFieldProps) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Input type="password" placeholder="********" {...field} data-testid={testId} />
      </FormControl>
      {showStrength && (
        <div className="mt-1 h-1 bg-gray-200 rounded" data-testid="password-strength">
          <div
            className={`h-1 rounded transition-all ${
              field.value.length === 0
                ? "w-0"
                : field.value.length < 8
                  ? "w-1/4 bg-red-500"
                  : field.value.length < 12
                    ? "w-1/2 bg-yellow-500"
                    : field.value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
                      ? "w-full bg-green-500"
                      : "w-3/4 bg-yellow-500"
            }`}
          />
        </div>
      )}
      <FormMessage />
    </FormItem>
  );
}

export function ResetPasswordForm({ token }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      passwordConfirm: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Hasło zostało zmienione");
        setIsSubmitted(true);
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        toast.error(result.error || "Nie udało się zmienić hasła");
      }
    } catch {
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Zresetuj hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        {!isSubmitted ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField<FormValues>
                control={form.control as unknown as Control<FormValues>}
                name="password"
                render={({ field }) => (
                  <PasswordField field={field} showStrength label="Nowe hasło" testId="new-password-input" />
                )}
              />
              <FormField<FormValues>
                control={form.control as unknown as Control<FormValues>}
                name="passwordConfirm"
                render={({ field }) => (
                  <PasswordField field={field} label="Potwierdź nowe hasło" testId="confirm-password-input" />
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="submit-button">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Trwa resetowanie...
                  </>
                ) : (
                  "Zresetuj hasło"
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="text-center py-4" data-testid="success-message">
            <p className="mb-4">Twoje hasło zostało zmienione pomyślnie.</p>
            <p className="text-muted-foreground text-sm">Za chwilę zostaniesz przekierowany do strony logowania.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <a href="/login" className="text-primary hover:underline" data-testid="login-link">
          Wróć do logowania
        </a>
      </CardFooter>
    </Card>
  );
}
