import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

export type GenerationStep = "input" | "processing" | "review" | "complete";

interface GenerationCard {
  id: string;
  front_content: string;
  back_content: string;
  readability_score: number;
  isAccepted?: boolean;
  isRejected?: boolean;
}

interface GenerationStats {
  text_length: number;
  generated_count: number;
  generation_time_ms: number;
}

interface GenerationContextType {
  currentStep: GenerationStep;
  setCurrentStep: (step: GenerationStep) => void;
  generationId: string | null;
  setGenerationId: (id: string | null) => void;
  text: string;
  setText: (text: string) => void;
  targetCount: number;
  setTargetCount: (count: number) => void;
  cards: GenerationCard[];
  setCards: (cards: GenerationCard[]) => void;
  stats: GenerationStats | null;
  setStats: (stats: GenerationStats | null) => void;
  resetGeneration: () => void;
  updateGenerationState: (id: string, step?: GenerationStep) => void;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export const useGenerationContext = () => {
  const context = useContext(GenerationContext);

  if (context === undefined) {
    throw new Error("useGenerationContext must be used within a GenerationProvider");
  }

  return context;
};

export const GenerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<GenerationStep>("input");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [targetCount, setTargetCount] = useState(10);
  const [cards, setCards] = useState<GenerationCard[]>([]);
  const [stats, setStats] = useState<GenerationStats | null>(null);

  const updateGenerationState = useCallback((id: string, step?: GenerationStep) => {
    console.log(`[CONTEXT] Atomic update - ID: ${id}, Step: ${step || "unchanged"}`);

    setGenerationId(id);

    if (step) {
      setCurrentStep(step);
    }

    try {
      sessionStorage.setItem("flashcard_generation_id", id);
      if (step) {
        sessionStorage.setItem("flashcard_generation_step", step);
      }
    } catch (e) {
      console.error("[CONTEXT] Failed to persist to session storage", e);
    }
  }, []);

  useEffect(() => {
    console.log("[CONTEXT] Generation context state updated:", {
      currentStep,
      generationId,
      cardsCount: cards.length,
    });

    if (!generationId) {
      const storedId = sessionStorage.getItem("flashcard_generation_id");
      if (storedId) {
        console.log(`[CONTEXT] Recovering generation ID from session storage: ${storedId}`);
        setGenerationId(storedId);
      }
    }
  }, [currentStep, generationId, cards.length]);

  const resetGeneration = useCallback(() => {
    console.log("[CONTEXT] Resetting generation state");
    setCurrentStep("input");
    setGenerationId(null);
    setText("");
    setCards([]);
    setStats(null);

    try {
      sessionStorage.removeItem("flashcard_generation_id");
      sessionStorage.removeItem("flashcard_generation_step");
    } catch (e) {
      console.error("[CONTEXT] Failed to clear session storage", e);
    }
  }, []);

  const contextValue: GenerationContextType = {
    currentStep,
    setCurrentStep,
    generationId,
    setGenerationId,
    text,
    setText,
    targetCount,
    setTargetCount,
    cards,
    setCards,
    stats,
    setStats,
    resetGeneration,
    updateGenerationState,
  };

  return <GenerationContext.Provider value={contextValue}>{children}</GenerationContext.Provider>;
};
