import { ErrorBoundary } from "react-error-boundary";
import { useEffect, useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GenerateForm } from "./GenerateForm";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { GenerationStatus } from "./GenerationStatus";
import { GenerationResults } from "./GenerationResults";
import { useGenerationContext } from "../../contexts/generation-context";
import { Button } from "../ui/button";
import { toast } from "sonner";

// Replace the existing ErrorFallback component with this enhanced version
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        <Button variant="outline" size="sm" onClick={resetErrorBoundary} className="mt-2">
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export default function GenerateContent() {
  const { currentStep, setCurrentStep, generationId, cards, setCards, stats, setStats, resetGeneration } =
    useGenerationContext();

  // Add force update mechanism
  const [, forceUpdate] = useState({});

  // Listen for context changes that might require a forced update
  useEffect(() => {
    console.log("[GENERATE-CONTENT] Critical state change detected:", { currentStep, generationId });
    // Force re-render to ensure UI responds to state changes
    forceUpdate({});

    // If we're in processing state, make sure status UI is displayed
    if (currentStep === "processing" && generationId) {
      console.log("[GENERATE-CONTENT] In processing state with ID:", generationId);
    }
  }, [currentStep, generationId]);

  // Add this to debug component updates
  useEffect(() => {
    console.log("[GENERATE-CONTENT] Rendering with state:", {
      currentStep,
      generationId,
      cardsCount: cards.length,
    });
  }, [currentStep, generationId, cards.length]);

  useEffect(() => {
    // If we have a generationId but no cards yet, fetch the results
    const fetchResults = async () => {
      if (generationId && currentStep === "review" && cards.length === 0) {
        try {
          const response = await fetch(`/api/generation/${generationId}/results`);

          if (!response.ok) {
            throw new Error("Failed to fetch generation results");
          }

          const data = await response.json();
          setCards(data.cards);
          setStats(data.stats);
        } catch (error) {
          console.error("Error fetching generation results:", error);
          toast.error("Failed to load generation results. Please try again.");
        }
      }
    };

    fetchResults();
  }, [generationId, currentStep, cards.length, setCards, setStats]);

  // This function now explicitly returns a Promise<void> to work with the updated GenerationStatus component
  const handleProcessingComplete = useCallback(async (): Promise<void> => {
    console.log(`[GENERATION-DEBUG] handleProcessingComplete called for generation ID: ${generationId}`);

    try {
      // First fetch the results to ensure they're in the state
      if (cards.length === 0) {
        console.log(`[GENERATION-DEBUG] Fetching results before redirection`);
        const response = await fetch(`/api/generation/${generationId}/results`);

        if (response.ok) {
          const data = await response.json();
          setCards(data.cards);
          setStats(data.stats);
          console.log(`[GENERATION-DEBUG] Successfully loaded ${data.cards.length} cards`);
        } else {
          throw new Error(`Failed to fetch results: ${response.status}`);
        }
      }

      // Update the UI state
      setCurrentStep("review");

      // Check if we have a redirect URL from sessionStorage (set in GenerateForm)
      const redirectUrl = sessionStorage.getItem("flashcard_redirect_url");

      // Navigate to the review page
      let reviewUrl = `/generate/review/${generationId}`;

      // If we have a redirect URL from the API, use it instead
      if (redirectUrl && redirectUrl.includes(generationId)) {
        console.log(`[GENERATION-DEBUG] Using redirect URL from API: ${redirectUrl}`);
        reviewUrl = redirectUrl;
      }

      console.log(`[GENERATION-DEBUG] Redirecting to: ${reviewUrl}`);

      // Add a debug query parameter so we can track navigation source
      reviewUrl = `${reviewUrl}?source=callback`;

      // Use direct window.location for reliable navigation
      window.location.href = reviewUrl;

      // Return a promise that never resolves, since we're navigating away
      return new Promise<void>(() => {});
    } catch (error) {
      console.error(`[GENERATION-DEBUG] Error in handleProcessingComplete:`, error);
      // Even if there's an error, still update the UI state
      setCurrentStep("review");

      // Show error toast
      toast.error("Failed to navigate to review page. Try using the manual button.", {
        duration: 5000,
        action: {
          label: "Go to Review",
          onClick: () => (window.location.href = `/generate/review/${generationId}?source=error_recovery`),
        },
      });

      // Re-throw the error so the GenerationStatus component can catch it
      throw error;
    }
  }, [generationId, cards, setCards, setStats, setCurrentStep]);

  const handleGenerationComplete = useCallback(() => {
    setCurrentStep("complete");
  }, [setCurrentStep]);

  const handleStartNewGeneration = useCallback(() => {
    resetGeneration();
  }, [resetGeneration]);

  // Add this function to manually navigate to the review page if needed
  const manualNavigateToReview = useCallback(() => {
    if (generationId) {
      console.log("[GENERATE-CONTENT] Manual navigation to review page triggered");
      window.location.href = `/generate/review/${generationId}?source=manual_navigation`;
    }
  }, [generationId]);

  console.info("[DEBUG] generationId:", generationId);
  console.info("[DEBUG] currentStep:", currentStep);
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="container mx-auto py-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Generate Flashcards</h1>

        {/* Debug info */}
        <div className="text-xs p-2 bg-gray-100 rounded mb-4">
          Debug: Step={currentStep} | ID={generationId || "none"} | Cards={cards.length}
        </div>

        {currentStep === "input" && <GenerateForm />}

        {currentStep === "processing" && (
          <Card className="border-2 border-blue-500 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4">Processing Your Request...</h2>
              <p className="mb-4">Generation ID: {generationId || "Unknown"}</p>
              {generationId && (
                <ErrorBoundary
                  FallbackComponent={({ error }) => (
                    <div className="p-4 border border-red-500 rounded">
                      <p>Error with status component: {error.message}</p>
                      <Button onClick={() => (window.location.href = `/generate/review/${generationId}`)}>
                        Go to Review
                      </Button>
                    </div>
                  )}
                >
                  <GenerationStatus generationId={generationId} onComplete={handleProcessingComplete} />
                </ErrorBoundary>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === "processing" && generationId && (
          <div className="mt-4">
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-2">Having trouble?</h3>
                <p className="text-sm text-gray-500 mb-4">
                  If processing is taking too long, you can manually continue to the review page.
                </p>
                <Button variant="outline" onClick={manualNavigateToReview} className="w-full">
                  Go to Review Page
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === "review" && generationId && cards.length > 0 && stats && (
          <GenerationResults
            generationId={generationId}
            cards={cards}
            stats={stats}
            onComplete={handleGenerationComplete}
          />
        )}

        {currentStep === "complete" && (
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Flashcards Created Successfully!</h2>
              <p className="mb-6 text-muted-foreground">
                Your flashcards have been saved. You can now access them in your collection.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleStartNewGeneration}>
                  Create New Cards
                </Button>
                <Button onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}
