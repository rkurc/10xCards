import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { GenerationStatus } from "../GenerationStatus";
import { ProcessingErrorFallback } from "./ProcessingErrorFallback";

interface ProcessingStatusCardProps {
  generationId: string;
  onComplete: () => Promise<void>;
}

export function ProcessingStatusCard({ generationId, onComplete }: ProcessingStatusCardProps) {
  return (
    <Card className="border-2 border-blue-500 shadow-lg">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">Przetwarzanie Twojego zapytania...</h2>
        <p className="mb-4">ID generowania: {generationId || "Nieznane"}</p>
        {generationId && (
          <ErrorBoundary
            FallbackComponent={({ error }) => <ProcessingErrorFallback error={error} generationId={generationId} />}
          >
            <GenerationStatus generationId={generationId} onComplete={onComplete} />
          </ErrorBoundary>
        )}
      </CardContent>
    </Card>
  );
}
