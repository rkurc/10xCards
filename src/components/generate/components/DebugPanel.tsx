import React from "react";
import { useGenerationContext } from "../../../contexts/generation-context";

export function DebugPanel() {
  const { currentStep, generationId, cards } = useGenerationContext();

  return (
    <div className="text-xs p-2 bg-gray-100 rounded mb-4">
      Debug: Step={currentStep} | ID={generationId || "none"} | Cards={cards.length}
    </div>
  );
}
