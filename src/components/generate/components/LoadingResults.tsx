import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoadingResults() {
  return (
    <Card className="w-full p-6">
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading flashcard results...</p>
      </CardContent>
    </Card>
  );
}
