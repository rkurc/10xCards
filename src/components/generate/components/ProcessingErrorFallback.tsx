import React from "react";
import { Button } from "@/components/ui/button";

interface ProcessingErrorFallbackProps {
  error: Error;
  generationId?: string;
}

export function ProcessingErrorFallback({ error, generationId }: ProcessingErrorFallbackProps) {
  return (
    <div className="p-4 border border-red-500 rounded">
      <p>Błąd komponentu statusu: {error.message}</p>
      {generationId && (
        <Button onClick={() => (window.location.href = `/generate/review/${generationId}`)}>Przejdź do przeglądu</Button>
      )}
    </div>
  );
}
