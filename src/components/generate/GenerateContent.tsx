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

export default function GenerateContent() {
  const { currentStep, generationId, cards } = useGenerationContext();

  const { handleProcessingComplete, handleGenerationComplete, handleStartNewGeneration, manualNavigateToReview } =
    useGenerationActions();

  // Add force update mechanism for potential UI sync issues
  const [, forceUpdate] = useState({});

  // Listen for context changes that might require a forced update
  useEffect(() => {
    // Log critical state changes for debugging
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[GENERATE-CONTENT] Critical state change detected:", { currentStep, generationId });
    }

    // Force re-render to ensure UI responds to state changes
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

        {currentStep === "processing" && (
          <ProcessingStage onProcessingComplete={handleProcessingComplete} onManualNavigate={manualNavigateToReview} />
        )}

        {currentStep === "review" && <ReviewStage onComplete={handleGenerationComplete} />}

        {currentStep === "complete" && <CompleteStage onStartNewGeneration={handleStartNewGeneration} />}
      </div>
    </ErrorBoundary>
  );
}
