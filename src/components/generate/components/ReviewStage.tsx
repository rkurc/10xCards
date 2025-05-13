import React from "react";
import { useGenerationContext } from "../../../contexts/generation-context";
import { GenerationResults } from "../GenerationResults";
import { LoadingResults } from "./LoadingResults";

interface ReviewStageProps {
  onComplete: () => void;
}

export function ReviewStage({ onComplete }: ReviewStageProps) {
  const { generationId, cards, stats } = useGenerationContext();

  // Add debug logging
  console.log('[DEBUG-REVIEW-STAGE]', {
    generationId,
    cardsCount: cards.length,
    hasStats: !!stats
  });

  if (!generationId || cards.length === 0 || !stats) {
    console.log('[DEBUG-REVIEW-STAGE] Showing loading state because:', {
      noGenerationId: !generationId,
      noCards: cards.length === 0,
      noStats: !stats
    });
    return <LoadingResults />;
  }

  return <GenerationResults generationId={generationId} cards={cards} stats={stats} onComplete={onComplete} />;
}
