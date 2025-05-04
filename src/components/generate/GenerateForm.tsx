import { useState, useEffect } from "react";
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
  const [localText, setLocalText] = useState(text);

  // Sync local state with context when context changes
  useEffect(() => {
    setLocalText(text);
  }, [text]);

  // Update context after local state changes
  useEffect(() => {
    setText(localText);
  }, [localText, setText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!localText.trim()) {
      setError("Please enter some text to generate flashcards.");
      return;
    }

    if (localText.length < 100) {
      setError("Please enter at least 100 characters for better results.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      console.log("[GENERATE-FORM] Form submitted, starting processing");

      const response = await fetch("/api/generation/process-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: localText,
          target_count: targetCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation process");
      }

      const data = await response.json();
      console.log("[GENERATE-FORM] Setting state to processing with ID:", data.generation_id);
      setGenerationId(data.generation_id);
      setCurrentStep("processing");
      console.log("[GENERATE-FORM] State updated to processing");

      toast({
        title: "Generation started",
        description: `Estimated time: ${data.estimated_time_seconds} seconds`,
      });

      // Check if the API response includes a redirect URL
      if (data.redirect_url) {
        console.log(`[DEBUG] Will redirect to: ${data.redirect_url} after processing completes`);
        // Store the redirect URL to be used after processing completes
        sessionStorage.setItem("flashcard_redirect_url", data.redirect_url);
      }
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
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              placeholder="Paste the text you want to generate flashcards from..."
              rows={10}
              required
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Character count: {localText.length}
              {localText.length < 100 && localText.length > 0 && " (minimum 100 characters required)"}
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
          <Button type="submit" disabled={isSubmitting || localText.length < 100} className="min-w-[120px]">
            {isSubmitting ? "Processing..." : "Generate Cards"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
