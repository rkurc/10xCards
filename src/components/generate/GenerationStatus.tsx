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
  const [isNavigating, setIsNavigating] = useState(false);
  const reviewUrl = `/generate/review/${generationId}`;
  
  // Form ref for direct navigation
  const formRef = React.useRef<HTMLFormElement>(null);

  // Enhanced logging in the mount effect
  useEffect(() => {
    console.log(`[GENERATION-STATUS] Component mounted with generationId: ${generationId}`);
    
    // Log the props and state on mount
    console.log('[GENERATION-STATUS] Initial state:', {
      status,
      progress,
      error,
      isNavigating,
      reviewUrl
    });
    
    return () => {
      console.log(`[GENERATION-STATUS] Component unmounting`);
    };
  }, [generationId, status, progress, error, isNavigating, reviewUrl]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        console.log(`[GENERATION-STATUS] Checking status for generation ID: ${generationId}`);
        const response = await fetch(`/api/generation/${generationId}/status`);

        if (!response.ok) {
          console.error(`[GENERATION-DEBUG] Status API error: ${response.status}`);
          throw new Error(`Status API returned ${response.status}`);
        }

        const data = await response.json();
        console.log(`[GENERATION-DEBUG] Status response:`, data);

        setStatus(data.status);
        setProgress(data.progress);

        if (data.error) {
          console.error(`[GENERATION-DEBUG] Error in status response:`, data.error);
          setError(data.error);
        }

        if (data.status === "completed") {
          console.log(`[GENERATION-DEBUG] Generation is complete! Attempting navigation...`);
          // Call onComplete for context updates
          onComplete();
          
          // Directly submit the form after a short delay to ensure the DOM is ready
          setTimeout(() => {
            if (formRef.current) {
              console.log(`[GENERATION-DEBUG] Submitting form to navigate to: ${reviewUrl}`);
              formRef.current.submit();
            } else {
              console.error(`[GENERATION-DEBUG] Form reference not available!`);
            }
          }, 100);
        } else if (data.status !== "failed") {
          // Continue polling if not completed or failed
          console.log(`[GENERATION-DEBUG] Status: ${data.status}, progress: ${data.progress}%. Polling again in 2s.`);
          setTimeout(checkStatus, 2000);
        }
      } catch (err) {
        console.error(`[GENERATION-STATUS] Error in status check:`, err);
        setError("Failed to check generation status. Please try again.");
        setStatus("failed");
      }
    };

    console.log('[GENERATION-STATUS] Setting up status polling');
    // Start the polling process
    checkStatus();
  }, [generationId, onComplete, reviewUrl]);

  const goToReviewPage = () => {
    try {
      console.log(`[GENERATION-DEBUG] Manually navigating via form submission`);
      setIsNavigating(true);
      
      // Submit the form for navigation
      if (formRef.current) {
        formRef.current.submit();
      } else {
        // Fallback to direct navigation if form ref is not available
        console.log(`[GENERATION-DEBUG] Form ref not available, using direct navigation`);
        window.location.href = reviewUrl;
      }
    } catch (err) {
      console.error('[GENERATION-DEBUG] Navigation error:', err);
      setIsNavigating(false);
      setError("Failed to navigate to review page. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden form for reliable navigation */}
      <form 
        ref={formRef} 
        method="get" 
        action={reviewUrl} 
        style={{ display: 'none' }}
        data-testid="navigation-form"
      >
        <input type="hidden" name="source" value="auto" />
        <input type="hidden" name="generation_id" value={generationId} />
        <button type="submit">Navigate</button>
      </form>

      <h3 className="text-lg font-medium">
        {status === "pending" && "Preparing generation..."}
        {status === "processing" && "Generating your flashcards..."}
        {status === "completed" && "Generation complete!"}
        {status === "failed" && "Generation failed"}
      </h3>

      <Progress value={progress} className="w-full" />

      <p className="text-sm text-muted-foreground">
        {status === "pending" && "Your request is in the queue."}
        {status === "processing" && `Progress: ${progress}%`}
        {status === "completed" && "All flashcards have been generated successfully."}
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {status === "completed" && (
        <div className="mt-4">
          <Button onClick={goToReviewPage} className="w-full" disabled={isNavigating}>
            {isNavigating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Navigating to Review...</span>
              </>
            ) : (
              "View Generated Flashcards"
            )}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            If you are not redirected automatically, click the button above.
          </p>
        </div>
      )}

      {status === "failed" && <Button onClick={() => window.location.reload()}>Try Again</Button>}
    </div>
  );
}
