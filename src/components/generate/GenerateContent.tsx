import React, { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useGenerationContext } from "../../contexts/generation-context";
import {
  PageHeader,
  DebugPanel,
  InputStage,
  ProcessingStage,
  ReviewStage,
  CompleteStage,
  ErrorFallback,
} from "./components";
import { useGenerationActions } from "./hooks";
import { useToast } from "../ui/use-toast";
import { GenerationWrapper } from "./GenerationWrapper";

function GenerateContentInner() {
  const { currentStep, generationId, cards, updateGenerationState } = useGenerationContext();
  const { toast } = useToast();

  // Get URL parameters without using react-router-dom
  const getUrlParams = () => {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      id: searchParams.get("id"),
      state: searchParams.get("state"),
    };
  };

  const { handleProcessingComplete, handleGenerationComplete, handleStartNewGeneration, manualNavigateToReview } =
    useGenerationActions();

  // Add force update mechanism for potential UI sync issues
  const [, forceUpdate] = useState({});

  // Check URL query parameters for possible state recovery
  useEffect(() => {
    const { id: idFromUrl, state: stateFromUrl } = getUrlParams();

    if (idFromUrl && !generationId) {
      console.log(`[GENERATE-CONTENT] Recovering state from URL: id=${idFromUrl}, state=${stateFromUrl}`);

      if (stateFromUrl && (stateFromUrl === "processing" || stateFromUrl === "review")) {
        updateGenerationState(idFromUrl, stateFromUrl);
        toast({
          title: "State Recovered",
          description: `Continuing from ${stateFromUrl} state with ID: ${idFromUrl}`,
        });
      } else {
        updateGenerationState(idFromUrl);
      }
    }
  }, [generationId, updateGenerationState, toast]);

  // Listen for context changes that might require a forced update
  useEffect(() => {
    // Log critical state changes for debugging
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[GENERATE-CONTENT] Critical state change detected:", { currentStep, generationId });
    }

    // Force re-render to ensure UI responds to state changes
    console.log("[GENERATE-CONTENT] Forcing update due to state change");
    forceUpdate({});

    // If we're in processing state, make sure status UI is displayed
    if (currentStep === "processing" && generationId && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[GENERATE-CONTENT] In processing state with ID:", generationId);
    }
  }, [currentStep, generationId]);

  // Add this to debug component updates
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[GENERATE-CONTENT] Rendering with state:", {
        currentStep,
        generationId,
        cardsCount: cards.length,
      });
    }
  }, [currentStep, generationId, cards.length]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="container mx-auto py-8 space-y-8">
        <PageHeader />
        <DebugPanel />

        {currentStep === "input" && <InputStage />}

        {currentStep === "processing" && generationId && (
          <ProcessingStage onProcessingComplete={handleProcessingComplete} onManualNavigate={manualNavigateToReview} />
        )}

        {currentStep === "review" && generationId && <ReviewStage onComplete={handleGenerationComplete} />}

        {currentStep === "complete" && <CompleteStage onStartNewGeneration={handleStartNewGeneration} />}
      </div>
    </ErrorBoundary>
  );
}

// Export a wrapped version that ensures the context is available
export default function GenerateContent() {
  return (
    <GenerationWrapper>
      <GenerateContentInner />
    </GenerationWrapper>
  );
}
