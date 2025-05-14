import React from "react";
import { useGenerationContext } from "../../../contexts/generation-context";
import { ProcessingStatusCard } from "./ProcessingStatusCard";
import { ManualNavigationCard } from "./ManualNavigationCard";

interface ProcessingStageProps {
  onProcessingComplete: () => Promise<void>;
  onManualNavigate: () => void;
}

export function ProcessingStage({ onProcessingComplete, onManualNavigate }: ProcessingStageProps) {
  const { generationId } = useGenerationContext();

  if (!generationId) {
    return null;
  }

  return (
    <>
      <ProcessingStatusCard generationId={generationId} onComplete={onProcessingComplete} />
      <ManualNavigationCard generationId={generationId} onNavigate={onManualNavigate} />
    </>
  );
}
