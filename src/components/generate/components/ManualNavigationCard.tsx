import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ManualNavigationCardProps {
  generationId: string;
  onNavigate: () => void;
}

export function ManualNavigationCard({ generationId, onNavigate }: ManualNavigationCardProps) {
  if (!generationId) return null;

  return (
    <div className="mt-4">
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium mb-2">Masz problemy?</h3>
          <p className="text-sm text-gray-500 mb-4">
            Jeśli przetwarzanie trwa zbyt długo, możesz ręcznie przejść do strony przeglądu.
          </p>
          <Button variant="outline" onClick={onNavigate} className="w-full">
            Przejdź do strony przeglądu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
