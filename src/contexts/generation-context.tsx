import React, { createContext, useContext, useState, ReactNode } from "react";

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
}

const defaultContext: GenerationContextType = {
  currentStep: "input",
  setCurrentStep: () => {},
  generationId: null,
  setGenerationId: () => {},
  text: "",
  setText: () => {},
  targetCount: 10,
  setTargetCount: () => {},
  cards: [],
  setCards: () => {},
  stats: null,
  setStats: () => {},
  resetGeneration: () => {},
};

const GenerationContext = createContext<GenerationContextType>(defaultContext);

export const useGenerationContext = () => useContext(GenerationContext);

export const GenerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<GenerationStep>("input");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [targetCount, setTargetCount] = useState(10);
  const [cards, setCards] = useState<GenerationCard[]>([]);
  const [stats, setStats] = useState<GenerationStats | null>(null);

  const resetGeneration = () => {
    setCurrentStep("input");
    setGenerationId(null);
    setText("");
    setCards([]);
    setStats(null);
  };

  return (
    <GenerationContext.Provider
      value={{
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
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
};
