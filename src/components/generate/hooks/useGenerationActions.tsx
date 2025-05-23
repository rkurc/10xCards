import { useCallback, useEffect } from "react";
import { useGenerationContext } from "../../../contexts/generation-context";
import { toast } from "sonner";

export function useGenerationActions() {
  // Access all context values and functions
  const context = useGenerationContext();
  const {
    currentStep,
    generationId,
    cards,
    setCards,
    setStats,
    setCurrentStep,
    resetGeneration,
    updateGenerationState,
  } = context;

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
          console.error("Error fetching generation results:", error);
          toast.error("Failed to load generation results. Please try again.");
        }
      }
    };

    fetchResults();
  }, [generationId, currentStep, cards.length, setCards, setStats]);

  // Handle processing complete
  const handleProcessingComplete = useCallback(async (): Promise<void> => {
    try {
      // First fetch the results to ensure they're in the state
      if (cards.length === 0 && generationId) {
        const response = await fetch(`/api/generation/${generationId}/results`);

        if (response.ok) {
          const data = await response.json();
          setCards(data.cards);
          setStats(data.stats);
        } else {
          throw new Error(`Failed to fetch results: ${response.status}`);
        }
      }

      if (!generationId) {
        throw new Error("No generation ID found");
      }

      // Use the atomic update function instead of individual setters
      updateGenerationState(generationId, "review");

      // Check if we have a redirect URL from sessionStorage (set in GenerateForm)
      const redirectUrl = sessionStorage.getItem("flashcard_redirect_url");

      // Navigate to the review page
      let reviewUrl = `/generate/review/${generationId}`;

      // If we have a redirect URL from the API, use it instead
      if (redirectUrl && typeof redirectUrl === "string" && redirectUrl.includes(generationId)) {
        reviewUrl = redirectUrl;
      }

      // Add debug query parameters to help track state
      reviewUrl = `${reviewUrl}?source=callback&id=${generationId}&state=review`;

      // Save state to sessionStorage before navigation
      sessionStorage.setItem("flashcard_generation_step", "review");

      // Use direct window.location for reliable navigation
      window.location.href = reviewUrl;

      // Return a promise that never resolves, since we're navigating away

      return new Promise<void>(() => {});
    } catch (error) {
      console.error(`[GENERATION-DEBUG] Error in handleProcessingComplete:`, error);

      // Even if there's an error, still update the UI state if we have a generationId
      if (generationId) {
        updateGenerationState(generationId, "review");
      } else {
        setCurrentStep("review");
      }

      // Show error toast
      toast.error("Failed to navigate to review page. Try using the manual button.", {
        duration: 5000,
        action: {
          label: "Go to Review",
          onClick: () => {
            if (generationId) {
              window.location.href = `/generate/review/${generationId}?source=error_recovery&id=${generationId}&state=review`;
            }
          },
        },
      });

      // Re-throw the error so the GenerationStatus component can catch it
      throw error;
    }
  }, [generationId, cards, setCards, setStats, setCurrentStep, updateGenerationState]);

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
      console.log("[GENERATE-CONTENT] Manual navigation to review page triggered");

      // Update state before navigation
      updateGenerationState(generationId, "review");

      // Navigate with state parameters
      window.location.href = `/generate/review/${generationId}?source=manual_navigation&id=${generationId}&state=review`;
    } else {
      toast.error("No generation ID found. Please try again.");
    }
  }, [generationId, updateGenerationState]);

  return {
    handleProcessingComplete,
    handleGenerationComplete,
    handleStartNewGeneration,
    manualNavigateToReview,
  };
}
