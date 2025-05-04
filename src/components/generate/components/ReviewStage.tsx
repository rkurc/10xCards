import React from "react";
import { useGenerationContext } from "../../../contexts/generation-context";
import { GenerationResults } from "../GenerationResults";
import { LoadingResults } from "./LoadingResults";

interface ReviewStageProps {
  onComplete: () => void;
}

export function ReviewStage({ onComplete }: ReviewStageProps) {
  const { generationId, cards, stats } = useGenerationContext();

  if (!generationId || cards.length === 0 || !stats) {
    return <LoadingResults />;
  }

  return <GenerationResults generationId={generationId} cards={cards} stats={stats} onComplete={onComplete} />;
}
