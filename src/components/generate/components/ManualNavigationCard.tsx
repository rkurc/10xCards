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
          <h3 className="text-sm font-medium mb-2">Having trouble?</h3>
          <p className="text-sm text-gray-500 mb-4">
            If processing is taking too long, you can manually continue to the review page.
          </p>
          <Button variant="outline" onClick={onNavigate} className="w-full">
            Go to Review Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
