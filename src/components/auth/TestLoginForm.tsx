import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export function TestLoginForm() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createIfNotExists, setCreateIfNotExists] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    console.log("Test login form submitted with:", { email, password });

    // Try to log in first
    loginUser(email, password);
  }

  async function loginUser(email: string, password: string) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json", // Add this header to ensure JSON response
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important for cookies
      });

      console.log("Login API response status:", response.status);

      const text = await response.text();
      console.log("Login API response:", text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        setError("Invalid server response");
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        // If login fails and we have the create option enabled, try to create the user
        if (response.status === 401 && createIfNotExists) {
          setMessage("Login failed, trying to create account...");
          await createUser(email, password);
          return;
        }

        setError(result.error || "Login failed");
        setIsSubmitting(false);
        return;
      }

      setMessage("Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : String(error));
      setIsSubmitting(false);
    }
  }

  async function createUser(email: string, password: string) {
    try {
      setIsCreatingAccount(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          userData: { name: "Test User" },
        }),
        credentials: "include",
      });

      console.log("Register API response status:", response.status);

      const text = await response.text();
      console.log("Register API response:", text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        setError("Invalid server response");
        setIsSubmitting(false);
        setIsCreatingAccount(false);
        return;
      }

      if (!response.ok) {
        setError(result.error || "Failed to create account");
        setIsSubmitting(false);
        setIsCreatingAccount(false);
        return;
      }

      if (result.requiresEmailConfirmation) {
        setMessage("Account created! Email confirmation required. Check Supabase dashboard to manually confirm.");
      } else {
        setMessage("Account created and logged in! Redirecting...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
      setIsCreatingAccount(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Test Login Form</CardTitle>
        <CardDescription>This is a simple test form for development</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="create-account"
              checked={createIfNotExists}
              onCheckedChange={(checked) => setCreateIfNotExists(checked as boolean)}
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (isCreatingAccount ? "Creating Account..." : "Logging in...") : "Test Login"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-gray-500">This form automatically tries to create an account if login fails.</div>
      </CardFooter>
    </Card>
  );
}
