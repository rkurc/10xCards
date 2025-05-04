import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CompleteStageProps {
  onStartNewGeneration: () => void;
}

export function CompleteStage({ onStartNewGeneration }: CompleteStageProps) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Flashcards Created Successfully!</h2>
        <p className="mb-6 text-muted-foreground">
          Your flashcards have been saved. You can now access them in your collection.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={onStartNewGeneration}>
            Create New Cards
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
        </div>
      </CardContent>
    </Card>
  );
}
