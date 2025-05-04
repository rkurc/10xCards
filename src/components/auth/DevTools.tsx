import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function DevTools() {
  const [isCreating, setIsCreating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  async function createTestUser() {
    setIsCreating(true);
    setError(null);
    setConfirmationResult(null);
    try {
      const response = await fetch("/api/auth/create-test-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse response:", text);
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create test user");
      }

      setResult(data);
    } catch (error) {
      console.error("Error creating test user:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreating(false);
    }
  }

  async function confirmTestUser() {
    setIsConfirming(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/confirm-test-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "test@example.com" }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse response:", text);
        throw new Error("Invalid server response");
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to confirm test user");
      }

      setConfirmationResult(data);
    } catch (error) {
      console.error("Error confirming test user:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Development Tools</CardTitle>
        <CardDescription>Tools to help with testing and development</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={createTestUser} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? "Creating..." : "Create Test User"}
            </Button>
            
            {result?.requiresEmailConfirmation && (
              <Button 
                onClick={confirmTestUser} 
                disabled={isConfirming}
                variant="outline"
                className="w-full"
              >
                {isConfirming ? "Confirming..." : "Confirm Test User"}
              </Button>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md">
              Error: {error}
            </div>
          )}

          {result && (
            <div className="text-sm p-3 bg-green-50 rounded-md">
              <div className="font-semibold">{result.message}</div>
              {result.user && (
                <div className="mt-2">
                  <div>Email: <span className="font-mono">{result.user.email}</span></div>
                  <div>Password: <span className="font-mono">{result.user.password}</span></div>
                  {result.requiresEmailConfirmation && !confirmationResult && (
                    <div className="mt-2 text-amber-600">
                      Note: Email confirmation is required. Click the "Confirm Test User" button above
                      to confirm this user without email verification.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {confirmationResult && (
            <div className="text-sm p-3 bg-green-50 rounded-md">
              <div className="font-semibold text-green-700">✓ {confirmationResult.message}</div>
              <div className="mt-1">
                You can now sign in with the test user credentials.
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        These tools are only available in development mode.
      </CardFooter>
    </Card>
  );
}