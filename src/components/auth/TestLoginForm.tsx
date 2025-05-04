import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { showAuthError } from "@/utils/auth-error-handler";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Import the AuthService
import { AuthService } from "@/services/auth.service";
import { createBrowserSupabaseClient } from "@/lib/supabase.client";

export function TestLoginForm() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createIfNotExists, setCreateIfNotExists] = useState(true);

  // Create an instance of the auth service
  const authService = new AuthService(typeof window !== "undefined" ? createBrowserSupabaseClient() : null);

  // Safe navigation function
  const navigateToUrl = (url: string) => {
    try {
      // Always reset loading state before navigation
      setIsSubmitting(false);
      setIsCreatingAccount(false);

      if (typeof window !== "undefined") {
        // Use direct location change for reliability
        window.location.href = url;
      }
    } catch (error) {
      // Ensure loading state is reset even if navigation fails
      setIsSubmitting(false);
      setIsCreatingAccount(false);
      console.error("Navigation error:", error);
    }
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Only proceed if not already submitting
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    // Try to log in first
    loginUser(email, password);
  }

  async function loginUser(email: string, password: string) {
    try {
      // Use the auth service for login
      const result = await authService.login(email, password);

      if (!result.success) {
        // If login fails and we have the create option enabled, try to create the user
        if (createIfNotExists) {
          setMessage("Login failed, trying to create account...");
          await createUser(email, password);
          return;
        }

        setError(result.error || "Login failed");
        setIsSubmitting(false);
        return;
      }

      setMessage("Login successful! Redirecting...");
      toast.success("Test login successful");

      // Only using a short delay before redirect
      setTimeout(() => {
        navigateToUrl("/dashboard");
      }, 800);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      setIsSubmitting(false);
    }
  }

  async function createUser(email: string, password: string) {
    try {
      setIsCreatingAccount(true);

      // Use the auth service for registration
      const result = await authService.register(email, password, { name: "Test User" });

      if (!result.success) {
        setError(result.error || "Failed to create account");
        setIsSubmitting(false);
        setIsCreatingAccount(false);
        return;
      }

      if (result.requiresEmailConfirmation) {
        setMessage("Account created! Email confirmation required. Check Supabase dashboard to manually confirm.");
        toast.info("Account created - email confirmation required");
        // Important: reset loading states
        setIsSubmitting(false);
        setIsCreatingAccount(false);
      } else {
        setMessage("Account created and logged in! Redirecting...");
        toast.success("Test account created successfully");

        // Using a short delay to ensure toast is visible
        setTimeout(() => {
          navigateToUrl("/dashboard");
        }, 800);
      }
    } catch (error) {
      showAuthError(error, "Registration error");
      // Important: reset loading states in case of error
      setIsSubmitting(false);
      setIsCreatingAccount(false);
    }
  }

  // Cancel button handler to reset state
  function handleCancel() {
    setIsSubmitting(false);
    setIsCreatingAccount(false);
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-yellow-50 border-b border-yellow-100">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          Test Login Form
        </CardTitle>
        <CardDescription>Development tool - not for production use</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Development Only</AlertTitle>
          <AlertDescription>
            This form is for testing purposes only and should not be accessible in production.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="create-account"
              checked={createIfNotExists}
              onCheckedChange={(checked) => setCreateIfNotExists(checked as boolean)}
              disabled={isSubmitting}
            />
            <label
              htmlFor="create-account"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Create account if login fails
            </label>
          </div>

          {message && <div className="text-sm p-3 bg-green-50 text-green-700 rounded-md">{message}</div>}

          {error && <div className="text-sm p-3 bg-red-50 text-red-500 rounded-md">{error}</div>}

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isCreatingAccount ? "Creating Account..." : "Logging in..."}
                </>
              ) : (
                "Test Login"
              )}
            </Button>

            {isSubmitting && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter>
        {isSubmitting ? (
          <div className="text-xs text-gray-500">
            If the spinner gets stuck, click Cancel and try again. You can also refresh the page.
          </div>
        ) : (
          <div className="text-xs text-gray-500">
            This form automatically tries to create an account if login fails.
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
