import { useCallback, useEffect } from "react";
import { useGenerationContext } from "../../../contexts/generation-context";
import { toast } from "sonner";

export function useGenerationActions() {
  // Access the context values individually to avoid formatting issues
  const context = useGenerationContext();
  const currentStep = context.currentStep;
  const setCurrentStep = context.setCurrentStep;
  const generationId = context.generationId;
  const cards = context.cards;
  const setCards = context.setCards;
  const setStats = context.setStats;
  const resetGeneration = context.resetGeneration;

  // Fetch results when needed
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
          // eslint-disable-next-line no-console
          console.error("Error fetching generation results:", error);
          toast.error("Failed to load generation results. Please try again.");
        }
      }
    };

    fetchResults();
  }, [generationId, currentStep, cards.length, setCards, setStats]);

  // Handle processing complete
  const handleProcessingComplete = useCallback(async (): Promise<void> => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[GENERATION-DEBUG] handleProcessingComplete called for generation ID: ${generationId}`);
    }

    try {
      // First fetch the results to ensure they're in the state
      if (cards.length === 0) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log(`[GENERATION-DEBUG] Fetching results before redirection`);
        }
        const response = await fetch(`/api/generation/${generationId}/results`);

        if (response.ok) {
          const data = await response.json();
          setCards(data.cards);
          setStats(data.stats);
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.log(`[GENERATION-DEBUG] Successfully loaded ${data.cards.length} cards`);
          }
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
      if (redirectUrl && generationId) {
        // Only check includes if redirectUrl is not null
        const redirectContainsId = redirectUrl.includes(generationId);
        
        if (redirectContainsId) {
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.log(`[GENERATION-DEBUG] Using redirect URL from API: ${redirectUrl}`);
          }
          reviewUrl = redirectUrl;
        }
      }

      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log(`[GENERATION-DEBUG] Redirecting to: ${reviewUrl}`);
      }

      // Add a debug query parameter so we can track navigation source
      reviewUrl = `${reviewUrl}?source=callback`;

      // Use direct window.location for reliable navigation
      window.location.href = reviewUrl;

      // Return a promise that never resolves, since we're navigating away
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return new Promise<void>(() => {});
    } catch (error) {
      // eslint-disable-next-line no-console
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

  // Handle generation complete
  const handleGenerationComplete = useCallback(() => {
    setCurrentStep("complete");
  }, [setCurrentStep]);

  // Handle starting a new generation
  const handleStartNewGeneration = useCallback(() => {
    resetGeneration();
  }, [resetGeneration]);

  // Manual navigation to review page
  const manualNavigateToReview = useCallback(() => {
    if (generationId) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log("[GENERATE-CONTENT] Manual navigation to review page triggered");
      }
      window.location.href = `/generate/review/${generationId}?source=manual_navigation`;
    }
  }, [generationId]);

  return {
    handleProcessingComplete,
    handleGenerationComplete,
    handleStartNewGeneration,
    manualNavigateToReview,
  };
}
