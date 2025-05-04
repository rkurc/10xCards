import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2 } from "lucide-react";

interface GenerationStatusProps {
  generationId: string;
  onComplete: () => void;
}

export function GenerationStatus({ generationId, onComplete }: GenerationStatusProps) {
  const [status, setStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Form ref for direct navigation

  // Critical fix: Implement proper status polling
  useEffect(() => {
    console.log(`[GENERATION-STATUS] Setting up polling for generation ID: ${generationId}`);

    // Define the polling function
    const checkStatus = async () => {
      try {
        console.log(`[GENERATION-STATUS] Checking status for generation ID: ${generationId}`);
        const response = await fetch(`/api/generation/${generationId}/status`);

        if (!response.ok) {
          console.error(`[GENERATION-STATUS] API error: ${response.status}`);
          throw new Error(`Status API returned ${response.status}`);
        }

        const data = await response.json();
        console.log(`[GENERATION-STATUS] Status response:`, data);

        setStatus(data.status);
        setProgress(data.progress || 0);

        if (data.error) {
          setError(data.error);
        }

        if (data.status === "completed") {
          console.log(`[GENERATION-STATUS] Generation completed, calling onComplete`);
          onComplete();
        } else if (data.status !== "failed") {
          // Continue polling if not completed or failed
          console.log(
            `[GENERATION-STATUS] Status: ${data.status}, progress: ${data.progress || 0}%, polling again in 2s`
          );
          setTimeout(checkStatus, 2000);
        }
      } catch (err) {
        console.error(`[GENERATION-STATUS] Error in status check:`, err);
        setError(`Failed to check generation status: ${err instanceof Error ? err.message : String(err)}`);

        // Try again after a delay even if there was an error
        setTimeout(checkStatus, 5000);
      }
    };

    // Immediately start polling
    checkStatus();

    // Cleanup function to cancel any pending timeouts
    return () => {
      console.log(`[GENERATION-STATUS] Polling stopped - component unmounting`);
    };
  }, [generationId, onComplete]);

  // Render the UI
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Status: {status}</div>
        <div className="text-sm text-muted-foreground">{progress}% complete</div>
      </div>

      <Progress value={progress} className="h-2" />

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(status === "pending" || status === "processing") && (
        <div className="flex items-center justify-center mt-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Processing your flashcards...</span>
        </div>
      )}

      {status === "failed" && (
        <Button
          onClick={() => (window.location.href = `/generate/review/${generationId}?source=error_recovery`)}
          className="w-full mt-4"
        >
          Continue to Review Page
        </Button>
      )}
    </div>
  );
}
