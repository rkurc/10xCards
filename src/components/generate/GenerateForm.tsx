import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { useGenerationContext } from "../../contexts/generation-context";
import { useToast } from "../ui/use-toast";

export function GenerateForm() {
  const { toast } = useToast();
  const { text, setText, targetCount, setTargetCount, setGenerationId, setCurrentStep } = useGenerationContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      setError("Please enter some text to generate flashcards.");
      return;
    }

    if (text.length < 100) {
      setError("Please enter at least 100 characters for better results.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/generation/process-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          target_count: targetCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation process");
      }

      const data = await response.json();
      setGenerationId(data.generation_id);
      setCurrentStep("processing");

      toast({
        title: "Generation started",
        description: `Estimated time: ${data.estimated_time_seconds} seconds`,
      });
    } catch (error) {
      console.error("Error starting generation:", error);
      setError("An error occurred while starting the generation process. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start generation process. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Generate New Flashcards</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="text">Paste your text below</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the text you want to generate flashcards from..."
              rows={10}
              required
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Character count: {text.length}
              {text.length < 100 && text.length > 0 && " (minimum 100 characters required)"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-count">Target number of flashcards</Label>
            <Input
              id="target-count"
              type="number"
              min={1}
              max={50}
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value) || 10)}
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">You can generate up to 50 flashcards at once</p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button type="submit" disabled={isSubmitting || text.length < 100} className="min-w-[120px]">
            {isSubmitting ? "Processing..." : "Generate Cards"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
